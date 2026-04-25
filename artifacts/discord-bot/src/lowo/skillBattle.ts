import type { Message } from "discord.js";
import { getUser, updateUser } from "./storage.js";
import { ANIMAL_BY_ID, ACTIVE_SKILLS, ACCESSORY_BY_ID, ARMOR_BY_ID, type ActiveSkill } from "./data.js";
import { emoji, progressBar } from "./emojis.js";

interface SBPet {
  id: string;
  name: string;
  emoji: string;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  mag: number;
  crit: number;
  skills: string[];          // 5 skill ids (some may be "")
  cd: Record<string, number>;// skillId -> turns left
  shieldFor: number;         // turns of damage halving
  stunnedFor: number;        // turns to skip
}

interface ActiveSession {
  channelId: string;
  a: { userId: string; pets: SBPet[]; cd: Record<string, number> };
  b: { userId: string; pets: SBPet[]; cd: Record<string, number> };
  turn: "a" | "b";
  round: number;
  expiresAt: number;
}

// Per-channel sessions to prevent crosstalk
const sessions = new Map<string, ActiveSession>();
// userId → channelId where they have an active session
const userSession = new Map<string, string>();
// userId → invite from another userId
const invites = new Map<string, { from: string; channelId: string; expiresAt: number }>();

const INVITE_TTL_MS  = 60_000;
const SESSION_TTL_MS = 10 * 60_000;

function buildPet(userId: string, animalId: string): SBPet | null {
  const u = getUser(userId);
  const a = ANIMAL_BY_ID[animalId];
  if (!a) return null;
  let hp = a.hp, atk = a.atk, def = a.def, mag = a.mag, crit = 0.05;
  // Weapon
  const wIdx = u.equipped[animalId] != null ? parseInt(u.equipped[animalId], 10) : NaN;
  if (!isNaN(wIdx) && u.weapons[wIdx]) {
    atk += u.weapons[wIdx].mods.atk;
    def += u.weapons[wIdx].mods.def;
    mag += u.weapons[wIdx].mods.mag;
  }
  // Armor
  const aIdx = u.equippedArmor[animalId] != null ? parseInt(u.equippedArmor[animalId], 10) : NaN;
  if (!isNaN(aIdx) && u.armor[aIdx]) {
    const armorDef = ARMOR_BY_ID[u.armor[aIdx].defId];
    if (armorDef) { hp += armorDef.mods.hp; def += armorDef.mods.def; mag += armorDef.mods.mag; }
  }
  // Accessory (3rd slot)
  const accIdx = u.equippedAccessory[animalId] != null ? parseInt(u.equippedAccessory[animalId], 10) : NaN;
  if (!isNaN(accIdx) && u.accessories[accIdx]) {
    const accDef = ACCESSORY_BY_ID[u.accessories[accIdx].defId];
    if (accDef) {
      hp  += accDef.mods.hp;
      atk += accDef.mods.atk;
      def += accDef.mods.def;
      mag += accDef.mods.mag;
      if (accDef.mods.crit) crit += accDef.mods.crit;
    }
  }
  return {
    id: animalId, name: a.name, emoji: a.emoji,
    hp, maxHp: hp, atk, def, mag, crit,
    skills: (u.petSkills[animalId] ?? []).slice(0, 5),
    cd: {}, shieldFor: 0, stunnedFor: 0,
  };
}

function buildTeam(userId: string): SBPet[] {
  const u = getUser(userId);
  const out: SBPet[] = [];
  for (const id of u.team) {
    const p = buildPet(userId, id); if (p) out.push(p);
  }
  return out;
}

function teamAlive(pets: SBPet[]): boolean { return pets.some((p) => p.hp > 0); }

function summarize(s: ActiveSession): string {
  const fmtPet = (p: SBPet) => `${p.emoji}**${p.name}** \`[${progressBar(p.hp, p.maxHp, 8)}]\` ${Math.max(0, p.hp)}/${p.maxHp}`;
  return [
    `__**<@${s.a.userId}>'s team**__`,
    s.a.pets.map((p, i) => `[${i + 1}] ${fmtPet(p)}`).join("\n"),
    "",
    `__**<@${s.b.userId}>'s team**__`,
    s.b.pets.map((p, i) => `[${i + 1}] ${fmtPet(p)}`).join("\n"),
  ].join("\n");
}

function applySkill(attacker: SBPet, defender: SBPet, defenders: SBPet[], attackers: SBPet[], skill: ActiveSkill): { logs: string[]; killed: boolean } {
  const logs: string[] = [];
  const variance = () => 0.85 + Math.random() * 0.30;
  let killed = false;

  function dealDamage(target: SBPet, base: number, opts: { ignoreDef?: boolean } = {}): number {
    if (target.hp <= 0) return 0;
    const mit = opts.ignoreDef ? 0 : target.def * 0.6;
    let d = Math.max(1, Math.floor((base - mit) * variance()));
    if (Math.random() < attacker.crit) d = Math.floor(d * 1.6);
    if (target.shieldFor > 0) d = Math.floor(d * 0.5);
    target.hp = Math.max(0, target.hp - d);
    if (target.hp <= 0) killed = true;
    return d;
  }

  switch (skill.kind) {
    case "damage": {
      const d = dealDamage(defender, attacker.atk * skill.power);
      logs.push(`💥 ${attacker.emoji}${attacker.name} → ${defender.emoji}${defender.name} for **${d}** dmg.`);
      // Inferno wave bonus burn
      if (skill.id === "inferno_wave") {
        const burn = Math.floor(defender.maxHp * 0.05);
        defender.hp = Math.max(0, defender.hp - burn);
        logs.push(`🔥 +${burn} burn damage.`);
      }
      break;
    }
    case "true_damage": {
      const d = dealDamage(defender, attacker.atk * skill.power, { ignoreDef: true });
      logs.push(`🗡️ ${attacker.emoji}${attacker.name} → ${defender.emoji}${defender.name} for **${d}** TRUE dmg.`);
      break;
    }
    case "aoe": {
      const stat = (skill.id === "celestial_banish") ? attacker.mag : attacker.atk;
      const total = defenders.reduce((s, t) => s + dealDamage(t, stat * skill.power), 0);
      logs.push(`💫 ${attacker.emoji}${attacker.name} hits all enemies — total **${total}** dmg.`);
      break;
    }
    case "lifesteal": {
      const d = dealDamage(defender, attacker.atk * skill.power);
      const heal = Math.floor(d * 0.5);
      attacker.hp = Math.min(attacker.maxHp, attacker.hp + heal);
      logs.push(`🩸 ${attacker.emoji}${attacker.name} → ${defender.emoji}${defender.name} for **${d}** dmg (+${heal} lifesteal).`);
      break;
    }
    case "heal": {
      let total = 0;
      for (const ally of attackers) {
        if (ally.hp <= 0) continue;
        const heal = Math.floor(ally.maxHp * skill.power);
        ally.hp = Math.min(ally.maxHp, ally.hp + heal);
        total += heal;
      }
      logs.push(`💚 ${attacker.emoji}${attacker.name} mends the team for **${total}** total HP.`);
      break;
    }
    case "shield": {
      attacker.shieldFor = Math.max(attacker.shieldFor, 1);
      logs.push(`🛡️ ${attacker.emoji}${attacker.name} braces — incoming damage halved next turn.`);
      break;
    }
    case "stun": {
      defender.stunnedFor = Math.max(defender.stunnedFor, 1);
      logs.push(`👁️ ${attacker.emoji}${attacker.name} stuns ${defender.emoji}${defender.name}!`);
      break;
    }
  }

  return { logs, killed };
}

function endRound(s: ActiveSession): void {
  // Decrement shields/stuns/cooldowns
  for (const p of [...s.a.pets, ...s.b.pets]) {
    if (p.shieldFor > 0) p.shieldFor--;
    if (p.stunnedFor > 0) p.stunnedFor--;
    for (const k of Object.keys(p.cd)) if (p.cd[k] > 0) p.cd[k]--;
  }
  s.round++;
  s.turn = s.turn === "a" ? "b" : "a";
}

function payoutAndCleanup(message: Message, s: ActiveSession, winnerSide: "a" | "b" | "draw"): void {
  sessions.delete(s.channelId);
  userSession.delete(s.a.userId);
  userSession.delete(s.b.userId);

  if (winnerSide === "draw") {
    message.channel && "send" in message.channel && message.channel.send(`🤝 The skill battle between <@${s.a.userId}> and <@${s.b.userId}> ends in a **draw**.`).catch(() => {});
    updateUser(s.a.userId, (x) => { x.sbActive = null; x.sbInvite = null; });
    updateUser(s.b.userId, (x) => { x.sbActive = null; x.sbInvite = null; });
    return;
  }

  const winnerId = winnerSide === "a" ? s.a.userId : s.b.userId;
  const loserId  = winnerSide === "a" ? s.b.userId : s.a.userId;
  const loser = getUser(loserId);
  // Winner takes 5–15% of loser's wallet (random, capped at 50k)
  const pct = 0.05 + Math.random() * 0.10;
  const stolen = Math.min(50000, Math.floor(loser.cowoncy * pct));

  updateUser(winnerId, (x) => { x.cowoncy += stolen; x.sbWins += 1; x.sbActive = null; x.sbInvite = null; });
  updateUser(loserId,  (x) => { x.cowoncy -= stolen; x.sbLosses += 1; x.sbActive = null; x.sbInvite = null; });

  const ch = message.channel;
  if (ch && "send" in ch) {
    ch.send(`🏆 **<@${winnerId}> wins the skill battle!** They snatch **${stolen.toLocaleString()}** cowoncy from <@${loserId}>'s wallet.`).catch(() => {});
  }
}

// ─── Commands ────────────────────────────────────────────────────────────────
export async function cmdSkillBattle(message: Message, args: string[]): Promise<void> {
  const sub = args[0]?.toLowerCase();

  if (sub === "accept") return acceptInvite(message);
  if (sub === "decline" || sub === "reject") return declineInvite(message);
  if (sub === "forfeit" || sub === "ff" || sub === "quit") return forfeitSession(message);
  if (sub === "status") return statusSession(message);

  // lowo sb @user — challenge
  const target = message.mentions.users.first();
  if (!target) {
    await message.reply([
      `${emoji("skillbattle")} **Skill Battle (PvP)**`,
      `Usage: \`lowo sb @user\` — sends a challenge.`,
      `Then: \`lowo sb accept\` / \`decline\`. After accept, attack with \`lowo sba <yourPetSlot> <enemyPetSlot> <skillId>\`.`,
      `Other: \`lowo sb status\`, \`lowo sb forfeit\``,
    ].join("\n"));
    return;
  }
  if (target.bot || target.id === message.author.id) { await message.reply("❌ Pick a real human opponent."); return; }
  const me = getUser(message.author.id);
  const them = getUser(target.id);
  if (me.team.length === 0) { await message.reply("❌ Build a team first: `lowo team add <pet>`."); return; }
  if (them.team.length === 0) { await message.reply(`❌ ${target.username} has no battle team.`); return; }
  if (userSession.has(message.author.id)) { await message.reply("❌ You're already in a skill battle. `lowo sb forfeit` to end it."); return; }
  if (userSession.has(target.id))           { await message.reply(`❌ ${target.username} is already in a skill battle.`); return; }

  invites.set(target.id, { from: message.author.id, channelId: message.channelId, expiresAt: Date.now() + INVITE_TTL_MS });
  updateUser(target.id, (x) => { x.sbInvite = { from: message.author.id, channelId: message.channelId, expiresAt: Date.now() + INVITE_TTL_MS }; });
  await message.reply(`${emoji("skillbattle")} <@${target.id}> — **${message.author.username}** challenges you to a **Skill Battle**!\nReply with \`lowo sb accept\` within 60s.`);
}

async function acceptInvite(message: Message): Promise<void> {
  const inv = invites.get(message.author.id);
  if (!inv || inv.expiresAt < Date.now()) {
    invites.delete(message.author.id);
    await message.reply("📭 No active challenge — ask someone to `lowo sb @you` first.");
    return;
  }
  if (userSession.has(message.author.id) || userSession.has(inv.from)) {
    await message.reply("❌ One of you is already in a battle.");
    return;
  }
  invites.delete(message.author.id);

  const teamA = buildTeam(inv.from);
  const teamB = buildTeam(message.author.id);
  if (teamA.length === 0 || teamB.length === 0) {
    await message.reply("❌ Both players need a team. `lowo team add <pet>`.");
    return;
  }
  const session: ActiveSession = {
    channelId: message.channelId,
    a: { userId: inv.from, pets: teamA, cd: {} },
    b: { userId: message.author.id, pets: teamB, cd: {} },
    turn: "a", round: 1,
    expiresAt: Date.now() + SESSION_TTL_MS,
  };
  sessions.set(message.channelId, session);
  userSession.set(inv.from, message.channelId);
  userSession.set(message.author.id, message.channelId);

  await message.reply([
    `${emoji("skillbattle")} **Skill Battle started!** *(round 1)*`,
    `<@${session.a.userId}>'s turn. Use \`lowo sba <yourPetSlot> <enemyPetSlot> <skillId>\`.`,
    `Available skill ids: ${Array.from(new Set([...session.a.pets.flatMap((p) => p.skills), ...session.b.pets.flatMap((p) => p.skills)])).filter(Boolean).map((s) => `\`${s}\``).join(", ") || "`basic_strike`"}`,
    "",
    summarize(session),
  ].join("\n").slice(0, 1900));
}

async function declineInvite(message: Message): Promise<void> {
  const inv = invites.get(message.author.id);
  invites.delete(message.author.id);
  updateUser(message.author.id, (x) => { x.sbInvite = null; });
  if (inv) await message.reply("✅ Declined the challenge.");
  else     await message.reply("📭 No challenge to decline.");
}

async function forfeitSession(message: Message): Promise<void> {
  const ch = userSession.get(message.author.id);
  const s = ch ? sessions.get(ch) : null;
  if (!s) { await message.reply("📭 You're not in a skill battle."); return; }
  const winnerSide: "a" | "b" = s.a.userId === message.author.id ? "b" : "a";
  payoutAndCleanup(message, s, winnerSide);
}

async function statusSession(message: Message): Promise<void> {
  const ch = userSession.get(message.author.id);
  const s = ch ? sessions.get(ch) : null;
  if (!s) { await message.reply("📭 You're not in a skill battle. Use `lowo sb @user` to challenge."); return; }
  await message.reply([
    `${emoji("skillbattle")} **Skill Battle — round ${s.round}** *(turn: <@${s.turn === "a" ? s.a.userId : s.b.userId}>)*`,
    "",
    summarize(s),
  ].join("\n"));
}

// `lowo sba <yourPetSlot> <enemyPetSlot> <skillId>`
export async function cmdSBAttack(message: Message, args: string[]): Promise<void> {
  const ch = userSession.get(message.author.id);
  const s = ch ? sessions.get(ch) : null;
  if (!s) { await message.reply("📭 You're not in a skill battle. `lowo sb @user` to start."); return; }
  if (s.channelId !== message.channelId) { await message.reply(`❌ Your skill battle is in <#${s.channelId}>.`); return; }
  if (Date.now() > s.expiresAt) { payoutAndCleanup(message, s, "draw"); return; }

  const mySide: "a" | "b" = s.a.userId === message.author.id ? "a" : "b";
  if (s.turn !== mySide) { await message.reply("⏳ Not your turn."); return; }

  const myTeam = mySide === "a" ? s.a.pets : s.b.pets;
  const oppTeam = mySide === "a" ? s.b.pets : s.a.pets;

  const myIdx  = parseInt(args[0] ?? "1", 10) - 1;
  const oppIdx = parseInt(args[1] ?? "1", 10) - 1;
  const skillId = (args[2] ?? "basic_strike").toLowerCase();
  if (isNaN(myIdx) || isNaN(oppIdx) || !myTeam[myIdx] || !oppTeam[oppIdx]) {
    await message.reply(`Usage: \`lowo sba <yourPetSlot> <enemyPetSlot> <skillId>\` (slots 1-${Math.max(myTeam.length, oppTeam.length)})`);
    return;
  }
  const me = myTeam[myIdx];
  const opp = oppTeam[oppIdx];
  if (me.hp <= 0)  { await message.reply(`❌ ${me.emoji}${me.name} is KO'd. Pick a different slot.`); return; }
  if (opp.hp <= 0) { await message.reply(`❌ Their ${opp.emoji}${opp.name} is already KO'd. Pick another target.`); return; }
  if (me.stunnedFor > 0) {
    await message.reply(`💫 ${me.emoji}${me.name} is stunned this turn — turn skipped.`);
    me.stunnedFor--;
    endRound(s);
    return;
  }

  const skill = ACTIVE_SKILLS[skillId];
  if (!skill) { await message.reply(`❌ Unknown skill \`${skillId}\`. Try \`lowo skillshop\`.`); return; }
  // Slot must include this skill, OR be `basic_strike` (always available)
  if (skill.id !== "basic_strike" && !me.skills.includes(skill.id)) {
    await message.reply(`❌ ${me.emoji}${me.name} doesn't have **${skill.name}** equipped. Equip with \`lowo equipskill\`.`);
    return;
  }
  // Cooldown check
  if ((me.cd[skill.id] ?? 0) > 0) {
    await message.reply(`⏳ **${skill.name}** is on cooldown for ${me.cd[skill.id]} more turn(s).`);
    return;
  }

  const { logs } = applySkill(me, opp, oppTeam, myTeam, skill);
  if (skill.cooldown > 0) me.cd[skill.id] = skill.cooldown;
  endRound(s);

  const lines: string[] = [...logs];
  if (!teamAlive(oppTeam)) { lines.push(""); lines.push(summarize(s)); await message.reply(lines.join("\n")); payoutAndCleanup(message, s, mySide); return; }
  if (!teamAlive(myTeam))  { lines.push(""); lines.push(summarize(s)); await message.reply(lines.join("\n")); payoutAndCleanup(message, s, mySide === "a" ? "b" : "a"); return; }

  lines.push("");
  lines.push(`__Round ${s.round}__ — ${s.turn === "a" ? `<@${s.a.userId}>` : `<@${s.b.userId}>`}'s turn.`);
  lines.push(summarize(s));
  await message.reply(lines.join("\n").slice(0, 1900));
}
