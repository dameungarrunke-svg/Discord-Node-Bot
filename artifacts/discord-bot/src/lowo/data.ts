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

// ─── Shop items ───────────────────────────────────────────────────────────────
export interface ShopItem { id: string; name: string; emoji: string; price: number; description: string }
export const SHOP_ITEMS: ShopItem[] = [
  { id: "ring", name: "Wedding Ring", emoji: "💍", price: 5000, description: "Required to use `lowo propose`" },
  { id: "crate", name: "Weapon Crate", emoji: "📦", price: 2500, description: "Buy a crate then use `lowo crate`" },
  { id: "carrot", name: "Magic Carrot", emoji: "🥕", price: 200, description: "Boosts your next piku harvest" },
  { id: "lottery", name: "Lottery Ticket", emoji: "🎟️", price: 500, description: "Daily lottery — winner takes the pot" },
  { id: "background", name: "Profile Background", emoji: "🖼️", price: 10000, description: "Cosmetic flex" },
  { id: "petfood", name: "Pet Food", emoji: "🍖", price: 100, description: "Feed your Lowo Pet" },
];
export const SHOP_BY_ID: Record<string, ShopItem> = Object.fromEntries(SHOP_ITEMS.map(i => [i.id, i]));
