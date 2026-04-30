import type { Message } from "discord.js";
import { getUser, updateUser, type UserData } from "./storage.js";
import { ANIMAL_BY_ID, ANIMALS, ANIMAL_LEVEL_CAP, animalLevelFromXp, type Animal } from "./data.js";
import {
  baseEmbed, replyEmbed, errorEmbed, warnEmbed, successEmbed, val, COLOR,
} from "./embeds.js";
import { hasRelic } from "./forge.js";

// ─── VOID CORRUPTIONS — `lowo corrupt` ───────────────────────────────────────
// Cost: 1,000 cowoncy + a Lv-cap pet. Risk: 5% chance the pet stack is lost.
// Reward: each stat (HP/ATK/DEF/MAG) is independently rolled to 1.0×–3.0× of
// base. The corruption record lives on UserData.corrupted[animalId].
//
// Special: God Rithwik becomes "The Singularity" — locked 3.0× on every stat
// and bypasses the deletion risk entirely.

export const CORRUPT_COST = 1_000;
export const CORRUPT_FAIL_RATE = 0.05;
export const CORRUPT_FAIL_RATE_WITH_CORE = 0.02;
export const CORRUPT_MAX_MULT = 3.0;
export const CORRUPT_MIN_MULT = 1.0;
export const SINGULARITY_PET_ID = "god_rithwik";

export interface CorruptedRecord {
  hp: number; atk: number; def: number; mag: number;
  isSingularity?: boolean;
  corruptedAt: number;
}

// ─── Public query helpers (used by hunt / zoo / battle wrappers) ─────────────
export function isCorrupted(u: UserData, animalId: string): boolean {
  return Boolean(u.corrupted && u.corrupted[animalId]);
}
export function getCorruptedStats(u: UserData, animalId: string): CorruptedRecord | null {
  return u.corrupted?.[animalId] ?? null;
}
export function teamHasCorruptedPet(u: UserData): boolean {
  if (!Array.isArray(u.team)) return false;
  for (const id of u.team) { if (isCorrupted(u, id)) return true; }
  return false;
}
export function corruptedAnimalCount(u: UserData): number {
  return Object.keys(u.corrupted ?? {}).length;
}

// ─── Tolerant pet lookup ─────────────────────────────────────────────────────
const norm = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const LOOKUP: Record<string, string> = (() => {
  const m: Record<string, string> = {};
  for (const a of ANIMALS) { m[norm(a.id)] = a.id; m[norm(a.name)] = a.id; }
  return m;
})();
function resolveAnimalId(q: string): string | null {
  if (!q) return null;
  return LOOKUP[norm(q)] ?? null;
}

function rollMult(): number {
  // Uniform 1.0 → 3.0
  return CORRUPT_MIN_MULT + Math.random() * (CORRUPT_MAX_MULT - CORRUPT_MIN_MULT);
}

// ─── Command ─────────────────────────────────────────────────────────────────
export async function cmdCorrupt(message: Message, args: string[]): Promise<void> {
  // No args → list user's corrupted pets.
  if (args.length === 0) {
    const u = getUser(message.author.id);
    const entries = Object.entries(u.corrupted ?? {});
    if (entries.length === 0) {
      const e = baseEmbed(message, COLOR.void ?? 0x1a0033)
        .setTitle("👾 Pet Corruptions")
        .setDescription([
          "*Drag a* **max-level pet** *into the void. Their stats may triple — or they may never come back.*",
          "",
          `**Requirements:** A pet at Lv \`${ANIMAL_LEVEL_CAP}\` *(max level)* + 💰 \`${val(CORRUPT_COST)}\` cowoncy.`,
          `**Risk:** \`${Math.round(CORRUPT_FAIL_RATE * 100)}%\` chance the pet stack is **lost to the void**.`,
          `**Reward:** Each stat (HP/ATK/DEF/MAG) rerolled to **1.0× — ${CORRUPT_MAX_MULT.toFixed(1)}×** of base.`,
          "",
          "👑 *Corrupting* **God Rithwik** *creates* **The Singularity** *— locked 3× on every stat, no risk.*",
          "🜏 *Equip the* **Singularity Core** *relic to lower the deletion risk to **2%**.*",
          "",
          "**Usage:** `lowo corrupt <pet name>`",
        ].join("\n"));
      await replyEmbed(message, e);
      return;
    }
    const lines = entries.map(([id, rec]) => {
      const a = ANIMAL_BY_ID[id]; if (!a) return null;
      const tag = rec.isSingularity ? " ⚫ *Singularity*" : "";
      return `👾 ${a.emoji} **~~${a.name}~~**${tag} — ❤️ \`${rec.hp}\` ⚔️ \`${rec.atk}\` 🛡️ \`${rec.def}\` 🔮 \`${rec.mag}\``;
    }).filter(Boolean) as string[];
    const e = baseEmbed(message, COLOR.void ?? 0x1a0033)
      .setTitle(`👾 Your Corrupted Pets *(${entries.length})*`)
      .setDescription(lines.join("\n").slice(0, 3900));
    await replyEmbed(message, e);
    return;
  }

  const id = resolveAnimalId(args.join(" ").trim());
  if (!id) {
    await replyEmbed(message, errorEmbed(message, "Usage", "`lowo corrupt <pet name>` — e.g. `lowo corrupt Lowo King`."));
    return;
  }
  const a = ANIMAL_BY_ID[id]!;
  const u = getUser(message.author.id);
  if ((u.zoo[id] ?? 0) <= 0) {
    await replyEmbed(message, errorEmbed(message, "Don't Own", `You don't own a ${a.emoji} **${a.name}**.`));
    return;
  }
  if (isCorrupted(u, id)) {
    await replyEmbed(message, warnEmbed(message, "Already Corrupted", `${a.emoji} **${a.name}** is already 👾 corrupted. Re-corrupting is not allowed.`));
    return;
  }
  const lvl = animalLevelFromXp(u.animalXp[id] ?? 0);
  if (lvl < ANIMAL_LEVEL_CAP) {
    await replyEmbed(message, warnEmbed(message, "Not Max Level",
      `${a.emoji} **${a.name}** is only **Lv ${lvl}/${ANIMAL_LEVEL_CAP}** — must be at the level cap to corrupt.`));
    return;
  }
  if (u.cowoncy < CORRUPT_COST) {
    await replyEmbed(message, errorEmbed(message, "Not Enough Cowoncy", `Need 💰 \`${val(CORRUPT_COST)}\` *(you have \`${val(u.cowoncy)}\`)*.`));
    return;
  }

  // The Singularity bypass — divine secret, no risk, locked 3×.
  const isSingularity = id === SINGULARITY_PET_ID;
  const failRate = isSingularity
    ? 0
    : (hasRelic(message.author.id, "singularity_core") ? CORRUPT_FAIL_RATE_WITH_CORE : CORRUPT_FAIL_RATE);

  // Pay the cost up-front regardless of outcome.
  updateUser(message.author.id, (x) => { x.cowoncy -= CORRUPT_COST; });

  // Failure path — wipe the entire stack of this species.
  if (!isSingularity && Math.random() < failRate) {
    updateUser(message.author.id, (x) => {
      // Wipe pet records so future hunts reset their progression cleanly.
      x.zoo[id] = 0;
      delete x.animalXp[id];
      delete x.mutations[id];
      delete x.enchantments[id];
      delete x.prestige[id];
      delete x.petSkills[id];
      delete x.petMood[id];
      delete x.petLoyalty[id];
      delete x.lastInteract[id];
      // Cleanup of team/equipment runs automatically inside updateUser.
    });
    const e = baseEmbed(message, COLOR.error ?? 0x000000)
      .setTitle("🕳️ LOST TO THE VOID")
      .setDescription([
        `*The forge cracks open. The void exhales.*`,
        `> ${a.emoji} **${a.name}** *was consumed.* **All copies are gone.**`,
        ``,
        `💀 The 5% deletion risk landed on you this time.`,
      ].join("\n"));
    await replyEmbed(message, e);
    return;
  }

  // Success path.
  const hpMult  = isSingularity ? CORRUPT_MAX_MULT : rollMult();
  const atkMult = isSingularity ? CORRUPT_MAX_MULT : rollMult();
  const defMult = isSingularity ? CORRUPT_MAX_MULT : rollMult();
  const magMult = isSingularity ? CORRUPT_MAX_MULT : rollMult();
  const rec: CorruptedRecord = {
    hp:  Math.floor(a.hp  * hpMult),
    atk: Math.floor(a.atk * atkMult),
    def: Math.floor(a.def * defMult),
    mag: Math.floor(a.mag * magMult),
    isSingularity: isSingularity || undefined,
    corruptedAt: Date.now(),
  };
  updateUser(message.author.id, (x) => {
    x.corrupted = x.corrupted ?? {};
    x.corrupted[id] = rec;
  });

  const fmtMult = (m: number): string => `×${m.toFixed(2)}`;
  if (isSingularity) {
    const e = baseEmbed(message, 0xfde047)
      .setTitle("⚫✨ THE SINGULARITY ✨⚫")
      .setDescription([
        `*The void blinks. It does not consume —* **it bows.**`,
        `> 👑✨🛐 **God Rithwik** has become **THE SINGULARITY**.`,
      ].join("\n"))
      .addFields(
        { name: "❤️ HP",  value: `\`${rec.hp}\`  *(${fmtMult(hpMult)})*`,  inline: true },
        { name: "⚔️ ATK", value: `\`${rec.atk}\` *(${fmtMult(atkMult)})*`, inline: true },
        { name: "🛡️ DEF", value: `\`${rec.def}\` *(${fmtMult(defMult)})*`, inline: true },
        { name: "🔮 MAG", value: `\`${rec.mag}\` *(${fmtMult(magMult)})*`, inline: true },
        { name: "Status", value: "Locked 3× on every stat. Bypasses deletion risk forever.", inline: false },
      );
    await replyEmbed(message, e);
    return;
  }

  const e = baseEmbed(message, COLOR.void ?? 0x1a0033)
    .setTitle("👾 CORRUPTED")
    .setDescription([
      `*The forge howls.* ${a.emoji} **~~${a.name}~~** *staggers out — wrong, glitching, and stronger.*`,
    ].join("\n"))
    .addFields(
      { name: "❤️ HP",  value: `\`${rec.hp}\`  *(${fmtMult(hpMult)})*`,  inline: true },
      { name: "⚔️ ATK", value: `\`${rec.atk}\` *(${fmtMult(atkMult)})*`, inline: true },
      { name: "🛡️ DEF", value: `\`${rec.def}\` *(${fmtMult(defMult)})*`, inline: true },
      { name: "🔮 MAG", value: `\`${rec.mag}\` *(${fmtMult(magMult)})*`, inline: true },
      { name: "Tag",    value: "👾 Now displays as corrupted in `lowo zoo` & `lowo profile`.", inline: false },
      { name: "Hunt",   value: "Required on your team to enter 🕳️ **The Infinite Void** *(Area 6)*.", inline: false },
    );
  await replyEmbed(message, e);
}

// ─── Helper exposed for zoo / profile rendering ──────────────────────────────
export function corruptedTag(u: UserData, animalId: string): string {
  const rec = u.corrupted?.[animalId];
  if (!rec) return "";
  return rec.isSingularity ? " ⚫" : " 👾";
}

// Re-export Animal type for consumers that need it.
export type { Animal };
