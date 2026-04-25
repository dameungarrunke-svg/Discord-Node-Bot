import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Optional override file: data/lowo_emojis.json
//   { "fire": "<:fire_custom:123456789012345678>", "coin": "<:coin:...>", ... }
// Anything not overridden falls back to a nice Unicode emoji.
const OVERRIDE_FILE = join(resolve(__dirname, "../../data"), "lowo_emojis.json");

// ─────────────────────────────────────────────────────────────────────────────
// Massive named-emoji catalog. Every key here is a slot you can override with
// a real Discord custom emoji by editing data/lowo_emojis.json. Unicode
// fallbacks are chosen to match what the bot used to print inline so behaviour
// stays identical until you provide overrides.
// ─────────────────────────────────────────────────────────────────────────────
const FALLBACKS: Record<string, string> = {
  // ── Currencies ──────────────────────────────────────────────────────────
  cowoncy: "💰",
  essence: "✨",
  cash: "💎",
  lowoCash: "💎",
  ring: "💍",
  ticket: "🎟️",
  carrot: "🥕",
  petfood: "🍖",
  cookie: "🍪",
  coin: "🪙",
  gem: "💎",
  money: "💵",

  // ── Activities ──────────────────────────────────────────────────────────
  hunt: "🏹",
  fish: "🎣",
  mine: "⛏️",
  craft: "🛠️",
  battle: "⚔️",
  skillbattle: "🔥",
  boss: "👹",
  daily: "🎁",
  vote: "🗳️",
  give: "💸",
  pet: "🐾",
  pray: "🙏",
  curse: "😈",
  gamble: "🎰",
  trade: "🤝",
  quest: "📋",
  event: "🌍",
  emote: "🎭",
  meme: "🤣",

  // ── Equipment slots & gear ──────────────────────────────────────────────
  weapon: "🗡️",
  armor: "🛡️",
  accessory: "🧿",
  pickaxe: "⛏️",
  pickaxe0: "⛏️",
  pickaxe1: "🪓",
  pickaxe2: "🥇",
  pickaxe3: "💎",
  rod: "🎣",
  charm: "📿",
  crate: "📦",
  chest: "🧰",
  box: "🎁",

  // ── Areas ───────────────────────────────────────────────────────────────
  forest: "🌲",
  volcano: "🌋",
  volcanic: "🌋",
  galaxy: "🌌",
  space: "🚀",
  ocean: "🌊",
  desert: "🏜️",
  cave: "🕳️",

  // ── Loot rarities ───────────────────────────────────────────────────────
  common: "⚪",
  uncommon: "🟢",
  rare: "🔵",
  epic: "🟣",
  mythic: "🟡",
  legendary: "🌈",
  ethereal: "🩵",
  divine: "🌕",
  omni: "💠",
  glitched: "🟥",
  inferno: "🔥",
  cosmic: "🌌",
  void: "🕳️",
  secret: "🦷",

  // ── UI / status ─────────────────────────────────────────────────────────
  success: "✅",
  fail: "❌",
  warn: "⚠️",
  info: "ℹ️",
  loading: "⏳",
  lock: "🔒",
  locked: "🔒",
  unlock: "🔓",
  ok: "✅",
  globe: "🌍",
  check: "✅",
  cross: "❌",
  blank: "⬜",
  filled: "✅",
  empty: "📭",
  full: "🎉",
  on: "🟢",
  off: "🔴",
  yes: "✔️",
  no: "✖️",

  // ── Combat stats / FX ──────────────────────────────────────────────────
  atk: "⚔️",
  def: "🛡️",
  mag: "🔮",
  hp: "❤️",
  mp: "💙",
  crit: "💥",
  stun: "💫",
  heal: "💚",
  shield: "🛡️",
  burn: "🔥",
  freeze: "❄️",
  poison: "☠️",
  bleed: "🩸",
  lifesteal: "🧛",
  buff: "🔺",
  debuff: "🔻",
  win: "🏆",
  loss: "💀",
  draw: "🤝",
  versus: "⚡",

  // ── Decoration / flair ──────────────────────────────────────────────────
  star: "🌟",
  stars: "✨",
  fire: "🔥",
  bolt: "⚡",
  heart: "❤️",
  skull: "💀",
  trophy: "🏆",
  crown: "👑",
  scroll: "📜",
  sparkle: "✨",
  sparkles: "✨",
  rainbow: "🌈",
  diamond: "💎",
  music: "🎵",
  party: "🎉",
  flag: "🚩",
  rocket: "🚀",
  bomb: "💣",
  gift: "🎁",

  // ── Time / pace ─────────────────────────────────────────────────────────
  clock: "🕒",
  hourglass: "⏳",
  fast: "💨",
  slow: "🐢",
  cooldown: "⏱️",
  calendar: "📅",

  // ── Profile / progression ───────────────────────────────────────────────
  profile: "👤",
  level: "📈",
  xp: "⭐",
  streak: "🔥",
  rep: "⭐",
  tag: "🏷️",
  bg: "🖼️",
  frame: "🖼️",
  border: "🪙",
  card: "🪪",
  avatar: "🧑",
  rank: "🏅",
  pity: "🌟",
  zoo: "🦊",
  dex: "📕",
  dexFound: "✅",
  dexMissing: "⬜",

  // ── Shop / commerce ─────────────────────────────────────────────────────
  shop: "🛒",
  buy: "🛍️",
  sell: "💰",
  sale: "🏷️",
  premium: "💎",
  bag: "👜",
  receipt: "🧾",
  newItem: "🆕",
  hot: "🔥",

  // ── Social / pet emotes ─────────────────────────────────────────────────
  hug: "🤗",
  kiss: "😘",
  slap: "👋",
  pat: "✋",
  cuddle: "🤲",
  poke: "👉",
  lick: "👅",
  propose: "💍",
  divorce: "💔",
  marry: "💞",
  ship: "🚢",

  // ── Minerals / mining ───────────────────────────────────────────────────
  ore: "🪨",
  iron: "⚙️",
  gold: "🥇",
  silver: "🥈",
  copper: "🟠",
  ruby: "❤️",
  sapphire: "💙",
  emerald: "💚",
  amethyst: "💜",
  obsidian: "🖤",
  mithril: "🩵",
  crystal: "🔮",

  // ── Aquatic / fishing ───────────────────────────────────────────────────
  fishCaught: "🐟",
  shark: "🦈",
  whale: "🐳",
  octopus: "🐙",
  shell: "🐚",

  // ── Bullets / dividers / arrows ─────────────────────────────────────────
  bullet: "•",
  dot: "·",
  arrow: "➜",
  arrowR: "▶",
  arrowL: "◀",
  arrowU: "▲",
  arrowD: "▼",
  divider: "━",
  pipe: "│",

  // ── Bars (used by progressBar) ──────────────────────────────────────────
  barFull: "█",
  barEmpty: "░",
  barLeft: "▕",
  barRight: "▏",
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
  load();
  const e = overrides[rarity] ?? FALLBACKS[rarity] ?? "⚫";
  return `${e} \`${rarity}\``;
}

/** Return every known emoji key in sorted order (for the `lowo emojis` listing). */
export function allEmojiKeys(): string[] {
  load();
  return Array.from(new Set([...Object.keys(FALLBACKS), ...Object.keys(overrides)])).sort();
}

/** Returns true if this key is currently using a custom override (not the fallback). */
export function isOverridden(name: string): boolean {
  load();
  return Object.prototype.hasOwnProperty.call(overrides, name);
}

/**
 * Persist a new override map to `data/lowo_emojis.json` AND swap it into the
 * in-memory cache so subsequent `emoji()` calls return the new values without
 * a bot restart. Used by `lowo emojisync`.
 */
export function saveOverrides(map: Record<string, string>): void {
  const dir = dirname(OVERRIDE_FILE);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(OVERRIDE_FILE, JSON.stringify(map, null, 2) + "\n", "utf-8");
  overrides = { ...map };
  loaded = true;
}

/** Force-reload overrides from disk (e.g. after a manual file edit). */
export function reloadOverrides(): void {
  loaded = false;
  load();
}

/** All known fallback keys (catalog slots), without overrides. */
export function catalogKeys(): string[] {
  return Object.keys(FALLBACKS).sort();
}

/** Current override map (snapshot copy). */
export function getOverrides(): Record<string, string> {
  load();
  return { ...overrides };
}

/**
 * Merge `partial` into the existing override map, persist, and hot-swap into
 * memory. Used by `lowo emojiupload` to add a few emojis at a time without
 * wiping the existing ones.
 */
export function mergeOverrides(partial: Record<string, string>): void {
  load();
  saveOverrides({ ...overrides, ...partial });
}
