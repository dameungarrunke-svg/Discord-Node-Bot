import type { Message } from "discord.js";
import { getUser, updateUser, type UserData } from "./storage.js";
import { ANIMAL_BY_ID, rollWeapon } from "./data.js";

interface CombatUnit {
  name: string; emoji: string;
  hp: number; maxHp: number; atk: number; def: number; mag: number;
}

function buildTeam(u: UserData): CombatUnit[] {
  const team: CombatUnit[] = [];
  for (const id of u.team) {
    const a = ANIMAL_BY_ID[id]; if (!a) continue;
    let atk = a.atk, def = a.def, mag = a.mag;
    const widx = u.equipped[id];
    if (widx !== undefined) {
      const w = u.weapons[parseInt(widx, 10)];
      if (w) { atk += w.mods.atk; def += w.mods.def; mag += w.mods.mag; }
    }
    team.push({ name: a.name, emoji: a.emoji, hp: a.hp, maxHp: a.hp, atk, def, mag });
  }
  return team;
}

function damage(att: CombatUnit, def: CombatUnit): number {
  const base = Math.max(att.atk, att.mag * 0.9);
  const mit = def.def * 0.6;
  const variance = 0.85 + Math.random() * 0.3;
  return Math.max(1, Math.floor((base - mit) * variance));
}

function aliveSum(t: CombatUnit[]): number { return t.reduce((s, u) => s + (u.hp > 0 ? u.hp : 0), 0); }

function simulate(a: CombatUnit[], b: CombatUnit[]): { winner: "a" | "b" | "draw"; log: string[] } {
  const log: string[] = [];
  for (let round = 1; round <= 20 && aliveSum(a) > 0 && aliveSum(b) > 0; round++) {
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      const ua = a[i], ub = b[i];
      if (ua && ua.hp > 0 && ub && ub.hp > 0) {
        const d = damage(ua, ub); ub.hp -= d;
        log.push(`R${round}: ${ua.emoji}${ua.name} hits ${ub.emoji}${ub.name} for ${d}`);
      }
      if (ub && ub.hp > 0 && ua && ua.hp > 0) {
        const d = damage(ub, ua); ua.hp -= d;
        log.push(`R${round}: ${ub.emoji}${ub.name} hits ${ua.emoji}${ua.name} for ${d}`);
      }
    }
  }
  const ah = aliveSum(a), bh = aliveSum(b);
  return { winner: ah === bh ? "draw" : ah > bh ? "a" : "b", log };
}

export async function cmdTeam(message: Message, args: string[]): Promise<void> {
  const sub = args[0]?.toLowerCase();
  const u = getUser(message.author.id);
  if (!sub || sub === "view") {
    if (u.team.length === 0) { await message.reply("👥 Team is empty. Use `lowo team add <animalId>`."); return; }
    await message.reply(`👥 **Your Team:** ${u.team.map(id => { const a = ANIMAL_BY_ID[id]; return a ? `${a.emoji} ${a.name}` : id; }).join(" • ")}`);
    return;
  }
  const id = args[1]?.toLowerCase();
  if (sub === "add") {
    if (!id || !ANIMAL_BY_ID[id]) { await message.reply("Usage: `lowo team add <animalId>`"); return; }
    if (!u.zoo[id] || u.zoo[id] <= 0) { await message.reply(`❌ You don't own that animal.`); return; }
    if (u.team.includes(id)) { await message.reply(`❌ Already on team.`); return; }
    if (u.team.length >= 3) { await message.reply(`❌ Team full (3/3). Remove one first.`); return; }
    updateUser(message.author.id, (x) => { x.team.push(id); });
    await message.reply(`✅ Added ${ANIMAL_BY_ID[id].emoji} **${ANIMAL_BY_ID[id].name}** to team.`);
  } else if (sub === "remove") {
    if (!id) { await message.reply("Usage: `lowo team remove <animalId>`"); return; }
    updateUser(message.author.id, (x) => { x.team = x.team.filter(t => t !== id); delete x.equipped[id]; });
    await message.reply(`✅ Removed.`);
  } else {
    await message.reply("Usage: `lowo team add|remove|view <animalId>`");
  }
}

export async function cmdBattle(message: Message): Promise<void> {
  const target = message.mentions.users.first();
  const me = getUser(message.author.id);
  if (me.team.length === 0) { await message.reply("❌ Build a team first: `lowo team add <animalId>`"); return; }
  const teamA = buildTeam(me);
  let teamB: CombatUnit[];
  let oppName: string;
  if (target && !target.bot && target.id !== message.author.id) {
    const them = getUser(target.id);
    if (them.team.length === 0) { await message.reply(`❌ ${target.username} has no team.`); return; }
    teamB = buildTeam(them);
    oppName = target.username;
  } else {
    // PvE — wild team
    const ids = Object.keys(ANIMAL_BY_ID);
    teamB = Array.from({ length: 3 }, () => {
      const a = ANIMAL_BY_ID[ids[Math.floor(Math.random() * ids.length)]];
      return { name: a.name, emoji: a.emoji, hp: a.hp, maxHp: a.hp, atk: a.atk, def: a.def, mag: a.mag };
    });
    oppName = "Wild Pack";
  }
  const { winner, log } = simulate(teamA, teamB);
  let outcome: string;
  if (winner === "a") {
    const reward = 150 + Math.floor(Math.random() * 200);
    updateUser(message.author.id, (x) => { x.cowoncy += reward; });
    outcome = `🏆 **${message.author.username}** beat **${oppName}**! +${reward} cowoncy.`;
  } else if (winner === "b") {
    outcome = `💀 **${message.author.username}** lost to **${oppName}**.`;
  } else {
    outcome = `🤝 Draw with **${oppName}**.`;
  }
  await message.reply(`${outcome}\n\`\`\`${log.slice(-10).join("\n").slice(0, 1500) || "(quick battle)"}\`\`\``);
}

export async function cmdCrate(message: Message): Promise<void> {
  const u = getUser(message.author.id);
  if (u.cowoncy < 2500) { await message.reply("❌ Crates cost **2500** cowoncy."); return; }
  const w = rollWeapon();
  updateUser(message.author.id, (x) => { x.cowoncy -= 2500; x.weapons.push({ id: w.id, rarity: w.rarity, mods: w.mods }); });
  await message.reply(`📦 Opened a crate! ${w.emoji} **${w.name}** *(${w.rarity})* — ATK +${w.mods.atk}, DEF +${w.mods.def}, MAG +${w.mods.mag}`);
}

export async function cmdWeapon(message: Message): Promise<void> {
  const u = getUser(message.author.id);
  if (u.weapons.length === 0) { await message.reply("🗡️ No weapons. Buy a crate with `lowo crate`."); return; }
  const lines = u.weapons.map((w, i) => `\`${i}\` *(${w.rarity})* — ATK+${w.mods.atk} DEF+${w.mods.def} MAG+${w.mods.mag}`);
  await message.reply(`🗡️ **Your Weapons**\n${lines.slice(0, 25).join("\n")}`);
}

export async function cmdEquip(message: Message, args: string[]): Promise<void> {
  const animalId = args[0]?.toLowerCase();
  const widx = args[1];
  if (!animalId || widx === undefined) { await message.reply("Usage: `lowo equip <animalId> <weaponIndex>`"); return; }
  const u = getUser(message.author.id);
  if (!u.zoo[animalId] || u.zoo[animalId] <= 0) { await message.reply("❌ You don't own that animal."); return; }
  const idx = parseInt(widx, 10);
  if (isNaN(idx) || !u.weapons[idx]) { await message.reply("❌ Invalid weapon index."); return; }
  updateUser(message.author.id, (x) => { x.equipped[animalId] = String(idx); });
  await message.reply(`✅ Equipped weapon \`${idx}\` to ${ANIMAL_BY_ID[animalId].emoji} ${ANIMAL_BY_ID[animalId].name}.`);
}
