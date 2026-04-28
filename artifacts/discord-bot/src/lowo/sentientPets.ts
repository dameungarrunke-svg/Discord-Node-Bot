import type { Message } from "discord.js";
import { getUser, updateUser } from "./storage.js";
import { ANIMAL_BY_ID, ANIMALS, RARITY_ORDER, MINERALS, BOX_DEFS, type Rarity, type BoxTier } from "./data.js";
import { emoji } from "./emojis.js";

// ─── Tunables ────────────────────────────────────────────────────────────────
export const MOOD_MAX = 100;
export const LOYALTY_MAX = 1000;
export const INTERACT_COOLDOWN_MS = 60 * 60 * 1000; // 1h per pet
export const HIGH_LOYALTY_THRESHOLD = 800;
export const FIND_BONUS_CHANCE_PER_HIGH_LOYALTY_PET = 0.005; // 0.5% per qualifying team pet, per hunt
export const MOOD_PER_INTERACT = 15;
export const LOYALTY_PER_INTERACT = 10;
export const MOOD_PER_HUNT = 2;
export const LOYALTY_PER_HUNT = 1;

// ─── Animal lookup (tolerant) ────────────────────────────────────────────────
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

// ─── Dialogue pools per rarity tier ──────────────────────────────────────────
const COMMON_LINES = [
  "*nuzzles your hand*",
  "*wags happily and follows you around*",
  "Squeak! *(it likes you!)*",
  "*flops onto its back for belly rubs*",
  "*chirps gently*",
];
const MID_LINES = [
  "*licks your face* I missed you!",
  "Hooray! Playtime?",
  "*tilts head curiously* What's that smell on you?",
  "I caught a bug for you! …I'll go bury it now.",
  "Pat-pat-pat! More?",
];
const HIGH_LINES = [
  "*purrs deeply* You're my favourite human.",
  "I felt a tremor earlier… something's coming.",
  "Bond unlocked: I will fight for you in the next battle.",
  "*nudges a small shiny stone toward you*",
  "Together forever, hunter.",
];
const TOP_LINES = [
  "✨ *radiates a soft cosmic glow* Your fate is intertwined with mine.",
  "🌌 I have walked the void and returned only because of you.",
  "🔮 The skies whisper your name to me.",
  "💫 I will reshape rarity itself for you, hunter.",
  "🪐 Worlds bow when you call my name.",
];
const TOP_TIER: Rarity[] = ["divine", "glitched", "ethereal", "inferno", "cosmic", "void", "transcendent", "supreme", "secret"];
const HIGH_TIER: Rarity[] = ["legendary", "mythic", "omni"];
const MID_TIER: Rarity[] = ["rare", "epic"];

function dialogueFor(rarity: Rarity): string {
  if (TOP_TIER.includes(rarity))  return TOP_LINES[Math.floor(Math.random() * TOP_LINES.length)];
  if (HIGH_TIER.includes(rarity)) return HIGH_LINES[Math.floor(Math.random() * HIGH_LINES.length)];
  if (MID_TIER.includes(rarity))  return MID_LINES[Math.floor(Math.random() * MID_LINES.length)];
  return COMMON_LINES[Math.floor(Math.random() * COMMON_LINES.length)];
}

function moodLabel(m: number): string {
  if (m >= 80) return "🥰 Ecstatic";
  if (m >= 60) return "😊 Happy";
  if (m >= 40) return "🙂 Content";
  if (m >= 20) return "😐 Restless";
  return "😢 Sad";
}
function loyaltyLabel(l: number): string {
  if (l >= 900) return "💎 Soulbound";
  if (l >= HIGH_LOYALTY_THRESHOLD) return "💖 Devoted";
  if (l >= 500) return "💙 Trusting";
  if (l >= 200) return "🤝 Friendly";
  return "🌱 Stranger";
}

// ─── Hooks called from hunt.ts ───────────────────────────────────────────────
// Bumps mood/loyalty for every team pet on hunt + rolls find-bonus per pet.
// Returns: list of bonus drops awarded (already applied to user storage).
export interface FoundBonus { kind: "mineral" | "box"; id: string; emoji: string; name: string; petId: string; petEmoji: string; petName: string }

export function onHuntForTeam(userId: string, teamIds: string[]): FoundBonus[] {
  const found: FoundBonus[] = [];
  if (teamIds.length === 0) return found;
  updateUser(userId, (x) => {
    for (const id of teamIds) {
      const cur = x.petMood[id] ?? 50;
      x.petMood[id] = Math.min(MOOD_MAX, cur + MOOD_PER_HUNT);
      x.petLoyalty[id] = Math.min(LOYALTY_MAX, (x.petLoyalty[id] ?? 0) + LOYALTY_PER_HUNT);
    }
  });
  const u = getUser(userId);
  for (const id of teamIds) {
    const loyalty = u.petLoyalty[id] ?? 0;
    if (loyalty < HIGH_LOYALTY_THRESHOLD) continue;
    if (Math.random() < FIND_BONUS_CHANCE_PER_HIGH_LOYALTY_PET) {
      const drop = rollFindBonus();
      const a = ANIMAL_BY_ID[id];
      const petEmoji = a?.emoji ?? "🐾";
      const petName = a?.name ?? id;
      // Apply to inventory.
      updateUser(userId, (x) => {
        if (drop.kind === "mineral") x.minerals[drop.id] = (x.minerals[drop.id] ?? 0) + 1;
        else                          x.boxes[drop.id]    = (x.boxes[drop.id] ?? 0) + 1;
      });
      found.push({ ...drop, petId: id, petEmoji, petName });
    }
  }
  return found;
}

function rollFindBonus(): { kind: "mineral" | "box"; id: string; emoji: string; name: string } {
  // 70% chance of a common-ish mineral, 30% chance of a bronze/silver box.
  if (Math.random() < 0.7) {
    const m = MINERALS[Math.floor(Math.random() * MINERALS.length)];
    return { kind: "mineral", id: m.id, emoji: m.emoji, name: m.name };
  }
  const tiers: BoxTier[] = ["bronze", "bronze", "silver"];
  const t = tiers[Math.floor(Math.random() * tiers.length)];
  const def = BOX_DEFS[t];
  return { kind: "box", id: t, emoji: def.emoji, name: def.name };
}

// ─── Commands ────────────────────────────────────────────────────────────────
export async function cmdInteract(message: Message, args: string[]): Promise<void> {
  const query = args.join(" ").trim();
  if (!query) {
    await message.reply("Usage: `lowo interact <pet name>` *(aliases: `play`, `talk`)*");
    return;
  }
  const id = resolveAnimalId(query);
  if (!id) { await message.reply(`❌ I don't know any pet named \`${query}\`.`); return; }
  const a = ANIMAL_BY_ID[id]!;
  const u = getUser(message.author.id);
  if ((u.zoo[id] ?? 0) <= 0) {
    await message.reply(`${emoji("fail")} You don't own a ${a.emoji} **${a.name}** to interact with.`);
    return;
  }
  const now = Date.now();
  const last = u.lastInteract[id] ?? 0;
  if (now - last < INTERACT_COOLDOWN_MS) {
    const left = Math.ceil((INTERACT_COOLDOWN_MS - (now - last)) / 60_000);
    await message.reply(`⏳ ${a.emoji} **${a.name}** wants some space. Try again in **${left}m**.`);
    return;
  }
  let newMood = 0, newLoyalty = 0;
  updateUser(message.author.id, (x) => {
    x.lastInteract[id] = now;
    x.petMood[id]    = Math.min(MOOD_MAX,    (x.petMood[id]    ?? 50) + MOOD_PER_INTERACT);
    x.petLoyalty[id] = Math.min(LOYALTY_MAX, (x.petLoyalty[id] ?? 0)  + LOYALTY_PER_INTERACT);
    newMood = x.petMood[id];
    newLoyalty = x.petLoyalty[id];
  });
  const line = dialogueFor(a.rarity);
  const tag = newLoyalty >= HIGH_LOYALTY_THRESHOLD
    ? `\n💖 **${a.name}** is **devoted** — it'll occasionally find hidden minerals/boxes during hunts.`
    : "";
  await message.reply(
    `${a.emoji} **${a.name}** ${line}\n` +
    `Mood: ${moodLabel(newMood)} (${newMood}/${MOOD_MAX})  •  Loyalty: ${loyaltyLabel(newLoyalty)} (${newLoyalty}/${LOYALTY_MAX})${tag}`,
  );
}

export async function cmdPetMood(message: Message, args: string[]): Promise<void> {
  const u = getUser(message.author.id);
  const query = args.join(" ").trim();

  if (!query) {
    // List all owned pets with mood/loyalty (top 15 by loyalty).
    const owned = Object.keys(u.zoo).filter((k) => (u.zoo[k] ?? 0) > 0);
    if (!owned.length) { await message.reply("📭 You don't own any pets yet."); return; }
    owned.sort((a, b) => (u.petLoyalty[b] ?? 0) - (u.petLoyalty[a] ?? 0));
    const lines = ["💞 **Pet Mood & Loyalty** *(top 15)*"];
    for (const id of owned.slice(0, 15)) {
      const a = ANIMAL_BY_ID[id]; if (!a) continue;
      const m = u.petMood[id]    ?? 50;
      const l = u.petLoyalty[id] ?? 0;
      lines.push(`${a.emoji} **${a.name}** — ${moodLabel(m)} ${m}/${MOOD_MAX} • ${loyaltyLabel(l)} ${l}/${LOYALTY_MAX}`);
    }
    lines.push("\n_Use `lowo interact <pet>` (1h cooldown) to raise both._");
    await message.reply(lines.join("\n").slice(0, 1900));
    return;
  }

  const id = resolveAnimalId(query);
  if (!id) { await message.reply(`❌ Unknown pet \`${query}\`.`); return; }
  const a = ANIMAL_BY_ID[id]!;
  const m = u.petMood[id]    ?? 50;
  const l = u.petLoyalty[id] ?? 0;
  await message.reply(
    `${a.emoji} **${a.name}**\n` +
    `Mood: ${moodLabel(m)} (${m}/${MOOD_MAX})\n` +
    `Loyalty: ${loyaltyLabel(l)} (${l}/${LOYALTY_MAX})${l >= HIGH_LOYALTY_THRESHOLD ? "  💖 *devoted!*" : ""}`,
  );
}
