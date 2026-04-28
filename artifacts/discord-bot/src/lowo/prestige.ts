import type { Message } from "discord.js";
import { getUser, updateUser } from "./storage.js";
import { ANIMAL_BY_ID, ANIMALS, ANIMAL_LEVEL_CAP, animalLevelFromXp } from "./data.js";
import { emoji } from "./emojis.js";
import {
  baseEmbed, replyEmbed, errorEmbed, warnEmbed, val, COLOR, rarityColor, progressBar,
} from "./embeds.js";

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

export function prestigeStatMultiplier(userId: string, animalId: string, stat: PrestigeStat): number {
  const u = getUser(userId);
  const p = u.prestige[animalId];
  if (!p || !p.count || p.statBuff !== stat) return 1;
  return Math.pow(2, Math.min(p.count, 4));
}

export async function cmdPrestige(message: Message, args: string[]): Promise<void> {
  const query = args.join(" ").trim();
  if (!query) {
    const u = getUser(message.author.id);
    const entries = Object.entries(u.prestige).filter(([, p]) => p.count > 0);
    if (!entries.length) {
      const e = baseEmbed(message, COLOR.prestige)
        .setTitle("🌟 Pet Ascension *(Prestige System)*")
        .setDescription([
          `Get a pet to **Lv ${ANIMAL_LEVEL_CAP}**, then \`lowo prestige <pet>\` to ascend it.`,
          `*Ascended pets show 🌟⭐✨ stars on their card.*`,
        ].join("\n"))
        .addFields(
          { name: "💸 Cost",   value: `${val(PRESTIGE_ESSENCE_COST)} ✨ essence`, inline: true },
          { name: "🎁 Result", value: "Resets to **Lv 1** but DOUBLES one random stat **forever**", inline: true },
          { name: "📈 Stack",  value: "Capped at **×16** on a single stat", inline: true },
        );
      await replyEmbed(message, e);
      return;
    }
    const lines = entries.map(([aid, p]) => {
      const a = ANIMAL_BY_ID[aid]; if (!a) return null;
      const stars = "🌟".repeat(Math.min(p.count, 5));
      return `${stars} ${a.emoji} **${a.name}** — ${val(p.count)}× *(${p.statBuff.toUpperCase()} ×${Math.pow(2, Math.min(p.count, 4))})*`;
    }).filter(Boolean);
    const e = baseEmbed(message, COLOR.prestige)
      .setTitle(`🌟 Your Ascended Pets *(${entries.length})*`)
      .setDescription(lines.join("\n").slice(0, 3900));
    await replyEmbed(message, e);
    return;
  }
  const id = resolveAnimalId(query);
  if (!id) { await replyEmbed(message, errorEmbed(message, "Unknown Pet", `I don't know a pet named \`${query}\`.`)); return; }
  const a = ANIMAL_BY_ID[id]!;
  const u = getUser(message.author.id);
  if ((u.zoo[id] ?? 0) <= 0) { await replyEmbed(message, errorEmbed(message, "Don't Own", `You don't own a ${a.emoji} **${a.name}**.`)); return; }
  const xp = u.animalXp[id] ?? 0;
  const lvl = animalLevelFromXp(xp);
  if (lvl < ANIMAL_LEVEL_CAP) {
    const e = warnEmbed(message, "Not Max Level", `${a.emoji} **${a.name}** is only **Lv ${lvl}/${ANIMAL_LEVEL_CAP}**. Reach max level first.`);
    e.addFields({ name: "Progress", value: progressBar(lvl, ANIMAL_LEVEL_CAP) });
    await replyEmbed(message, e); return;
  }
  if (u.essence < PRESTIGE_ESSENCE_COST) {
    await replyEmbed(message, errorEmbed(message, "Insufficient Essence",
      `Need ${val(PRESTIGE_ESSENCE_COST)} ✨ *(you have ${val(u.essence)})*.`));
    return;
  }
  const newStat = PRESTIGE_STATS[Math.floor(Math.random() * PRESTIGE_STATS.length)];
  let newCount = 0;
  let lockedStat: PrestigeStat = newStat;
  updateUser(message.author.id, (x) => {
    x.essence -= PRESTIGE_ESSENCE_COST;
    x.animalXp[id] = 0;
    const cur = x.prestige[id];
    if (cur && cur.count > 0) {
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
  const e = baseEmbed(message, rarityColor(a.rarity))
    .setTitle("🌟 ✨  ASCENSION  ✨ 🌟")
    .setThumbnail(message.author.displayAvatarURL({ size: 256 }))
    .setDescription(`${a.emoji} **${a.name}** has ascended! *(prestige ×${newCount})*`)
    .addFields(
      { name: "Permanent Buff", value: `**${lockedStat.toUpperCase()} ×${mult}**`, inline: true },
      { name: "Level",          value: "Reset to `1`",                              inline: true },
      { name: "Next Ascension", value: `Grind back to **Lv ${ANIMAL_LEVEL_CAP}**`, inline: true },
    );
  await replyEmbed(message, e);
}
