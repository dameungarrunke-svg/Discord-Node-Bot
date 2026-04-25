import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Optional override file: data/lowo_emojis.json
//   { "fire": "<:fire_custom:123456789012345678>", "coin": "<:coin:...>", ... }
// Anything not overridden falls back to a nice Unicode emoji.
const OVERRIDE_FILE = join(resolve(__dirname, "../../data"), "lowo_emojis.json");

const FALLBACKS: Record<string, string> = {
  // Currencies
  cowoncy: "💰",
  essence: "✨",
  cash: "💎",
  // Activities
  hunt: "🏹",
  fish: "🎣",
  mine: "⛏️",
  craft: "🛠️",
  battle: "⚔️",
  skillbattle: "🔥",
  boss: "👹",
  // Visual decorations
  star: "🌟",
  fire: "🔥",
  bolt: "⚡",
  shield: "🛡️",
  heart: "❤️",
  skull: "💀",
  trophy: "🏆",
  crown: "👑",
  scroll: "📜",
  sparkle: "✨",
  // Pet equipment slots
  weapon: "🗡️",
  armor: "🛡️",
  accessory: "🧿",
  // Areas
  forest: "🌲",
  volcano: "🌋",
  galaxy: "🌌",
  // Bars
  barFull: "█",
  barEmpty: "░",
  // Loot rarities
  void: "🕳️",
  cosmic: "🌌",
  inferno: "🔥",
  secret: "🦷",
};

let overrides: Record<string, string> = {};
let loaded = false;

function load(): void {
  if (loaded) return;
  loaded = true;
  try {
    if (existsSync(OVERRIDE_FILE)) {
      const parsed = JSON.parse(readFileSync(OVERRIDE_FILE, "utf-8"));
      if (parsed && typeof parsed === "object") {
        overrides = parsed as Record<string, string>;
      }
    }
  } catch {
    overrides = {};
  }
}

/**
 * Look up an emoji by short name. Owners can drop a `data/lowo_emojis.json`
 * containing entries like `{"fire":"<:my_fire:123456789012345678>"}` to use
 * real Discord custom emojis. Otherwise we fall back to a Unicode glyph.
 */
export function emoji(name: string): string {
  load();
  return overrides[name] ?? FALLBACKS[name] ?? "";
}

/** Render a horizontal progress bar using the configured bar glyphs. */
export function progressBar(cur: number, max: number, width = 12): string {
  load();
  if (max <= 0) return overrides.barFull ?? FALLBACKS.barFull;
  const pct = Math.max(0, Math.min(1, cur / max));
  const filled = Math.round(pct * width);
  const f = overrides.barFull ?? FALLBACKS.barFull;
  const e = overrides.barEmpty ?? FALLBACKS.barEmpty;
  return f.repeat(filled) + e.repeat(width - filled);
}

/** A short rarity badge with a colored circle + label. */
export function rarityBadge(rarity: string): string {
  const emojiMap: Record<string, string> = {
    common: "⚪", uncommon: "🟢", rare: "🔵", epic: "🟣",
    mythic: "🟡", legendary: "🌈", ethereal: "🩵", divine: "🌕",
    omni: "💠", glitched: "🟥",
    inferno: "🔥", cosmic: "🌌", void: "🕳️", secret: "🦷",
  };
  const e = emojiMap[rarity] ?? "⚫";
  return `${e} \`${rarity}\``;
}
