export type Rarity = "common" | "uncommon" | "rare" | "epic" | "mythic" | "legendary";

export interface Animal {
  id: string;
  name: string;
  emoji: string;
  rarity: Rarity;
  hp: number;
  atk: number;
  def: number;
  mag: number;
  sellPrice: number;
  essence: number;
}

export const RARITY_WEIGHTS: Record<Rarity, number> = {
  common: 55, uncommon: 25, rare: 12, epic: 5, mythic: 2.5, legendary: 0.5,
};

export const RARITY_COLOR: Record<Rarity, string> = {
  common: "⚪", uncommon: "🟢", rare: "🔵", epic: "🟣", mythic: "🟡", legendary: "🌈",
};

export const ANIMALS: Animal[] = [
  { id: "puppy", name: "Puppy", emoji: "🐶", rarity: "common", hp: 80, atk: 10, def: 8, mag: 5, sellPrice: 25, essence: 1 },
  { id: "kitten", name: "Kitten", emoji: "🐱", rarity: "common", hp: 75, atk: 12, def: 6, mag: 6, sellPrice: 25, essence: 1 },
  { id: "mouse", name: "Mouse", emoji: "🐭", rarity: "common", hp: 50, atk: 6, def: 4, mag: 4, sellPrice: 18, essence: 1 },
  { id: "bunny", name: "Bunny", emoji: "🐰", rarity: "common", hp: 70, atk: 8, def: 7, mag: 5, sellPrice: 22, essence: 1 },
  { id: "chick", name: "Chick", emoji: "🐤", rarity: "common", hp: 60, atk: 7, def: 5, mag: 5, sellPrice: 20, essence: 1 },
  { id: "frog", name: "Frog", emoji: "🐸", rarity: "uncommon", hp: 90, atk: 12, def: 10, mag: 8, sellPrice: 60, essence: 2 },
  { id: "fox", name: "Fox", emoji: "🦊", rarity: "uncommon", hp: 100, atk: 15, def: 9, mag: 10, sellPrice: 75, essence: 2 },
  { id: "panda", name: "Panda", emoji: "🐼", rarity: "uncommon", hp: 120, atk: 14, def: 14, mag: 6, sellPrice: 80, essence: 2 },
  { id: "owl", name: "Owl", emoji: "🦉", rarity: "uncommon", hp: 85, atk: 11, def: 9, mag: 14, sellPrice: 70, essence: 2 },
  { id: "pig", name: "Pig", emoji: "🐷", rarity: "uncommon", hp: 110, atk: 12, def: 12, mag: 6, sellPrice: 65, essence: 2 },
  { id: "wolf", name: "Wolf", emoji: "🐺", rarity: "rare", hp: 140, atk: 22, def: 14, mag: 10, sellPrice: 200, essence: 5 },
  { id: "tiger", name: "Tiger", emoji: "🐯", rarity: "rare", hp: 150, atk: 25, def: 15, mag: 8, sellPrice: 220, essence: 5 },
  { id: "lion", name: "Lion", emoji: "🦁", rarity: "rare", hp: 160, atk: 26, def: 16, mag: 8, sellPrice: 230, essence: 5 },
  { id: "shark", name: "Shark", emoji: "🦈", rarity: "rare", hp: 145, atk: 28, def: 12, mag: 9, sellPrice: 240, essence: 5 },
  { id: "octopus", name: "Octopus", emoji: "🐙", rarity: "rare", hp: 130, atk: 18, def: 14, mag: 22, sellPrice: 210, essence: 5 },
  { id: "unicorn", name: "Unicorn", emoji: "🦄", rarity: "epic", hp: 200, atk: 30, def: 20, mag: 35, sellPrice: 800, essence: 12 },
  { id: "dragon", name: "Dragon", emoji: "🐉", rarity: "epic", hp: 240, atk: 38, def: 24, mag: 30, sellPrice: 900, essence: 12 },
  { id: "tRex", name: "T-Rex", emoji: "🦖", rarity: "epic", hp: 260, atk: 45, def: 22, mag: 8, sellPrice: 850, essence: 12 },
  { id: "phoenix", name: "Phoenix", emoji: "🔥🦅", rarity: "mythic", hp: 320, atk: 50, def: 28, mag: 55, sellPrice: 3500, essence: 30 },
  { id: "kraken", name: "Kraken", emoji: "🦑", rarity: "mythic", hp: 380, atk: 55, def: 32, mag: 45, sellPrice: 3800, essence: 30 },
  { id: "celestial", name: "Celestial", emoji: "🌟", rarity: "mythic", hp: 340, atk: 48, def: 36, mag: 60, sellPrice: 3700, essence: 30 },
  { id: "lowoking", name: "Lowo King", emoji: "👑🦊", rarity: "legendary", hp: 500, atk: 80, def: 50, mag: 80, sellPrice: 25000, essence: 150 },
];

export const ANIMAL_BY_ID: Record<string, Animal> = Object.fromEntries(ANIMALS.map(a => [a.id, a]));

export function rollAnimal(): Animal {
  const total = Object.values(RARITY_WEIGHTS).reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  let chosen: Rarity = "common";
  for (const [rarity, weight] of Object.entries(RARITY_WEIGHTS) as Array<[Rarity, number]>) {
    if (roll < weight) { chosen = rarity; break; }
    roll -= weight;
  }
  const pool = ANIMALS.filter(a => a.rarity === chosen);
  return pool[Math.floor(Math.random() * pool.length)];
}

// ─── Weapons (crate loot) ─────────────────────────────────────────────────────
export const WEAPON_RARITIES = ["common", "uncommon", "rare", "epic", "mythic"] as const;
export type WeaponRarity = typeof WEAPON_RARITIES[number];
export const WEAPON_RARITY_WEIGHTS: Record<WeaponRarity, number> = {
  common: 50, uncommon: 28, rare: 15, epic: 6, mythic: 1,
};
const WEAPON_NAMES = ["Sword", "Bow", "Staff", "Dagger", "Hammer", "Spear", "Axe", "Wand"];
const WEAPON_EMOJI: Record<WeaponRarity, string> = {
  common: "🗡️", uncommon: "⚔️", rare: "🏹", epic: "🔱", mythic: "✨🗡️",
};

export function rollWeapon(): { id: string; rarity: WeaponRarity; mods: { atk: number; def: number; mag: number }; name: string; emoji: string } {
  const total = Object.values(WEAPON_RARITY_WEIGHTS).reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  let rarity: WeaponRarity = "common";
  for (const r of WEAPON_RARITIES) {
    if (roll < WEAPON_RARITY_WEIGHTS[r]) { rarity = r; break; }
    roll -= WEAPON_RARITY_WEIGHTS[r];
  }
  const mult = { common: 1, uncommon: 2, rare: 4, epic: 8, mythic: 16 }[rarity];
  const name = WEAPON_NAMES[Math.floor(Math.random() * WEAPON_NAMES.length)];
  return {
    id: `${name.toLowerCase()}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    rarity, name, emoji: WEAPON_EMOJI[rarity],
    mods: {
      atk: Math.floor((3 + Math.random() * 5) * mult),
      def: Math.floor((2 + Math.random() * 4) * mult),
      mag: Math.floor((2 + Math.random() * 4) * mult),
    },
  };
}

// ─── Loot Boxes (tiered weapon crates) ────────────────────────────────────────
export type BoxTier = "bronze" | "silver" | "gold";
export const BOX_DEFS: Record<BoxTier, { name: string; emoji: string; price: number; rolls: number; floor: WeaponRarity }> = {
  bronze: { name: "Bronze Crate", emoji: "🟫", price: 1500, rolls: 1, floor: "common" },
  silver: { name: "Silver Crate", emoji: "⬜", price: 5000, rolls: 2, floor: "uncommon" },
  gold:   { name: "Gold Crate",   emoji: "🟨", price: 15000, rolls: 3, floor: "rare" },
};

export function rollWeaponFromBox(tier: BoxTier): ReturnType<typeof rollWeapon> {
  const floors: Record<WeaponRarity, number> = { common: 0, uncommon: 1, rare: 2, epic: 3, mythic: 4 };
  const floorN = floors[BOX_DEFS[tier].floor];
  // Reroll until rarity meets the floor (at most 8 attempts)
  for (let i = 0; i < 8; i++) {
    const w = rollWeapon();
    if (floors[w.rarity] >= floorN) return w;
  }
  return rollWeapon();
}

// ─── Profile Backgrounds ──────────────────────────────────────────────────────
export interface Background { id: string; name: string; price: number; gradient: [string, string]; accent: string }
export const BACKGROUNDS: Background[] = [
  { id: "bg_dark",   name: "Midnight",   price: 0,     gradient: ["#0f1117", "#1a1d26"], accent: "#5865f2" },
  { id: "bg_sakura", name: "Sakura",     price: 8000,  gradient: ["#3a1c2e", "#7a3a52"], accent: "#ff7eb6" },
  { id: "bg_ocean",  name: "Ocean",      price: 8000,  gradient: ["#0a1f3a", "#1f4d7a"], accent: "#4dd0e1" },
  { id: "bg_forest", name: "Forest",     price: 8000,  gradient: ["#10261a", "#2a5c3d"], accent: "#7ed957" },
  { id: "bg_royal",  name: "Royal",      price: 25000, gradient: ["#1a0f3a", "#5c2eb3"], accent: "#ffd700" },
  { id: "bg_lava",   name: "Lava",       price: 25000, gradient: ["#2a0808", "#8a1f1f"], accent: "#ff7043" },
];
export const BACKGROUND_BY_ID: Record<string, Background> = Object.fromEntries(BACKGROUNDS.map(b => [b.id, b]));

// ─── Animal Skill Tree (per-animal XP perks) ──────────────────────────────────
// XP gained: 5 per hunt of that species, 25 per battle win when on team.
// Each level = +5% atk/def/mag (capped at level 10 = +50%).
export const ANIMAL_LEVEL_CAP = 10;
export function animalLevelFromXp(xp: number): number {
  // 100 XP for L1, then +50 per level. Cumulative: L = floor((sqrt(1+8*xp/50)-1)/2) ish.
  // Simple curve: level n requires 100 + (n-1)*50 cumulative? Use thresholds array.
  const thresholds = [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200, 4000];
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (xp >= thresholds[i]) return Math.min(i, ANIMAL_LEVEL_CAP);
  }
  return 0;
}
export function animalLevelMultiplier(xp: number): number {
  return 1 + 0.05 * animalLevelFromXp(xp);
}
export function animalXpToNext(xp: number): { current: number; needed: number; level: number } {
  const thresholds = [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200, 4000];
  const lvl = animalLevelFromXp(xp);
  if (lvl >= ANIMAL_LEVEL_CAP) return { current: xp - thresholds[lvl], needed: 0, level: lvl };
  return { current: xp - thresholds[lvl], needed: thresholds[lvl + 1] - thresholds[lvl], level: lvl };
}

// ─── Global Events ────────────────────────────────────────────────────────────
export interface LowoEvent { id: string; name: string; emoji: string; description: string; durationMs: number }
export const EVENTS: LowoEvent[] = [
  { id: "double_hunt", name: "Double Hunt", emoji: "🎯", description: "Hunt drops 2 animals at once", durationMs: 60 * 60 * 1000 },
  { id: "rare_rush",   name: "Rare Rush",   emoji: "💎", description: "Rare+ drop chance ×3 on hunt",  durationMs: 60 * 60 * 1000 },
  { id: "essence_storm", name: "Essence Storm", emoji: "✨", description: "Sacrifices yield ×2 essence", durationMs: 90 * 60 * 1000 },
  { id: "battle_frenzy", name: "Battle Frenzy", emoji: "⚔️", description: "Battle rewards ×2 cowoncy",  durationMs: 60 * 60 * 1000 },
];
export const EVENT_BY_ID: Record<string, LowoEvent> = Object.fromEntries(EVENTS.map(e => [e.id, e]));

// ─── Pity System ──────────────────────────────────────────────────────────────
// Guarantees a legendary at exactly 200 hunts without one.
export const PITY_THRESHOLD = 200;

// ─── Shop items ───────────────────────────────────────────────────────────────
export interface ShopItem { id: string; name: string; emoji: string; price: number; description: string }
export const SHOP_ITEMS: ShopItem[] = [
  { id: "ring",     name: "Wedding Ring",     emoji: "💍", price: 5000,  description: "Required to use `lowo propose`" },
  { id: "crate",    name: "Weapon Crate",     emoji: "📦", price: 2500,  description: "Stored — open with `lowo crate`" },
  { id: "bronze",   name: "Bronze Crate",     emoji: "🟫", price: 1500,  description: "1 weapon roll — open with `lowo box bronze`" },
  { id: "silver",   name: "Silver Crate",     emoji: "⬜", price: 5000,  description: "2 weapon rolls (uncommon+ floor) — `lowo box silver`" },
  { id: "gold",     name: "Gold Crate",       emoji: "🟨", price: 15000, description: "3 weapon rolls (rare+ floor) — `lowo box gold`" },
  { id: "carrot",   name: "Magic Carrot",     emoji: "🥕", price: 200,   description: "Boosts your next piku harvest" },
  { id: "lottery",  name: "Lottery Ticket",   emoji: "🎟️", price: 500,   description: "Daily lottery — winner takes the pot" },
  { id: "petfood",  name: "Pet Food",         emoji: "🍖", price: 100,   description: "Feed your Lowo Pet" },
  // Backgrounds (price = 0 ones are free defaults; > 0 ones are purchaseable)
  ...BACKGROUNDS.filter(b => b.price > 0).map<ShopItem>(b => ({
    id: b.id, name: `BG: ${b.name}`, emoji: "🖼️", price: b.price,
    description: `Profile background — set with \`lowo setbg ${b.id}\``,
  })),
];
export const SHOP_BY_ID: Record<string, ShopItem> = Object.fromEntries(SHOP_ITEMS.map(i => [i.id, i]));
