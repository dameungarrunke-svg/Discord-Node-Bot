import type { Message } from "discord.js";
import { getUser, updateUser } from "./storage.js";
import { ANIMAL_BY_ID, ANIMALS, ANIMAL_LEVEL_CAP, animalLevelFromXp } from "./data.js";
import { emoji } from "./emojis.js";

export const PRESTIGE_ESSENCE_COST = 50_000;
export type PrestigeStat = "hp" | "atk" | "def" | "mag";
export const PRESTIGE_STATS: PrestigeStat[] = ["hp", "atk", "def", "mag"];

const norm = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const ANIMAL_LOOKUP: Record<string, string> = (() => {
  const m: Record<string, string> = {};
  for (const a of ANIMALS) { m[norm(a.id)] = a.id; m[norm(a.name)] = a.id; }
  return m;
})();
function resolveAnimalId(q: string): string | null {
  if (!q) return null;
  return ANIMAL_LOOKUP[norm(q)] ?? null;
}

export function getPrestige(userId: string, animalId: string): { count: number; statBuff: PrestigeStat | null } {
  const u = getUser(userId);
  const p = u.prestige[animalId];
  return { count: p?.count ?? 0, statBuff: (p?.statBuff as PrestigeStat) ?? null };
}

// Battle-time multiplier for a single stat on a pet (doubles the doubled stat
// PER prestige — so 2 prestiges into ATK = ×4 ATK, etc).
export function prestigeStatMultiplier(userId: string, animalId: string, stat: PrestigeStat): number {
  const u = getUser(userId);
  const p = u.prestige[animalId];
  if (!p || !p.count || p.statBuff !== stat) return 1;
  return Math.pow(2, Math.min(p.count, 4)); // capped at ×16 to avoid blow-ups
}

export async function cmdPrestige(message: Message, args: string[]): Promise<void> {
  const query = args.join(" ").trim();
  if (!query) {
    // List prestiged pets.
    const u = getUser(message.author.id);
    const entries = Object.entries(u.prestige).filter(([, p]) => p.count > 0);
    if (!entries.length) {
      await message.reply([
        `🌟 **Pet Ascension** *(Prestige System)*`,
        ``,
        `Get a pet to **Lv ${ANIMAL_LEVEL_CAP}**, then \`lowo prestige <pet>\` to ascend it.`,
        `**Cost:** ${PRESTIGE_ESSENCE_COST.toLocaleString()} ✨ essence`,
        `**Result:** Resets to Lv 1 but DOUBLES one random stat (HP/ATK/DEF/MAG) **forever**.`,
        `Stack ascensions to keep amplifying — capped at ×16 on a single stat.`,
        `_Ascended pets show 🌟⭐✨ stars on their card._`,
      ].join("\n"));
      return;
    }
    const lines = [`🌟 **Your Ascended Pets** *(${entries.length})*`];
    for (const [aid, p] of entries) {
      const a = ANIMAL_BY_ID[aid]; if (!a) continue;
      const stars = "🌟".repeat(Math.min(p.count, 5));
      lines.push(`${stars} ${a.emoji} **${a.name}** — ${p.count}× *(${p.statBuff.toUpperCase()} ×${Math.pow(2, Math.min(p.count, 4))})*`);
    }
    await message.reply(lines.join("\n").slice(0, 1900));
    return;
  }
  const id = resolveAnimalId(query);
  if (!id) { await message.reply(`❌ I don't know a pet named \`${query}\`.`); return; }
  const a = ANIMAL_BY_ID[id]!;
  const u = getUser(message.author.id);
  if ((u.zoo[id] ?? 0) <= 0) { await message.reply(`${emoji("fail")} You don't own a ${a.emoji} **${a.name}**.`); return; }
  const xp = u.animalXp[id] ?? 0;
  const lvl = animalLevelFromXp(xp);
  if (lvl < ANIMAL_LEVEL_CAP) {
    await message.reply(`❌ ${a.emoji} **${a.name}** is only **Lv ${lvl}/${ANIMAL_LEVEL_CAP}**. Reach max level first.`);
    return;
  }
  if (u.essence < PRESTIGE_ESSENCE_COST) {
    await message.reply(`${emoji("fail")} Need **${PRESTIGE_ESSENCE_COST.toLocaleString()}** ✨ essence (you have ${u.essence.toLocaleString()}).`);
    return;
  }
  const newStat = PRESTIGE_STATS[Math.floor(Math.random() * PRESTIGE_STATS.length)];
  let newCount = 0;
  let lockedStat: PrestigeStat = newStat;
  updateUser(message.author.id, (x) => {
    x.essence -= PRESTIGE_ESSENCE_COST;
    x.animalXp[id] = 0; // reset to Lv 1
    const cur = x.prestige[id];
    if (cur && cur.count > 0) {
      // Once a stat is locked in, future prestiges stack on the same stat.
      cur.count += 1;
      newCount = cur.count;
      lockedStat = cur.statBuff as PrestigeStat;
    } else {
      x.prestige[id] = { count: 1, statBuff: newStat, perm_mutation: true };
      newCount = 1;
      lockedStat = newStat;
    }
  });
  const mult = Math.pow(2, Math.min(newCount, 4));
  await message.reply([
    `🌟 **ASCENSION** 🌟`,
    `${a.emoji} **${a.name}** has ascended! *(prestige ×${newCount})*`,
    `Permanent buff: **${lockedStat.toUpperCase()} ×${mult}**`,
    `Level reset to **1** — go grind it back to ${ANIMAL_LEVEL_CAP} for another ascension.`,
  ].join("\n"));
}
