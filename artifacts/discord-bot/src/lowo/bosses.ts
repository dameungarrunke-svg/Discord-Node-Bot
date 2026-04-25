import type { Message } from "discord.js";
import { getUser, updateUser } from "./storage.js";
import { ANIMAL_BY_ID, ACTIVE_SKILLS } from "./data.js";
import { emoji, progressBar } from "./emojis.js";
import { eventBonus } from "./events.js";

export interface ActiveBoss {
  id: string;
  guildId: string;
  channelId: string | null;
  name: string;
  emoji: string;
  hp: number;
  maxHp: number;
  spawnedAt: number;
  expiresAt: number;
  damage: Record<string, number>;
  killed: boolean;
  rewardPool: number;
  essencePool: number;
}

const BOSS_TEMPLATES: Array<{ id: string; name: string; emoji: string; hp: number; reward: number; essence: number }> = [
  { id: "ember_titan",     name: "Ember Titan",       emoji: "🔥🗿", hp: 6000,   reward: 8000,   essence: 60  },
  { id: "frost_warden",    name: "Frost Warden",      emoji: "❄️🛡️", hp: 7500,   reward: 10000,  essence: 80  },
  { id: "stormbringer",    name: "Stormbringer",      emoji: "⚡🌩️", hp: 9000,   reward: 12000,  essence: 100 },
  { id: "abyss_serpent",   name: "Abyss Serpent",     emoji: "🌊🐉", hp: 12000,  reward: 18000,  essence: 140 },
  { id: "void_colossus",   name: "Void Colossus",     emoji: "🕳️🦣", hp: 18000,  reward: 30000,  essence: 220 },
  { id: "cosmic_maw",      name: "Cosmic Maw",        emoji: "🌌🐲", hp: 22000,  reward: 38000,  essence: 280 },
];

const BOSS_LIFETIME_MS = 30 * 60 * 1000;     // 30 min auto-expire
const SPAWN_WINDOW_MS  = 10 * 60 * 1000;     // unique-user window
const SPAWN_MIN_USERS  = 3;                  // 3+ players → boss spawn allowed
const SPAWN_COOLDOWN_MS = 90 * 60 * 1000;    // at most 1 boss / 90 min / guild
const SPAWN_CHANCE = 0.20;                   // each qualifying tick has 20% chance

const activeBosses = new Map<string, ActiveBoss>();   // guildId -> boss
const recentActivity = new Map<string, Map<string, number>>(); // guildId -> (userId -> ts)
const lastSpawnAt = new Map<string, number>();        // guildId -> ts

/** Call this on EVERY successful lowo command from a user in a guild. */
export function recordLowoActivity(message: Message): void {
  const gid = message.guildId;
  if (!gid) return;
  const channelId = message.channelId;
  let log = recentActivity.get(gid);
  if (!log) { log = new Map(); recentActivity.set(gid, log); }
  const now = Date.now();
  log.set(message.author.id, now);
  // Prune
  for (const [uid, ts] of log) if (now - ts > SPAWN_WINDOW_MS) log.delete(uid);

  // Decide whether to spawn
  if (activeBosses.has(gid)) return;
  if ((lastSpawnAt.get(gid) ?? 0) > now - SPAWN_COOLDOWN_MS) return;
  if (log.size < SPAWN_MIN_USERS) return;

  // Boss invasion event makes this much more likely
  const chance = SPAWN_CHANCE * (eventBonus("boss_invasion") > 1 ? 4 : 1);
  if (Math.random() > chance) return;

  spawnBoss(gid, channelId, message);
}

function spawnBoss(guildId: string, channelId: string | null, message: Message): void {
  const tpl = BOSS_TEMPLATES[Math.floor(Math.random() * BOSS_TEMPLATES.length)];
  const boss: ActiveBoss = {
    id: tpl.id, guildId, channelId,
    name: tpl.name, emoji: tpl.emoji,
    hp: tpl.hp, maxHp: tpl.hp,
    spawnedAt: Date.now(),
    expiresAt: Date.now() + BOSS_LIFETIME_MS,
    damage: {}, killed: false,
    rewardPool: tpl.reward, essencePool: tpl.essence,
  };
  activeBosses.set(guildId, boss);
  lastSpawnAt.set(guildId, Date.now());
  // Announce
  const ch = message.channel;
  if (ch && "send" in ch) {
    ch.send(
      `${emoji("boss")} **A WORLD BOSS APPEARED!** ${boss.emoji} **${boss.name}** *(HP: ${boss.maxHp.toLocaleString()})*\n` +
      `Anyone in this server can attack it with \`lowo attackboss [skillId]\`.\n` +
      `Top damage dealer at the end gets the biggest cut. Boss vanishes in **30 min**.`,
    ).catch(() => {});
  }
}

export function isBossActive(guildId: string | null): boolean {
  if (!guildId) return false;
  const b = activeBosses.get(guildId);
  if (!b) return false;
  if (b.killed || Date.now() > b.expiresAt) { resolveBoss(guildId); return false; }
  return true;
}

export function getBoss(guildId: string | null): ActiveBoss | null {
  if (!guildId) return null;
  return activeBosses.get(guildId) ?? null;
}

/**
 * Inflict damage on the active boss in this guild. Used by mining/skill chips
 * outside the dedicated `attackboss` command.
 */
export async function bossTakeDamage(message: Message, dmg: number, source = "attack"): Promise<void> {
  const gid = message.guildId; if (!gid) return;
  if (!isBossActive(gid)) return;
  const boss = activeBosses.get(gid)!;
  boss.damage[message.author.id] = (boss.damage[message.author.id] ?? 0) + dmg;
  boss.hp = Math.max(0, boss.hp - dmg);
  if (source === "attackboss") {
    // No-op; the calling command will report.
  }
  if (boss.hp <= 0) { boss.killed = true; resolveBoss(gid, message); }
}

function resolveBoss(guildId: string, message?: Message): void {
  const boss = activeBosses.get(guildId);
  if (!boss) return;
  activeBosses.delete(guildId);

  const totalDmg = Object.values(boss.damage).reduce((a, b) => a + b, 0);
  const sortedAttackers = Object.entries(boss.damage).sort((a, b) => b[1] - a[1]);

  const lines: string[] = [];
  if (boss.killed) {
    lines.push(`${emoji("trophy")} **${boss.emoji} ${boss.name} has been DEFEATED!**`);
  } else {
    lines.push(`💨 **${boss.emoji} ${boss.name} retreats.** *(${boss.hp.toLocaleString()} HP remained)*`);
  }
  if (sortedAttackers.length === 0) {
    lines.push("_(No one attacked. Better luck next spawn.)_");
  } else {
    let topUserId: string | null = null;
    for (let i = 0; i < sortedAttackers.length; i++) {
      const [uid, d] = sortedAttackers[i];
      const share = totalDmg > 0 ? d / totalDmg : 0;
      const reward = Math.floor((boss.killed ? boss.rewardPool : boss.rewardPool * 0.3) * share);
      const ess    = Math.floor((boss.killed ? boss.essencePool : boss.essencePool * 0.3) * share);
      updateUser(uid, (x) => {
        x.cowoncy += reward;
        x.essence += ess;
        if (boss.killed) x.bossKills += 1;
      });
      if (i === 0) topUserId = uid;
      lines.push(`**${i + 1}.** <@${uid}> — ${d.toLocaleString()} dmg → +${reward.toLocaleString()} cowoncy, +${ess} ✨`);
    }
    if (topUserId) lines.push(`\n${emoji("crown")} Top damage dealer: <@${topUserId}>`);
  }
  // Try to broadcast in the channel where the kill happened, fallback to spawn channel
  const ch = message?.channel ?? null;
  if (ch && "send" in ch) {
    ch.send(lines.join("\n")).catch(() => {});
  }
}

// ─── Player command: `lowo attackboss [skillId]` ─────────────────────────────
const ATTACK_CD_MS = 12_000;
const lastAttack = new Map<string, number>();   // userId -> ts

export async function cmdAttackBoss(message: Message, args: string[]): Promise<void> {
  if (!message.guildId) { await message.reply("❌ World bosses live in servers — try this in a guild channel."); return; }
  const boss = getBoss(message.guildId);
  if (!boss || !isBossActive(message.guildId)) {
    await message.reply(`${emoji("boss")} No boss active right now. Bosses spawn when 3+ people are using lowo in this server.`);
    return;
  }
  const now = Date.now();
  const last = lastAttack.get(message.author.id) ?? 0;
  if (now - last < ATTACK_CD_MS) {
    await message.reply(`⏳ Catch your breath — attack again in **${Math.ceil((ATTACK_CD_MS - (now - last)) / 1000)}s**.`);
    return;
  }

  // Build damage from the user's first team pet + chosen skill (defaults to basic_strike)
  const u = getUser(message.author.id);
  if (u.team.length === 0) { await message.reply("❌ Build a team first: `lowo team add <pet>`."); return; }
  const leadId = u.team[0];
  const lead = ANIMAL_BY_ID[leadId];
  if (!lead) { await message.reply("❌ Your lead pet looks broken."); return; }
  const skillId = (args[0] ?? "basic_strike").toLowerCase();
  const skill = ACTIVE_SKILLS[skillId] ?? ACTIVE_SKILLS["basic_strike"];

  // Stat with weapon mods if available
  let atk = lead.atk;
  let mag = lead.mag;
  const wIdx = u.equipped[leadId] != null ? parseInt(u.equipped[leadId], 10) : NaN;
  if (!isNaN(wIdx) && u.weapons[wIdx]) {
    atk += u.weapons[wIdx].mods.atk;
    mag += u.weapons[wIdx].mods.mag;
  }
  const accIdx = u.equippedAccessory[leadId] != null ? parseInt(u.equippedAccessory[leadId], 10) : NaN;
  if (!isNaN(accIdx) && u.accessories[accIdx]) {
    atk += u.accessories[accIdx].mods.atk;
    mag += u.accessories[accIdx].mods.mag;
  }

  // Damage formula based on skill kind
  let base = atk * skill.power;
  if (skill.kind === "aoe")          base = atk * skill.power * 1.0;       // bosses count as one target
  if (skill.id === "arcane_bolt")    base = mag * skill.power;
  if (skill.id === "celestial_banish") base = mag * skill.power;
  const variance = 0.85 + Math.random() * 0.30;
  let dmg = Math.max(20, Math.floor(base * variance));
  if (eventBonus("blood_moon") > 1) dmg = Math.floor(dmg * 1.5);

  lastAttack.set(message.author.id, now);
  boss.damage[message.author.id] = (boss.damage[message.author.id] ?? 0) + dmg;
  boss.hp = Math.max(0, boss.hp - dmg);

  const bar = progressBar(boss.hp, boss.maxHp, 16);
  if (boss.hp <= 0) {
    boss.killed = true;
    resolveBoss(message.guildId!, message);
    await message.reply(
      `${emoji("boss")} ${skill.emoji} **${lead.name}** unleashes **${skill.name}** for **${dmg.toLocaleString()}** dmg — and ${boss.emoji} **${boss.name}** is **DEFEATED**!`,
    );
  } else {
    await message.reply(
      `${emoji("boss")} ${skill.emoji} **${lead.name}** uses **${skill.name}** for **${dmg.toLocaleString()}** damage!\n` +
      `${boss.emoji} **${boss.name}** HP: \`[${bar}]\` ${boss.hp.toLocaleString()}/${boss.maxHp.toLocaleString()}`,
    );
  }
}

export async function cmdBossInfo(message: Message): Promise<void> {
  if (!message.guildId) { await message.reply("❌ Server-only."); return; }
  const boss = getBoss(message.guildId);
  if (!boss || !isBossActive(message.guildId)) {
    await message.reply(`${emoji("boss")} No active boss in this server right now.`);
    return;
  }
  const bar = progressBar(boss.hp, boss.maxHp, 16);
  const top = Object.entries(boss.damage).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const lines = [
    `${emoji("boss")} **${boss.emoji} ${boss.name}** — \`[${bar}]\` ${boss.hp.toLocaleString()}/${boss.maxHp.toLocaleString()}`,
    `⏳ Vanishes <t:${Math.floor(boss.expiresAt / 1000)}:R>`,
  ];
  if (top.length) {
    lines.push("\n__Damage leaderboard__");
    top.forEach(([uid, d], i) => lines.push(`**${i + 1}.** <@${uid}> — ${d.toLocaleString()} dmg`));
  } else {
    lines.push("_(No one has attacked yet — \`lowo attackboss\` to start!)_");
  }
  await message.reply(lines.join("\n"));
}
