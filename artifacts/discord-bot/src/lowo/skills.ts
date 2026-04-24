import type { Message } from "discord.js";
import { getUser, updateUser } from "./storage.js";
import { ANIMAL_BY_ID, ANIMALS, animalLevelFromXp, animalXpToNext, animalLevelMultiplier, ANIMAL_LEVEL_CAP } from "./data.js";

export function grantAnimalXp(userId: string, animalId: string, amount: number): { newXp: number; leveledUp: boolean; level: number } {
  const before = getUser(userId).animalXp[animalId] ?? 0;
  const beforeLvl = animalLevelFromXp(before);
  const after = before + amount;
  updateUser(userId, (x) => { x.animalXp[animalId] = after; });
  const afterLvl = animalLevelFromXp(after);
  return { newXp: after, leveledUp: afterLvl > beforeLvl, level: afterLvl };
}

export function getAnimalMultiplier(userId: string, animalId: string): number {
  const xp = getUser(userId).animalXp[animalId] ?? 0;
  return animalLevelMultiplier(xp);
}

function bar(cur: number, need: number, width = 10): string {
  if (need <= 0) return "█".repeat(width);
  const pct = Math.max(0, Math.min(1, cur / need));
  const filled = Math.round(pct * width);
  return "█".repeat(filled) + "░".repeat(width - filled);
}

export async function cmdSkills(message: Message, args: string[]): Promise<void> {
  const id = args[0]?.toLowerCase();
  const u = getUser(message.author.id);

  if (!id) {
    // Overview: list every owned animal with a level
    const owned = Object.keys(u.zoo).filter((k) => (u.zoo[k] ?? 0) > 0);
    if (owned.length === 0) { await message.reply("📭 No animals yet. Try `lowo hunt`!"); return; }
    const lines = ["🌟 **Your Animal Skill Tree** *(use `lowo skills <animalId>` for detail)*"];
    for (const aid of owned) {
      const a = ANIMAL_BY_ID[aid]; if (!a) continue;
      const xp = u.animalXp[aid] ?? 0;
      const lvl = animalLevelFromXp(xp);
      const mult = animalLevelMultiplier(xp);
      lines.push(`${a.emoji} **${a.name}** \`${aid}\` — Lv **${lvl}**/${ANIMAL_LEVEL_CAP} • +${Math.round((mult - 1) * 100)}% stats`);
    }
    await message.reply(lines.join("\n").slice(0, 1900));
    return;
  }

  const a = ANIMAL_BY_ID[id];
  if (!a) { await message.reply(`❌ No animal with id \`${id}\`. See \`lowo lowodex\`.`); return; }
  const xp = u.animalXp[a.id] ?? 0;
  const { current, needed, level } = animalXpToNext(xp);
  const mult = animalLevelMultiplier(xp);

  const perks: string[] = [];
  if (level >= 1)  perks.push("Lv 1 — +5% all stats");
  if (level >= 3)  perks.push("Lv 3 — Sell price ×1.25");
  if (level >= 5)  perks.push("Lv 5 — Hunt cooldown −20%");
  if (level >= 7)  perks.push("Lv 7 — Critical hit chance in battle");
  if (level >= 10) perks.push("Lv 10 — MAX: +50% stats, double essence on sacrifice");

  await message.reply([
    `${a.emoji} **${a.name}** Skill Tree`,
    `Level **${level}**/${ANIMAL_LEVEL_CAP}  •  Stat bonus: **+${Math.round((mult - 1) * 100)}%**`,
    `XP: \`[${bar(current, needed)}]\` ${current.toLocaleString()} / ${needed > 0 ? needed.toLocaleString() : "MAX"}`,
    "",
    perks.length ? perks.join("\n") : "_No perks yet — gain XP from hunts and battle wins._",
    "",
    `_Hunt this animal: +5 XP. Win a battle with it on your team: +25 XP._`,
  ].join("\n"));
}

export function getAnimalPerk(userId: string, animalId: string, perk: "sell" | "huntCd" | "crit" | "essence"): boolean | number {
  const xp = getUser(userId).animalXp[animalId] ?? 0;
  const lvl = animalLevelFromXp(xp);
  switch (perk) {
    case "sell":    return lvl >= 3 ? 1.25 : 1;
    case "huntCd":  return lvl >= 5 ? 0.8  : 1;
    case "crit":    return lvl >= 7;
    case "essence": return lvl >= 10 ? 2 : 1;
  }
}

// Called from hunt (any animal grants its own XP)
export function onHuntCaught(userId: string, animalId: string): void {
  grantAnimalXp(userId, animalId, 5);
}

// Called from battle (whole team gets XP on win)
export function onBattleWin(userId: string, teamIds: string[]): void {
  for (const id of teamIds) grantAnimalXp(userId, id, 25);
}

// Returns the strongest hunt-cooldown reduction across the user's team.
export function bestHuntCdMultiplier(userId: string): number {
  const u = getUser(userId);
  let best = 1;
  for (const id of u.team) {
    const v = getAnimalPerk(userId, id, "huntCd");
    if (typeof v === "number" && v < best) best = v;
  }
  return best;
}

// Returns essence multiplier for sacrificing this animal (perk).
export function essenceMultiplier(userId: string, animalId: string): number {
  const v = getAnimalPerk(userId, animalId, "essence");
  return typeof v === "number" ? v : 1;
}

// Returns sell multiplier for an animal.
export function sellMultiplier(userId: string, animalId: string): number {
  const v = getAnimalPerk(userId, animalId, "sell");
  return typeof v === "number" ? v : 1;
}

export const _testHelpers = { ANIMALS };
