import type { Message } from "discord.js";
import { getUser, updateUser, type UserData } from "./storage.js";
import { ANIMAL_BY_ID, ANIMALS, ARMOR_BY_ID, ACCESSORY_BY_ID, SIGNATURE_SKILLS, rollWeapon } from "./data.js";
import { getAnimalMultiplier, onBattleWin, getAnimalPerk } from "./skills.js";
import { eventBonus } from "./events.js";
import { emoji } from "./emojis.js";

const BATTLE_COOLDOWN_MS = 30_000;
const SKILL_TRIGGER_CHANCE = 0.25;

// Tolerant animal lookup
const norm = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const ANIMAL_LOOKUP: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const a of ANIMALS) {
    map[norm(a.id)] = a.id;
    map[norm(a.name)] = a.id;
  }
  return map;
})();
function resolveAnimalId(query: string): string | null {
  if (!query) return null;
  return ANIMAL_LOOKUP[norm(query)] ?? null;
}

interface CombatUnit {
  id: string;
  name: string; emoji: string;
  hp: number; maxHp: number; atk: number; def: number; mag: number;
  crit: boolean; critChance: number;
  signatureSkill: string | null;
  stunned: boolean;
}

function buildTeam(u: UserData, ownerId: string | null): CombatUnit[] {
  const team: CombatUnit[] = [];
  // Shield potion (defensive global buff) applied at team-build time.
  const shieldOn = ownerId ? Date.now() < (u.shieldUntil ?? 0) : false;
  for (const id of u.team) {
    const a = ANIMAL_BY_ID[id]; if (!a) continue;
    let hp = a.hp, atk = a.atk, def = a.def, mag = a.mag;
    let critChance = 0;
    // Weapon
    const widx = u.equipped[id];
    if (widx !== undefined) {
      const w = u.weapons[parseInt(widx, 10)];
      if (w) { atk += w.mods.atk; def += w.mods.def; mag += w.mods.mag; }
    }
    // Crafted weapon (separate slot via "c<idx>" prefix)
    if (widx !== undefined && widx.startsWith("c")) {
      const cidx = parseInt(widx.slice(1), 10);
      const cw = u.craftedWeapons?.[cidx];
      if (cw) { atk += cw.mods.atk; def += cw.mods.def; mag += cw.mods.mag; }
    }
    // Armor
    const aidx = u.equippedArmor[id];
    if (aidx !== undefined) {
      const ar = u.armor[parseInt(aidx, 10)];
      if (ar) { hp += ar.mods.hp; def += ar.mods.def; mag += ar.mods.mag; }
    }
    // Accessory (3rd equip slot)
    const xidx = u.equippedAccessory?.[id];
    if (xidx !== undefined) {
      const acc = u.accessories?.[parseInt(xidx, 10)];
      if (acc) {
        hp += acc.mods.hp; atk += acc.mods.atk; def += acc.mods.def; mag += acc.mods.mag;
        if (acc.mods.crit) critChance += acc.mods.crit;
      }
    }
    // Animal-XP multiplier
    const mult = ownerId ? getAnimalMultiplier(ownerId, id) : 1;
    atk = Math.floor(atk * mult);
    def = Math.floor(def * mult);
    mag = Math.floor(mag * mult);
    hp = Math.floor(hp * mult);
    if (shieldOn) def = Math.floor(def * 1.2);
    const perkCrit = ownerId ? !!getAnimalPerk(ownerId, id, "crit") : false;
    if (perkCrit) critChance += 0.18;
    team.push({
      id, name: a.name, emoji: a.emoji,
      hp, maxHp: hp, atk, def, mag,
      crit: critChance > 0, critChance,
      signatureSkill: a.signatureSkill ?? null, stunned: false,
    });
  }
  return team;
}

function damage(att: CombatUnit, def: CombatUnit, opts: { defReduce?: number; ignoreDef?: boolean; mult?: number; bonus?: number } = {}): { d: number; crit: boolean } {
  const base = Math.max(att.atk, att.mag * 0.9);
  const mit = opts.ignoreDef ? 0 : def.def * 0.6;
  const variance = 0.85 + Math.random() * 0.3;
  const isCrit = att.crit && Math.random() < att.critChance;
  let d = Math.max(1, Math.floor((base - mit) * variance));
  if (opts.mult) d = Math.floor(d * opts.mult);
  if (opts.bonus) d += Math.floor(opts.bonus);
  if (opts.defReduce) d = Math.floor(d * (1 - opts.defReduce));
  if (isCrit) d = Math.floor(d * 1.75);
  // Blood Moon event: ×1.5 to ALL battle damage
  const bm = eventBonus("blood_moon");
  if (bm > 1) d = Math.floor(d * bm);
  return { d, crit: isCrit };
}

function aliveSum(t: CombatUnit[]): number { return t.reduce((s, u) => s + (u.hp > 0 ? u.hp : 0), 0); }

function tryTriggerSkill(att: CombatUnit, def: CombatUnit, allies: CombatUnit[]): {
  defReduce?: number; ignoreDef?: boolean; mult?: number; bonus?: number; double?: boolean; healed?: number; stunNext?: boolean; lifestealPct?: number; logLine?: string;
} {
  if (!att.signatureSkill) return {};
  if (Math.random() >= SKILL_TRIGGER_CHANCE) return {};
  const skill = SIGNATURE_SKILLS[att.signatureSkill];
  if (!skill) return {};
  switch (skill.type) {
    case "lifesteal": return { lifestealPct: skill.power, logLine: `${skill.emoji} ${att.emoji}${att.name} uses **${skill.name}**!` };
    case "shield":    return { defReduce: skill.power, logLine: `${skill.emoji} ${att.emoji}${att.name} braces with **${skill.name}** (½ dmg)!` };
    case "burst":     return { mult: skill.power, logLine: `${skill.emoji} ${att.emoji}${att.name} unleashes **${skill.name}** ×${skill.power}!` };
    case "true_dmg":  return { ignoreDef: true, logLine: `${skill.emoji} ${att.emoji}${att.name} **${skill.name}** — ignores DEF!` };
    case "double":    return { double: true, logLine: `${skill.emoji} ${att.emoji}${att.name} **${skill.name}** — strikes twice!` };
    case "burn":      return { bonus: def.maxHp * skill.power, logLine: `${skill.emoji} ${att.emoji}${att.name} **${skill.name}** — burning!` };
    case "stun":      return { stunNext: true, logLine: `${skill.emoji} ${att.emoji}${att.name} **${skill.name}** — target stunned next turn!` };
    case "heal": {
      const lowest = allies.filter((a) => a.hp > 0).sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp))[0];
      if (!lowest) return {};
      const heal = Math.floor(lowest.maxHp * skill.power);
      lowest.hp = Math.min(lowest.maxHp, lowest.hp + heal);
      return { healed: heal, logLine: `${skill.emoji} ${att.emoji}${att.name} **${skill.name}** — heals ${lowest.emoji}${lowest.name} +${heal} HP!` };
    }
  }
  return {};
}

function attackWithSkill(att: CombatUnit, def: CombatUnit, allies: CombatUnit[], log: string[], round: number): void {
  if (att.stunned) {
    log.push(`R${round}: ${att.emoji}${att.name} is **stunned** and skips the turn!`);
    att.stunned = false;
    return;
  }
  const fx = tryTriggerSkill(att, def, allies);
  if (fx.logLine) log.push(`R${round}: ${fx.logLine}`);
  const hits = fx.double ? 2 : 1;
  for (let i = 0; i < hits; i++) {
    const r = damage(att, def, { defReduce: fx.defReduce, ignoreDef: fx.ignoreDef, mult: fx.mult, bonus: fx.bonus });
    def.hp -= r.d;
    if (fx.lifestealPct) {
      const heal = Math.floor(r.d * fx.lifestealPct);
      att.hp = Math.min(att.maxHp, att.hp + heal);
      log.push(`R${round}: ${att.emoji}${att.name} hits ${def.emoji}${def.name} for ${r.d}${r.crit ? " 💥CRIT" : ""} *(+${heal} lifesteal)*`);
    } else {
      log.push(`R${round}: ${att.emoji}${att.name} hits ${def.emoji}${def.name} for ${r.d}${r.crit ? " 💥CRIT" : ""}`);
    }
    if (def.hp <= 0) break;
  }
  if (fx.stunNext) def.stunned = true;
}

function simulate(a: CombatUnit[], b: CombatUnit[]): { winner: "a" | "b" | "draw"; log: string[] } {
  const log: string[] = [];
  for (let round = 1; round <= 20 && aliveSum(a) > 0 && aliveSum(b) > 0; round++) {
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      const ua = a[i], ub = b[i];
      if (ua && ua.hp > 0 && ub && ub.hp > 0) attackWithSkill(ua, ub, a, log, round);
      if (ub && ub.hp > 0 && ua && ua.hp > 0) attackWithSkill(ub, ua, b, log, round);
    }
  }
  const ah = aliveSum(a), bh = aliveSum(b);
  return { winner: ah === bh ? "draw" : ah > bh ? "a" : "b", log };
}

export async function cmdTeam(message: Message, args: string[]): Promise<void> {
  const sub = args[0]?.toLowerCase();
  const u = getUser(message.author.id);
  if (!sub || sub === "view") {
    if (u.team.length === 0) { await message.reply("👥 Team is empty. Use `lowo team add <name>` (e.g. `lowo team add T-Rex`)."); return; }
    await message.reply(`👥 **Your Team:** ${u.team.map((id) => { const a = ANIMAL_BY_ID[id]; return a ? `${a.emoji} ${a.name}` : id; }).join(" • ")}`);
    return;
  }
  const query = args.slice(1).join(" ").trim();
  const id = resolveAnimalId(query);
  if (sub === "add") {
    if (!id) { await message.reply("Usage: `lowo team add <name>` — e.g. `lowo team add Lowo King` or `lowo team add tRex`."); return; }
    if (!u.zoo[id] || u.zoo[id] <= 0) { await message.reply(`❌ You don't own ${ANIMAL_BY_ID[id].emoji} **${ANIMAL_BY_ID[id].name}**.`); return; }
    if (u.team.includes(id)) { await message.reply(`❌ ${ANIMAL_BY_ID[id].emoji} **${ANIMAL_BY_ID[id].name}** is already on your team.`); return; }
    if (u.team.length >= 3) { await message.reply(`❌ Team full (3/3). Remove one first.`); return; }
    updateUser(message.author.id, (x) => { x.team.push(id); });
    await message.reply(`✅ Added ${ANIMAL_BY_ID[id].emoji} **${ANIMAL_BY_ID[id].name}** to team.`);
  } else if (sub === "remove") {
    if (!id) { await message.reply("Usage: `lowo team remove <name>`"); return; }
    if (!u.team.includes(id)) { await message.reply(`❌ ${ANIMAL_BY_ID[id].emoji} **${ANIMAL_BY_ID[id].name}** isn't on your team.`); return; }
    updateUser(message.author.id, (x) => {
      x.team = x.team.filter((t) => t !== id);
      delete x.equipped[id];
      delete x.equippedArmor[id];
      delete x.equippedAccessory[id];
    });
    await message.reply(`✅ Removed ${ANIMAL_BY_ID[id].emoji} **${ANIMAL_BY_ID[id].name}** from team.`);
  } else {
    await message.reply("Usage: `lowo team add|remove|view <name>`");
  }
}

export async function cmdBattle(message: Message): Promise<void> {
  const target = message.mentions.users.first();
  const me = getUser(message.author.id);
  const now = Date.now();
  const left = BATTLE_COOLDOWN_MS - (now - me.lastBattle);
  if (left > 0) {
    await message.reply(`${emoji("hourglass")} Cooling down — battle again in **${Math.ceil(left / 1000)}s**.`);
    return;
  }
  if (me.team.length === 0) { await message.reply(`${emoji("fail")} Build a team first: \`lowo team add <name>\``); return; }
  const teamA = buildTeam(me, message.author.id);
  let teamB: CombatUnit[];
  let oppName: string;
  if (target && !target.bot && target.id !== message.author.id) {
    const them = getUser(target.id);
    if (them.team.length === 0) { await message.reply(`❌ ${target.username} has no team.`); return; }
    teamB = buildTeam(them, target.id);
    oppName = target.username;
  } else {
    const ids = Object.keys(ANIMAL_BY_ID);
    teamB = Array.from({ length: 3 }, () => {
      const a = ANIMAL_BY_ID[ids[Math.floor(Math.random() * ids.length)]];
      return {
        id: a.id, name: a.name, emoji: a.emoji, hp: a.hp, maxHp: a.hp,
        atk: a.atk, def: a.def, mag: a.mag, crit: false, critChance: 0,
        signatureSkill: a.signatureSkill ?? null, stunned: false,
      };
    });
    oppName = "Wild Pack";
  }

  updateUser(message.author.id, (x) => { x.lastBattle = now; });

  const { winner, log } = simulate(teamA, teamB);
  let outcome: string;
  if (winner === "a") {
    // THE NEW ERA — Battle now awards Battle Tokens (no cowoncy/money).
    // Battle Master gamepass boosts rewards by 50%.
    const battleMult = eventBonus("battle");
    const u = getUser(message.author.id);
    const passMult = u.gamepasses["gp_battle_master"] ? 1.5 : 1;
    const reward = Math.floor((150 + Math.floor(Math.random() * 200)) * battleMult * passMult);
    updateUser(message.author.id, (x) => { x.battleTokens += reward; });
    onBattleWin(message.author.id, me.team);
    const tags: string[] = [];
    if (battleMult > 1)   tags.push("⚔️ Battle Frenzy ×2");
    if (passMult > 1)     tags.push("🏆 Battle Master +50%");
    const evTag = tags.length ? ` *(${tags.join(", ")})*` : "";
    outcome = `🏆 **${message.author.username}** beat **${oppName}**! +${reward} 🪙 Battle Tokens${evTag}\n_+25 XP to each team animal._`;
  } else if (winner === "b") {
    outcome = `💀 **${message.author.username}** lost to **${oppName}**.`;
  } else {
    outcome = `🤝 Draw with **${oppName}**.`;
  }

  if (me.instantBattle) {
    await message.reply(outcome);
  } else {
    await message.reply(`${outcome}\n\`\`\`${log.slice(-12).join("\n").slice(0, 1500) || "(quick battle)"}\`\`\``);
  }
}

export async function cmdCrate(message: Message): Promise<void> {
  const u = getUser(message.author.id);
  if (u.cowoncy < 2500) { await message.reply("❌ Crates cost **2500** cowoncy."); return; }
  const w = rollWeapon();
  updateUser(message.author.id, (x) => { x.cowoncy -= 2500; x.weapons.push({ id: w.id, rarity: w.rarity, mods: w.mods }); });
  await message.reply(`📦 Opened a crate! ${w.emoji} **${w.name}** *(${w.rarity})* — ATK +${w.mods.atk}, DEF +${w.mods.def}, MAG +${w.mods.mag}`);
}

export async function cmdWeapon(message: Message, args: string[]): Promise<void> {
  const sub = args[0]?.toLowerCase();
  if (sub === "rr" || sub === "reroll") {
    const idx = parseInt(args[1] ?? "", 10);
    const u0 = getUser(message.author.id);
    const w = u0.weapons[idx];
    if (isNaN(idx) || !w) { await message.reply("Usage: `lowo weapon rr <weaponIdx>` (costs 50 essence)"); return; }
    if (u0.essence < 50) { await message.reply(`❌ Need **50** ✨ essence (you have ${u0.essence}).`); return; }
    const mult = ({ common: 1, uncommon: 2, rare: 4, epic: 8, mythic: 16 } as const)[w.rarity as "common"] ?? 1;
    const newMods = {
      atk: Math.floor((3 + Math.random() * 5) * mult),
      def: Math.floor((2 + Math.random() * 4) * mult),
      mag: Math.floor((2 + Math.random() * 4) * mult),
    };
    updateUser(message.author.id, (x) => { x.essence -= 50; x.weapons[idx].mods = newMods; });
    await message.reply(`🎲 Rerolled weapon \`${idx}\` — new mods: ATK +${newMods.atk}, DEF +${newMods.def}, MAG +${newMods.mag} *(−50 ✨)*`);
    return;
  }

  const u = getUser(message.author.id);
  if (u.weapons.length === 0 && (u.craftedWeapons?.length ?? 0) === 0) { await message.reply("🗡️ No weapons. Buy a crate with `lowo crate` or craft via `lowo craft`."); return; }
  const lines = u.weapons.map((w, i) => `\`${i}\` *(${w.rarity})* — ATK+${w.mods.atk} DEF+${w.mods.def} MAG+${w.mods.mag}`);
  if (u.craftedWeapons?.length) {
    lines.push("");
    lines.push("__Crafted (equip via `lowo equip <pet> weapon c<idx>`):__");
    u.craftedWeapons.forEach((cw, i) => lines.push(`\`c${i}\` *(${cw.rarity})* 🛠️ ${cw.name} — ATK+${cw.mods.atk} DEF+${cw.mods.def} MAG+${cw.mods.mag}`));
  }
  await message.reply(`🗡️ **Your Weapons** *(reroll mods: \`lowo weapon rr <idx>\`)*\n${lines.slice(0, 30).join("\n")}`);
}

/**
 * `lowo equip <name...> [weapon|armor|accessory] <idx>`
 *   – Backward compat: `lowo equip <name> <idx>` defaults to weapon slot.
 *   – Multi-word names supported (e.g. "Lowo King").
 *   – Crafted weapons are addressed as `c<idx>` (e.g. `c0`).
 */
export async function cmdEquip(message: Message, args: string[]): Promise<void> {
  if (args.length < 2) { await message.reply("Usage: `lowo equip <name> [weapon|armor|accessory] <idx>`"); return; }

  let slot: "weapon" | "armor" | "accessory" = "weapon";
  let idxStr: string | undefined;
  let nameTokens: string[] = [];

  const last = args[args.length - 1];
  const second = args[args.length - 2]?.toLowerCase();
  const isIdxToken = (s: string) => /^c?\d+$/.test(s);
  if ((second === "weapon" || second === "armor" || second === "accessory") && isIdxToken(last)) {
    slot = second;
    idxStr = last;
    nameTokens = args.slice(0, -2);
  } else if (isIdxToken(last)) {
    idxStr = last;
    nameTokens = args.slice(0, -1);
  } else {
    await message.reply("Usage: `lowo equip <name> [weapon|armor|accessory] <idx>`");
    return;
  }

  const animalId = resolveAnimalId(nameTokens.join(" "));
  if (!animalId) { await message.reply(`❌ Unknown animal \`${nameTokens.join(" ")}\`.`); return; }

  const u = getUser(message.author.id);
  if (!u.zoo[animalId] || u.zoo[animalId] <= 0) { await message.reply(`❌ You don't own ${ANIMAL_BY_ID[animalId].emoji} ${ANIMAL_BY_ID[animalId].name}.`); return; }

  if (slot === "weapon") {
    if (idxStr!.startsWith("c")) {
      const cidx = parseInt(idxStr!.slice(1), 10);
      if (isNaN(cidx) || !u.craftedWeapons?.[cidx]) { await message.reply("❌ Invalid crafted-weapon index. Try `lowo weapon`."); return; }
      updateUser(message.author.id, (x) => { x.equipped[animalId] = `c${cidx}`; });
      const cw = u.craftedWeapons[cidx];
      await message.reply(`✅ Equipped crafted 🛠️ **${cw.name}** *(${cw.rarity})* to ${ANIMAL_BY_ID[animalId].emoji} ${ANIMAL_BY_ID[animalId].name}.`);
      return;
    }
    const idx = parseInt(idxStr!, 10);
    if (isNaN(idx) || !u.weapons[idx]) { await message.reply("❌ Invalid weapon index."); return; }
    updateUser(message.author.id, (x) => { x.equipped[animalId] = String(idx); });
    const w = u.weapons[idx];
    await message.reply(`✅ Equipped weapon \`${idx}\` *(${w.rarity})* to ${ANIMAL_BY_ID[animalId].emoji} ${ANIMAL_BY_ID[animalId].name}.`);
  } else if (slot === "armor") {
    const idx = parseInt(idxStr!, 10);
    if (isNaN(idx) || !u.armor[idx]) { await message.reply("❌ Invalid armor index. Buy from `lowo shop equips`."); return; }
    updateUser(message.author.id, (x) => { x.equippedArmor[animalId] = String(idx); });
    const ar = u.armor[idx];
    const def = ARMOR_BY_ID[ar.defId];
    await message.reply(`✅ Equipped armor \`${idx}\` ${def?.emoji ?? "🛡️"} **${def?.name ?? "armor"}** to ${ANIMAL_BY_ID[animalId].emoji} ${ANIMAL_BY_ID[animalId].name}.`);
  } else {
    const idx = parseInt(idxStr!, 10);
    if (isNaN(idx) || !u.accessories?.[idx]) { await message.reply("❌ Invalid accessory index. Buy from `lowo shop pets`."); return; }
    updateUser(message.author.id, (x) => { x.equippedAccessory[animalId] = String(idx); });
    const acc = u.accessories[idx];
    const def = ACCESSORY_BY_ID[acc.defId];
    await message.reply(`✅ Equipped accessory \`${idx}\` ${def?.emoji ?? "🧿"} **${def?.name ?? "accessory"}** to ${ANIMAL_BY_ID[animalId].emoji} ${ANIMAL_BY_ID[animalId].name}.`);
  }
}
