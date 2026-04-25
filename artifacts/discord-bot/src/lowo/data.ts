export type Rarity =
  | "common" | "uncommon" | "rare" | "epic" | "mythic" | "legendary"
  | "ethereal" | "divine" | "omni" | "glitched"
  | "inferno" | "cosmic" | "void" | "secret";

export type HuntArea = "default" | "volcanic" | "space";

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
  // Optional flags
  area?: HuntArea | "any";  // which hunt area this belongs to (default = "default")
  huntable?: boolean;       // false → never appears in `lowo hunt`
  aquatic?: boolean;        // true → appears in `lowo fish`
  eventOnly?: boolean;      // true → only via specific events (e.g. glitched)
  signatureSkill?: string;  // skill id from SIGNATURE_SKILLS
}

// Hunt rarity weights. New top tiers are intentionally vanishingly rare.
export const RARITY_WEIGHTS: Record<Rarity, number> = {
  common: 55, uncommon: 25, rare: 12, epic: 5, mythic: 2.5, legendary: 0.5,
  ethereal: 0.05, divine: 0.01, omni: 0.005, glitched: 0,
  inferno: 0.008, cosmic: 0.006, void: 0.002, secret: 0,
};

export const RARITY_ORDER: Rarity[] = [
  "secret", "void", "cosmic", "inferno",
  "glitched", "omni", "divine", "ethereal",
  "legendary", "mythic", "epic", "rare", "uncommon", "common",
];

export const RARITY_COLOR: Record<Rarity, string> = {
  common: "⚪", uncommon: "🟢", rare: "🔵", epic: "🟣",
  mythic: "🟡", legendary: "🌈", ethereal: "🩵", divine: "🌕",
  omni: "💠", glitched: "🟥",
  inferno: "🔥", cosmic: "🌌", void: "🕳️", secret: "🦷",
};

// ─── Signature Skills (battle phase passive triggers) ─────────────────────────
export type SkillType = "lifesteal" | "shield" | "burst" | "true_dmg" | "double" | "burn" | "heal" | "stun";
export interface SignatureSkill {
  id: string; name: string; emoji: string; description: string;
  type: SkillType; power: number;
}
export const SIGNATURE_SKILLS: Record<string, SignatureSkill> = {
  vampiric_bite:  { id: "vampiric_bite",  name: "Vampiric Bite",  emoji: "🧛", description: "Heals attacker for 30% damage dealt.",      type: "lifesteal", power: 0.30 },
  iron_wall:      { id: "iron_wall",      name: "Iron Wall",      emoji: "🛡️", description: "Defender takes 50% reduced damage this hit.", type: "shield",    power: 0.50 },
  fire_breath:    { id: "fire_breath",    name: "Fire Breath",    emoji: "🔥", description: "Damage ×2 this hit.",                          type: "burst",     power: 2.00 },
  piercing_strike:{ id: "piercing_strike",name: "Piercing Strike",emoji: "🗡️", description: "Ignores defense this hit.",                    type: "true_dmg",  power: 1.00 },
  flurry:         { id: "flurry",         name: "Flurry",         emoji: "💨", description: "Strikes twice this turn.",                     type: "double",    power: 2.00 },
  cinder_burn:    { id: "cinder_burn",    name: "Cinder Burn",    emoji: "🌶️", description: "Adds 5% of victim's max HP as bonus damage.",  type: "burn",      power: 0.05 },
  blessed_aura:   { id: "blessed_aura",   name: "Blessed Aura",   emoji: "✨", description: "Heals the lowest-HP teammate for 15% max HP.", type: "heal",      power: 0.15 },
  petrify:        { id: "petrify",        name: "Petrify",        emoji: "🪨", description: "Defender skips its next attack.",              type: "stun",      power: 1.00 },
};

// ─── Animals ──────────────────────────────────────────────────────────────────
// Land/forest pool — appears in `lowo hunt` (default area).
const DEFAULT_ANIMALS: Animal[] = [
  // Common
  { id: "puppy",      name: "Puppy",      emoji: "🐶", rarity: "common", hp: 80, atk: 10, def: 8,  mag: 5,  sellPrice: 25, essence: 1, signatureSkill: "vampiric_bite" },
  { id: "kitten",     name: "Kitten",     emoji: "🐱", rarity: "common", hp: 75, atk: 12, def: 6,  mag: 6,  sellPrice: 25, essence: 1, signatureSkill: "flurry" },
  { id: "mouse",      name: "Mouse",      emoji: "🐭", rarity: "common", hp: 50, atk: 6,  def: 4,  mag: 4,  sellPrice: 18, essence: 1 },
  { id: "bunny",      name: "Bunny",      emoji: "🐰", rarity: "common", hp: 70, atk: 8,  def: 7,  mag: 5,  sellPrice: 22, essence: 1, signatureSkill: "flurry" },
  { id: "chick",      name: "Chick",      emoji: "🐤", rarity: "common", hp: 60, atk: 7,  def: 5,  mag: 5,  sellPrice: 20, essence: 1 },
  { id: "hamster",    name: "Hamster",    emoji: "🐹", rarity: "common", hp: 55, atk: 7,  def: 5,  mag: 4,  sellPrice: 20, essence: 1 },
  { id: "squirrel",   name: "Squirrel",   emoji: "🐿️", rarity: "common", hp: 60, atk: 9,  def: 5,  mag: 6,  sellPrice: 22, essence: 1 },
  { id: "hedgehog",   name: "Hedgehog",   emoji: "🦔", rarity: "common", hp: 70, atk: 8,  def: 11, mag: 4,  sellPrice: 24, essence: 1, signatureSkill: "iron_wall" },
  { id: "duckling",   name: "Duckling",   emoji: "🦆", rarity: "common", hp: 65, atk: 7,  def: 6,  mag: 6,  sellPrice: 21, essence: 1 },
  { id: "turtle",     name: "Turtle",     emoji: "🐢", rarity: "common", hp: 95, atk: 5,  def: 16, mag: 4,  sellPrice: 28, essence: 1, signatureSkill: "iron_wall" },
  { id: "snail",      name: "Snail",      emoji: "🐌", rarity: "common", hp: 90, atk: 3,  def: 14, mag: 3,  sellPrice: 19, essence: 1 },
  { id: "caterpillar",name: "Caterpillar",emoji: "🐛", rarity: "common", hp: 50, atk: 5,  def: 5,  mag: 5,  sellPrice: 18, essence: 1 },
  { id: "sparrow",    name: "Sparrow",    emoji: "🐦", rarity: "common", hp: 55, atk: 9,  def: 4,  mag: 7,  sellPrice: 22, essence: 1 },

  // Uncommon
  { id: "frog",       name: "Frog",       emoji: "🐸", rarity: "uncommon", hp: 90,  atk: 12, def: 10, mag: 8,  sellPrice: 60, essence: 2, signatureSkill: "cinder_burn" },
  { id: "fox",        name: "Fox",        emoji: "🦊", rarity: "uncommon", hp: 100, atk: 15, def: 9,  mag: 10, sellPrice: 75, essence: 2, signatureSkill: "flurry" },
  { id: "panda",      name: "Panda",      emoji: "🐼", rarity: "uncommon", hp: 120, atk: 14, def: 14, mag: 6,  sellPrice: 80, essence: 2 },
  { id: "owl",        name: "Owl",        emoji: "🦉", rarity: "uncommon", hp: 85,  atk: 11, def: 9,  mag: 14, sellPrice: 70, essence: 2, signatureSkill: "blessed_aura" },
  { id: "pig",        name: "Pig",        emoji: "🐷", rarity: "uncommon", hp: 110, atk: 12, def: 12, mag: 6,  sellPrice: 65, essence: 2 },
  { id: "penguin",    name: "Penguin",    emoji: "🐧", rarity: "uncommon", hp: 95,  atk: 11, def: 11, mag: 8,  sellPrice: 70, essence: 2 },
  { id: "koala",      name: "Koala",      emoji: "🐨", rarity: "uncommon", hp: 105, atk: 10, def: 13, mag: 7,  sellPrice: 72, essence: 2 },
  { id: "raccoon",    name: "Raccoon",    emoji: "🦝", rarity: "uncommon", hp: 90,  atk: 14, def: 9,  mag: 9,  sellPrice: 70, essence: 2 },
  { id: "hawk",       name: "Hawk",       emoji: "🦅", rarity: "uncommon", hp: 95,  atk: 17, def: 8,  mag: 11, sellPrice: 78, essence: 2, signatureSkill: "piercing_strike" },
  { id: "sheep",      name: "Sheep",      emoji: "🐑", rarity: "uncommon", hp: 110, atk: 9,  def: 13, mag: 6,  sellPrice: 65, essence: 2 },
  { id: "cow",        name: "Cow",        emoji: "🐄", rarity: "uncommon", hp: 130, atk: 12, def: 13, mag: 5,  sellPrice: 75, essence: 2 },
  { id: "goat",       name: "Goat",       emoji: "🐐", rarity: "uncommon", hp: 105, atk: 13, def: 11, mag: 7,  sellPrice: 70, essence: 2 },
  { id: "deer",       name: "Deer",       emoji: "🦌", rarity: "uncommon", hp: 105, atk: 14, def: 10, mag: 8,  sellPrice: 72, essence: 2 },
  { id: "donkey",     name: "Donkey",     emoji: "🫏", rarity: "uncommon", hp: 115, atk: 11, def: 12, mag: 6,  sellPrice: 68, essence: 2 },
  { id: "llama",      name: "Llama",      emoji: "🦙", rarity: "uncommon", hp: 110, atk: 12, def: 11, mag: 8,  sellPrice: 70, essence: 2 },

  // Rare
  { id: "wolf",       name: "Wolf",       emoji: "🐺", rarity: "rare", hp: 140, atk: 22, def: 14, mag: 10, sellPrice: 200, essence: 5, signatureSkill: "vampiric_bite" },
  { id: "tiger",      name: "Tiger",      emoji: "🐯", rarity: "rare", hp: 150, atk: 25, def: 15, mag: 8,  sellPrice: 220, essence: 5, signatureSkill: "flurry" },
  { id: "lion",       name: "Lion",       emoji: "🦁", rarity: "rare", hp: 160, atk: 26, def: 16, mag: 8,  sellPrice: 230, essence: 5, signatureSkill: "fire_breath" },
  { id: "shark",      name: "Shark",      emoji: "🦈", rarity: "rare", hp: 145, atk: 28, def: 12, mag: 9,  sellPrice: 240, essence: 5, signatureSkill: "vampiric_bite" },
  { id: "octopus",    name: "Octopus",    emoji: "🐙", rarity: "rare", hp: 130, atk: 18, def: 14, mag: 22, sellPrice: 210, essence: 5, signatureSkill: "blessed_aura" },
  { id: "cheetah",    name: "Cheetah",    emoji: "🐆", rarity: "rare", hp: 135, atk: 30, def: 11, mag: 10, sellPrice: 235, essence: 5, signatureSkill: "flurry" },
  { id: "eagle",      name: "Eagle",      emoji: "🦅", rarity: "rare", hp: 130, atk: 28, def: 12, mag: 12, sellPrice: 230, essence: 5, signatureSkill: "piercing_strike" },
  { id: "crocodile",  name: "Crocodile",  emoji: "🐊", rarity: "rare", hp: 165, atk: 27, def: 18, mag: 7,  sellPrice: 240, essence: 5, signatureSkill: "vampiric_bite" },
  { id: "bear",       name: "Bear",       emoji: "🐻", rarity: "rare", hp: 175, atk: 26, def: 19, mag: 8,  sellPrice: 245, essence: 5, signatureSkill: "iron_wall" },
  { id: "gorilla",    name: "Gorilla",    emoji: "🦍", rarity: "rare", hp: 170, atk: 28, def: 17, mag: 8,  sellPrice: 245, essence: 5 },
  { id: "rhino",      name: "Rhino",      emoji: "🦏", rarity: "rare", hp: 180, atk: 25, def: 22, mag: 6,  sellPrice: 250, essence: 5, signatureSkill: "iron_wall" },
  { id: "bull",       name: "Bull",       emoji: "🐂", rarity: "rare", hp: 165, atk: 27, def: 17, mag: 7,  sellPrice: 235, essence: 5 },
  { id: "elk",        name: "Elk",        emoji: "🫎", rarity: "rare", hp: 155, atk: 24, def: 16, mag: 9,  sellPrice: 225, essence: 5 },
  { id: "komodo",     name: "Komodo",     emoji: "🦎", rarity: "rare", hp: 145, atk: 26, def: 14, mag: 10, sellPrice: 235, essence: 5, signatureSkill: "cinder_burn" },

  // Epic
  { id: "unicorn",    name: "Unicorn",    emoji: "🦄", rarity: "epic", hp: 200, atk: 30, def: 20, mag: 35, sellPrice: 800, essence: 12, signatureSkill: "blessed_aura" },
  { id: "dragon",     name: "Dragon",     emoji: "🐉", rarity: "epic", hp: 240, atk: 38, def: 24, mag: 30, sellPrice: 900, essence: 12, signatureSkill: "fire_breath" },
  { id: "tRex",       name: "T-Rex",      emoji: "🦖", rarity: "epic", hp: 260, atk: 45, def: 22, mag: 8,  sellPrice: 850, essence: 12, signatureSkill: "fire_breath" },
  { id: "griffin",    name: "Griffin",    emoji: "🦅", rarity: "epic", hp: 220, atk: 36, def: 22, mag: 28, sellPrice: 850, essence: 12, signatureSkill: "piercing_strike" },
  { id: "pegasus",    name: "Pegasus",    emoji: "🐴", rarity: "epic", hp: 210, atk: 32, def: 22, mag: 30, sellPrice: 820, essence: 12, signatureSkill: "blessed_aura" },
  { id: "centaur",    name: "Centaur",    emoji: "🏹", rarity: "epic", hp: 215, atk: 34, def: 21, mag: 24, sellPrice: 820, essence: 12, signatureSkill: "piercing_strike" },
  { id: "werewolf",   name: "Werewolf",   emoji: "🐺", rarity: "epic", hp: 230, atk: 40, def: 21, mag: 18, sellPrice: 850, essence: 12, signatureSkill: "vampiric_bite" },
  { id: "sphinx",     name: "Sphinx",     emoji: "🦁", rarity: "epic", hp: 220, atk: 32, def: 24, mag: 32, sellPrice: 870, essence: 12, signatureSkill: "petrify" },
  { id: "manticore",  name: "Manticore",  emoji: "🦂", rarity: "epic", hp: 225, atk: 38, def: 22, mag: 22, sellPrice: 850, essence: 12, signatureSkill: "cinder_burn" },
  { id: "chimera",    name: "Chimera",    emoji: "🐲", rarity: "epic", hp: 240, atk: 36, def: 23, mag: 26, sellPrice: 880, essence: 12, signatureSkill: "fire_breath" },

  // Mythic
  { id: "phoenix",    name: "Phoenix",    emoji: "🔥🦅", rarity: "mythic", hp: 320, atk: 50, def: 28, mag: 55, sellPrice: 3500, essence: 30, signatureSkill: "blessed_aura" },
  { id: "kraken",     name: "Kraken",     emoji: "🦑",   rarity: "mythic", hp: 380, atk: 55, def: 32, mag: 45, sellPrice: 3800, essence: 30, signatureSkill: "petrify" },
  { id: "celestial",  name: "Celestial",  emoji: "🌟",   rarity: "mythic", hp: 340, atk: 48, def: 36, mag: 60, sellPrice: 3700, essence: 30, signatureSkill: "blessed_aura" },
  { id: "hydra",      name: "Hydra",      emoji: "🐍",   rarity: "mythic", hp: 360, atk: 52, def: 30, mag: 40, sellPrice: 3700, essence: 30, signatureSkill: "flurry" },
  { id: "cerberus",   name: "Cerberus",   emoji: "🐕‍🦺",  rarity: "mythic", hp: 350, atk: 56, def: 30, mag: 38, sellPrice: 3700, essence: 30, signatureSkill: "vampiric_bite" },
  { id: "leviathan",  name: "Leviathan",  emoji: "🐉",   rarity: "mythic", hp: 400, atk: 50, def: 36, mag: 48, sellPrice: 3900, essence: 30, signatureSkill: "fire_breath" },
  { id: "behemoth",   name: "Behemoth",   emoji: "🦣",   rarity: "mythic", hp: 420, atk: 54, def: 40, mag: 30, sellPrice: 3900, essence: 30, signatureSkill: "iron_wall" },
  { id: "basilisk",   name: "Basilisk",   emoji: "🐍",   rarity: "mythic", hp: 340, atk: 52, def: 28, mag: 42, sellPrice: 3700, essence: 30, signatureSkill: "petrify" },
  { id: "yeti",       name: "Yeti",       emoji: "🧊",   rarity: "mythic", hp: 360, atk: 50, def: 34, mag: 40, sellPrice: 3700, essence: 30, signatureSkill: "iron_wall" },

  // Legendary
  { id: "lowoking",   name: "Lowo King",  emoji: "👑🦊", rarity: "legendary", hp: 500, atk: 80, def: 50, mag: 80, sellPrice: 25000, essence: 150, signatureSkill: "fire_breath" },
  { id: "bahamut",    name: "Bahamut",    emoji: "🐲",   rarity: "legendary", hp: 520, atk: 82, def: 52, mag: 70, sellPrice: 26000, essence: 150, signatureSkill: "fire_breath" },
  { id: "tiamat",     name: "Tiamat",     emoji: "🐉",   rarity: "legendary", hp: 510, atk: 78, def: 50, mag: 85, sellPrice: 26000, essence: 150, signatureSkill: "fire_breath" },
  { id: "ouroboros",  name: "Ouroboros",  emoji: "🐍",   rarity: "legendary", hp: 530, atk: 76, def: 56, mag: 78, sellPrice: 26000, essence: 150, signatureSkill: "vampiric_bite" },

  // Ethereal
  { id: "seraph",     name: "Seraph",     emoji: "👼",   rarity: "ethereal", hp: 600, atk: 90, def: 60, mag: 100, sellPrice: 60000, essence: 400, signatureSkill: "blessed_aura" },
  { id: "wraith",     name: "Wraith",     emoji: "👻",   rarity: "ethereal", hp: 560, atk: 100, def: 50, mag: 95, sellPrice: 60000, essence: 400, signatureSkill: "vampiric_bite" },
  { id: "etherbeast", name: "Etherbeast", emoji: "🌌",   rarity: "ethereal", hp: 620, atk: 92, def: 62, mag: 92, sellPrice: 62000, essence: 420, signatureSkill: "piercing_strike" },

  // Divine
  { id: "sungod",     name: "Sun God",    emoji: "☀️",   rarity: "divine", hp: 800, atk: 120, def: 80, mag: 130, sellPrice: 200000, essence: 1200, signatureSkill: "fire_breath" },
  { id: "moongoddess",name: "Moon Goddess",emoji: "🌙",  rarity: "divine", hp: 780, atk: 110, def: 80, mag: 140, sellPrice: 200000, essence: 1200, signatureSkill: "blessed_aura" },

  // Omni — Arcues (the legendary catch)
  { id: "arcues",     name: "Arcues",     emoji: "🌠",   rarity: "omni", hp: 1100, atk: 160, def: 120, mag: 180, sellPrice: 1000000, essence: 5000, signatureSkill: "petrify" },
];

// ─── Volcanic-area animals (60+) — unlocks at 100% default dex ────────────────
const VOLCANIC_ANIMALS: Animal[] = [
  // Common (15)
  { id: "ember_pup",       name: "Ember Pup",        emoji: "🔥🐶", rarity: "common", hp: 90, atk: 12, def: 9,  mag: 7,  sellPrice: 38, essence: 1, signatureSkill: "cinder_burn" },
  { id: "cinder_cub",      name: "Cinder Cub",       emoji: "🔥🐻", rarity: "common", hp: 95, atk: 11, def: 10, mag: 6,  sellPrice: 38, essence: 1 },
  { id: "lava_mouse",      name: "Lava Mouse",       emoji: "🔥🐭", rarity: "common", hp: 60, atk: 8,  def: 5,  mag: 6,  sellPrice: 32, essence: 1 },
  { id: "ash_bunny",       name: "Ash Bunny",        emoji: "🔥🐰", rarity: "common", hp: 75, atk: 10, def: 8,  mag: 7,  sellPrice: 36, essence: 1, signatureSkill: "flurry" },
  { id: "magma_mole",      name: "Magma Mole",       emoji: "🔥🐀", rarity: "common", hp: 80, atk: 9,  def: 11, mag: 5,  sellPrice: 35, essence: 1 },
  { id: "smoke_sparrow",   name: "Smoke Sparrow",    emoji: "🔥🐦", rarity: "common", hp: 60, atk: 11, def: 5,  mag: 9,  sellPrice: 36, essence: 1 },
  { id: "coal_hare",       name: "Coal Hare",        emoji: "🔥🐇", rarity: "common", hp: 75, atk: 10, def: 7,  mag: 7,  sellPrice: 36, essence: 1 },
  { id: "soot_skunk",      name: "Soot Skunk",       emoji: "🔥🦨", rarity: "common", hp: 85, atk: 11, def: 9,  mag: 7,  sellPrice: 38, essence: 1 },
  { id: "char_snail",      name: "Char Snail",       emoji: "🔥🐌", rarity: "common", hp: 100,atk: 4,  def: 18, mag: 4,  sellPrice: 32, essence: 1, signatureSkill: "iron_wall" },
  { id: "spark_rat",       name: "Spark Rat",        emoji: "⚡🐀", rarity: "common", hp: 65, atk: 12, def: 5,  mag: 9,  sellPrice: 35, essence: 1 },
  { id: "heat_toad",       name: "Heat Toad",        emoji: "🔥🐸", rarity: "common", hp: 85, atk: 9,  def: 10, mag: 9,  sellPrice: 38, essence: 1 },
  { id: "glow_beetle",     name: "Glow Beetle",      emoji: "🔥🪲", rarity: "common", hp: 70, atk: 10, def: 12, mag: 6,  sellPrice: 36, essence: 1 },
  { id: "steam_newt",      name: "Steam Newt",       emoji: "♨️🦎", rarity: "common", hp: 70, atk: 10, def: 8,  mag: 10, sellPrice: 36, essence: 1 },
  { id: "furnace_mouse",   name: "Furnace Mouse",    emoji: "🔥🐁", rarity: "common", hp: 60, atk: 9,  def: 6,  mag: 7,  sellPrice: 33, essence: 1 },
  { id: "ash_lizard",      name: "Ash Lizard",       emoji: "🔥🦎", rarity: "common", hp: 80, atk: 11, def: 9,  mag: 7,  sellPrice: 38, essence: 1 },

  // Uncommon (12)
  { id: "magma_frog",      name: "Magma Frog",       emoji: "🔥🐸", rarity: "uncommon", hp: 110, atk: 16, def: 12, mag: 10, sellPrice: 110, essence: 3, signatureSkill: "cinder_burn" },
  { id: "ember_fox",       name: "Ember Fox",        emoji: "🔥🦊", rarity: "uncommon", hp: 115, atk: 18, def: 11, mag: 13, sellPrice: 115, essence: 3, signatureSkill: "flurry" },
  { id: "lava_boar",       name: "Lava Boar",        emoji: "🔥🐗", rarity: "uncommon", hp: 130, atk: 16, def: 14, mag: 8,  sellPrice: 110, essence: 3 },
  { id: "cinder_owl",      name: "Cinder Owl",       emoji: "🔥🦉", rarity: "uncommon", hp: 95,  atk: 14, def: 11, mag: 18, sellPrice: 110, essence: 3, signatureSkill: "blessed_aura" },
  { id: "pyre_pup",        name: "Pyre Pup",         emoji: "🔥🐺", rarity: "uncommon", hp: 110, atk: 17, def: 11, mag: 12, sellPrice: 115, essence: 3 },
  { id: "brimstone_bat",   name: "Brimstone Bat",    emoji: "🔥🦇", rarity: "uncommon", hp: 95,  atk: 18, def: 9,  mag: 14, sellPrice: 115, essence: 3, signatureSkill: "vampiric_bite" },
  { id: "volcano_crab",    name: "Volcano Crab",     emoji: "🔥🦀", rarity: "uncommon", hp: 110, atk: 14, def: 18, mag: 7,  sellPrice: 108, essence: 3, signatureSkill: "iron_wall" },
  { id: "obsidian_newt",   name: "Obsidian Newt",    emoji: "🖤🦎", rarity: "uncommon", hp: 100, atk: 15, def: 13, mag: 12, sellPrice: 110, essence: 3 },
  { id: "magma_skink",     name: "Magma Skink",      emoji: "🔥🦎", rarity: "uncommon", hp: 105, atk: 16, def: 12, mag: 11, sellPrice: 110, essence: 3 },
  { id: "coal_hawk",       name: "Coal Hawk",        emoji: "🔥🦅", rarity: "uncommon", hp: 100, atk: 19, def: 9,  mag: 13, sellPrice: 118, essence: 3, signatureSkill: "piercing_strike" },
  { id: "geyser_otter",    name: "Geyser Otter",     emoji: "♨️🦦", rarity: "uncommon", hp: 110, atk: 14, def: 12, mag: 14, sellPrice: 110, essence: 3 },
  { id: "sulphur_sal",     name: "Sulphur Salamander", emoji: "🔥🦎", rarity: "uncommon", hp: 105, atk: 16, def: 11, mag: 12, sellPrice: 112, essence: 3 },

  // Rare (12)
  { id: "lava_wolf",       name: "Lava Wolf",        emoji: "🔥🐺", rarity: "rare", hp: 160, atk: 26, def: 16, mag: 12, sellPrice: 320, essence: 6, signatureSkill: "fire_breath" },
  { id: "magma_tiger",     name: "Magma Tiger",      emoji: "🔥🐯", rarity: "rare", hp: 170, atk: 30, def: 17, mag: 11, sellPrice: 340, essence: 6, signatureSkill: "fire_breath" },
  { id: "pyrolion",        name: "Pyrolion",         emoji: "🔥🦁", rarity: "rare", hp: 180, atk: 31, def: 18, mag: 11, sellPrice: 350, essence: 6, signatureSkill: "fire_breath" },
  { id: "cinder_cheetah",  name: "Cinder Cheetah",   emoji: "🔥🐆", rarity: "rare", hp: 150, atk: 35, def: 13, mag: 12, sellPrice: 360, essence: 6, signatureSkill: "flurry" },
  { id: "inferno_hawk",    name: "Inferno Hawk",     emoji: "🔥🦅", rarity: "rare", hp: 145, atk: 33, def: 13, mag: 14, sellPrice: 350, essence: 6, signatureSkill: "piercing_strike" },
  { id: "magma_croc",      name: "Magma Croc",       emoji: "🔥🐊", rarity: "rare", hp: 185, atk: 31, def: 20, mag: 9,  sellPrice: 360, essence: 6, signatureSkill: "vampiric_bite" },
  { id: "lava_bear",       name: "Lava Bear",        emoji: "🔥🐻", rarity: "rare", hp: 195, atk: 30, def: 22, mag: 10, sellPrice: 365, essence: 6, signatureSkill: "iron_wall" },
  { id: "tempest_bull",    name: "Tempest Bull",     emoji: "🔥🐂", rarity: "rare", hp: 185, atk: 31, def: 19, mag: 9,  sellPrice: 355, essence: 6 },
  { id: "volcano_komodo",  name: "Volcano Komodo",   emoji: "🔥🦎", rarity: "rare", hp: 165, atk: 30, def: 16, mag: 12, sellPrice: 355, essence: 6, signatureSkill: "cinder_burn" },
  { id: "brimstone_wyvern",name: "Brimstone Wyvern", emoji: "🔥🐲", rarity: "rare", hp: 175, atk: 32, def: 17, mag: 16, sellPrice: 380, essence: 7, signatureSkill: "fire_breath" },
  { id: "magma_rhino",     name: "Magma Rhino",      emoji: "🔥🦏", rarity: "rare", hp: 200, atk: 29, def: 26, mag: 8,  sellPrice: 370, essence: 6, signatureSkill: "iron_wall" },
  { id: "ember_gorilla",   name: "Ember Gorilla",    emoji: "🔥🦍", rarity: "rare", hp: 190, atk: 32, def: 19, mag: 10, sellPrice: 370, essence: 6 },

  // Epic (10)
  { id: "magma_dragon",    name: "Magma Dragon",     emoji: "🔥🐉", rarity: "epic", hp: 270, atk: 42, def: 26, mag: 34, sellPrice: 1300, essence: 16, signatureSkill: "fire_breath" },
  { id: "inferno_pegasus", name: "Inferno Pegasus",  emoji: "🔥🐴", rarity: "epic", hp: 230, atk: 36, def: 24, mag: 34, sellPrice: 1250, essence: 16, signatureSkill: "blessed_aura" },
  { id: "pyre_griffin",    name: "Pyre Griffin",     emoji: "🔥🦅", rarity: "epic", hp: 245, atk: 40, def: 24, mag: 32, sellPrice: 1280, essence: 16, signatureSkill: "piercing_strike" },
  { id: "lava_sphinx",     name: "Lava Sphinx",      emoji: "🔥🦁", rarity: "epic", hp: 240, atk: 36, def: 26, mag: 36, sellPrice: 1300, essence: 16, signatureSkill: "petrify" },
  { id: "cinder_manticore",name: "Cinder Manticore", emoji: "🔥🦂", rarity: "epic", hp: 245, atk: 42, def: 24, mag: 26, sellPrice: 1280, essence: 16, signatureSkill: "cinder_burn" },
  { id: "magma_chimera",   name: "Magma Chimera",    emoji: "🔥🐲", rarity: "epic", hp: 265, atk: 40, def: 25, mag: 30, sellPrice: 1300, essence: 16, signatureSkill: "fire_breath" },
  { id: "ember_centaur",   name: "Ember Centaur",    emoji: "🔥🏹", rarity: "epic", hp: 235, atk: 38, def: 23, mag: 28, sellPrice: 1240, essence: 16, signatureSkill: "piercing_strike" },
  { id: "volcanic_trex",   name: "Volcanic T-Rex",   emoji: "🔥🦖", rarity: "epic", hp: 290, atk: 50, def: 24, mag: 10, sellPrice: 1320, essence: 16, signatureSkill: "fire_breath" },
  { id: "inferno_wyrm",    name: "Inferno Wyrm",     emoji: "🔥🐍", rarity: "epic", hp: 270, atk: 44, def: 24, mag: 28, sellPrice: 1300, essence: 16, signatureSkill: "cinder_burn" },
  { id: "pyre_werewolf",   name: "Pyre Werewolf",    emoji: "🔥🐺", rarity: "epic", hp: 255, atk: 44, def: 23, mag: 20, sellPrice: 1280, essence: 16, signatureSkill: "vampiric_bite" },

  // Mythic (8)
  { id: "magma_phoenix",   name: "Magma Phoenix",    emoji: "🔥🦅", rarity: "mythic", hp: 360, atk: 55, def: 30, mag: 60, sellPrice: 5200, essence: 40, signatureSkill: "blessed_aura" },
  { id: "pyrohydra",       name: "Pyrohydra",        emoji: "🔥🐍", rarity: "mythic", hp: 400, atk: 58, def: 32, mag: 45, sellPrice: 5400, essence: 40, signatureSkill: "flurry" },
  { id: "lava_kraken",     name: "Lava Kraken",      emoji: "🔥🦑", rarity: "mythic", hp: 410, atk: 60, def: 34, mag: 48, sellPrice: 5500, essence: 40, signatureSkill: "petrify" },
  { id: "volcanic_behemoth",name: "Volcanic Behemoth", emoji: "🔥🦣", rarity: "mythic", hp: 460, atk: 58, def: 44, mag: 32, sellPrice: 5600, essence: 40, signatureSkill: "iron_wall" },
  { id: "inferno_yeti",    name: "Inferno Yeti",     emoji: "🔥🧊", rarity: "mythic", hp: 390, atk: 55, def: 36, mag: 42, sellPrice: 5300, essence: 40, signatureSkill: "iron_wall" },
  { id: "magma_cerberus",  name: "Magma Cerberus",   emoji: "🔥🐕‍🦺", rarity: "mythic", hp: 380, atk: 60, def: 32, mag: 40, sellPrice: 5300, essence: 40, signatureSkill: "vampiric_bite" },
  { id: "pyre_basilisk",   name: "Pyre Basilisk",    emoji: "🔥🐍", rarity: "mythic", hp: 370, atk: 56, def: 30, mag: 46, sellPrice: 5300, essence: 40, signatureSkill: "petrify" },
  { id: "volcanic_levia",  name: "Volcanic Leviathan", emoji: "🔥🐉", rarity: "mythic", hp: 430, atk: 56, def: 38, mag: 50, sellPrice: 5500, essence: 40, signatureSkill: "fire_breath" },

  // Legendary (3)
  { id: "magma_lord",      name: "Magma Lord",       emoji: "🔥👑", rarity: "legendary", hp: 560, atk: 90, def: 56, mag: 80, sellPrice: 38000, essence: 200, signatureSkill: "fire_breath" },
  { id: "inferno_king",    name: "Inferno King",     emoji: "🔥🤴", rarity: "legendary", hp: 580, atk: 92, def: 58, mag: 76, sellPrice: 40000, essence: 200, signatureSkill: "fire_breath" },
  { id: "pyrothalassa",    name: "Pyrothalassa",     emoji: "🔥🌊", rarity: "legendary", hp: 600, atk: 86, def: 64, mag: 90, sellPrice: 42000, essence: 220, signatureSkill: "blessed_aura" },

  // Inferno (2) — top of the volcanic ladder
  { id: "sol_inferno",     name: "Sol-Inferno",      emoji: "☀️🔥", rarity: "inferno", hp: 900, atk: 140, def: 90, mag: 150, sellPrice: 350000, essence: 1800, signatureSkill: "fire_breath" },
  { id: "helios_tyrant",   name: "Helios Tyrant",    emoji: "🌞🔥", rarity: "inferno", hp: 950, atk: 150, def: 92, mag: 140, sellPrice: 380000, essence: 2000, signatureSkill: "petrify" },
];

// ─── Space-area animals (60+) — unlocks at 100% volcanic dex ──────────────────
const SPACE_ANIMALS: Animal[] = [
  // Common (14)
  { id: "star_pup",        name: "Star Pup",         emoji: "⭐🐶", rarity: "common", hp: 100, atk: 13, def: 10, mag: 8,  sellPrice: 55, essence: 2 },
  { id: "star_kitten",     name: "Star Kitten",      emoji: "⭐🐱", rarity: "common", hp: 90,  atk: 14, def: 8,  mag: 10, sellPrice: 55, essence: 2, signatureSkill: "flurry" },
  { id: "comet_mouse",     name: "Comet Mouse",      emoji: "☄️🐭", rarity: "common", hp: 65,  atk: 9,  def: 6,  mag: 7,  sellPrice: 50, essence: 2 },
  { id: "aster_bunny",     name: "Aster Bunny",      emoji: "🌠🐰", rarity: "common", hp: 85,  atk: 11, def: 9,  mag: 8,  sellPrice: 52, essence: 2 },
  { id: "nova_hamster",    name: "Nova Hamster",     emoji: "✨🐹", rarity: "common", hp: 70,  atk: 10, def: 7,  mag: 9,  sellPrice: 52, essence: 2 },
  { id: "galaxy_chick",    name: "Galaxy Chick",     emoji: "🌌🐤", rarity: "common", hp: 75,  atk: 10, def: 7,  mag: 9,  sellPrice: 52, essence: 2 },
  { id: "quark_sparrow",   name: "Quark Sparrow",    emoji: "✨🐦", rarity: "common", hp: 70,  atk: 12, def: 6,  mag: 10, sellPrice: 54, essence: 2 },
  { id: "cosmo_snail",     name: "Cosmo Snail",      emoji: "🌌🐌", rarity: "common", hp: 110, atk: 5,  def: 20, mag: 5,  sellPrice: 50, essence: 2, signatureSkill: "iron_wall" },
  { id: "lunar_toad",      name: "Lunar Toad",       emoji: "🌙🐸", rarity: "common", hp: 90,  atk: 10, def: 11, mag: 10, sellPrice: 55, essence: 2 },
  { id: "solar_beetle",    name: "Solar Beetle",     emoji: "☀️🪲", rarity: "common", hp: 80,  atk: 11, def: 13, mag: 7,  sellPrice: 54, essence: 2 },
  { id: "stardust_rat",    name: "Stardust Rat",     emoji: "✨🐀", rarity: "common", hp: 70,  atk: 11, def: 6,  mag: 9,  sellPrice: 52, essence: 2 },
  { id: "eclipse_newt",    name: "Eclipse Newt",     emoji: "🌑🦎", rarity: "common", hp: 80,  atk: 11, def: 9,  mag: 10, sellPrice: 54, essence: 2 },
  { id: "astral_hare",     name: "Astral Hare",      emoji: "🌌🐇", rarity: "common", hp: 80,  atk: 11, def: 9,  mag: 9,  sellPrice: 53, essence: 2 },
  { id: "photon_crab",     name: "Photon Crab",      emoji: "✨🦀", rarity: "common", hp: 80,  atk: 10, def: 18, mag: 6,  sellPrice: 54, essence: 2, signatureSkill: "iron_wall" },

  // Uncommon (12)
  { id: "pulsar_frog",     name: "Pulsar Frog",      emoji: "✨🐸", rarity: "uncommon", hp: 120, atk: 18, def: 13, mag: 14, sellPrice: 160, essence: 4, signatureSkill: "blessed_aura" },
  { id: "stellar_fox",     name: "Stellar Fox",      emoji: "⭐🦊", rarity: "uncommon", hp: 125, atk: 19, def: 12, mag: 16, sellPrice: 165, essence: 4, signatureSkill: "flurry" },
  { id: "lunar_panda",     name: "Lunar Panda",      emoji: "🌙🐼", rarity: "uncommon", hp: 140, atk: 16, def: 16, mag: 10, sellPrice: 160, essence: 4 },
  { id: "galactic_owl",    name: "Galactic Owl",     emoji: "🌌🦉", rarity: "uncommon", hp: 105, atk: 14, def: 12, mag: 22, sellPrice: 165, essence: 4, signatureSkill: "blessed_aura" },
  { id: "solar_deer",      name: "Solar Deer",       emoji: "☀️🦌", rarity: "uncommon", hp: 120, atk: 16, def: 12, mag: 14, sellPrice: 162, essence: 4 },
  { id: "nebular_llama",   name: "Nebular Llama",    emoji: "🌌🦙", rarity: "uncommon", hp: 125, atk: 14, def: 13, mag: 16, sellPrice: 162, essence: 4 },
  { id: "quark_hawk",      name: "Quark Hawk",       emoji: "✨🦅", rarity: "uncommon", hp: 110, atk: 20, def: 10, mag: 14, sellPrice: 168, essence: 4, signatureSkill: "piercing_strike" },
  { id: "voidling",        name: "Voidling",         emoji: "🕳️🦊", rarity: "uncommon", hp: 115, atk: 19, def: 12, mag: 18, sellPrice: 175, essence: 5, signatureSkill: "vampiric_bite" },
  { id: "asteroid_pig",    name: "Asteroid Pig",     emoji: "🌑🐷", rarity: "uncommon", hp: 130, atk: 16, def: 16, mag: 8,  sellPrice: 158, essence: 4 },
  { id: "cosmic_sheep",    name: "Cosmic Sheep",     emoji: "🌌🐑", rarity: "uncommon", hp: 130, atk: 12, def: 16, mag: 10, sellPrice: 158, essence: 4 },
  { id: "plasma_goat",     name: "Plasma Goat",      emoji: "✨🐐", rarity: "uncommon", hp: 120, atk: 17, def: 13, mag: 12, sellPrice: 165, essence: 4 },
  { id: "eclipse_raccoon", name: "Eclipse Raccoon",  emoji: "🌑🦝", rarity: "uncommon", hp: 110, atk: 17, def: 11, mag: 13, sellPrice: 162, essence: 4 },

  // Rare (12)
  { id: "comet_wolf",      name: "Comet Wolf",       emoji: "☄️🐺", rarity: "rare", hp: 175, atk: 28, def: 17, mag: 14, sellPrice: 460, essence: 8, signatureSkill: "vampiric_bite" },
  { id: "star_tiger",      name: "Star Tiger",       emoji: "⭐🐯", rarity: "rare", hp: 180, atk: 32, def: 18, mag: 12, sellPrice: 480, essence: 8, signatureSkill: "flurry" },
  { id: "astral_lion",     name: "Astral Lion",      emoji: "🌌🦁", rarity: "rare", hp: 195, atk: 32, def: 19, mag: 12, sellPrice: 490, essence: 8, signatureSkill: "fire_breath" },
  { id: "quasar_shark",    name: "Quasar Shark",     emoji: "✨🦈", rarity: "rare", hp: 165, atk: 36, def: 14, mag: 12, sellPrice: 500, essence: 8, signatureSkill: "vampiric_bite" },
  { id: "galactic_octopus",name: "Galactic Octopus", emoji: "🌌🐙", rarity: "rare", hp: 160, atk: 22, def: 16, mag: 26, sellPrice: 480, essence: 8, signatureSkill: "blessed_aura" },
  { id: "cosmic_cheetah",  name: "Cosmic Cheetah",   emoji: "🌌🐆", rarity: "rare", hp: 160, atk: 38, def: 13, mag: 14, sellPrice: 510, essence: 8, signatureSkill: "flurry" },
  { id: "solar_eagle",     name: "Solar Eagle",      emoji: "☀️🦅", rarity: "rare", hp: 155, atk: 36, def: 14, mag: 16, sellPrice: 510, essence: 8, signatureSkill: "piercing_strike" },
  { id: "blackhole_croc",  name: "Black-Hole Crocodile", emoji: "🕳️🐊", rarity: "rare", hp: 195, atk: 33, def: 22, mag: 12, sellPrice: 520, essence: 9, signatureSkill: "petrify" },
  { id: "galaxy_bear",     name: "Galaxy Bear",      emoji: "🌌🐻", rarity: "rare", hp: 210, atk: 32, def: 22, mag: 12, sellPrice: 520, essence: 8, signatureSkill: "iron_wall" },
  { id: "nebula_gorilla",  name: "Nebula Gorilla",   emoji: "🌌🦍", rarity: "rare", hp: 200, atk: 34, def: 20, mag: 12, sellPrice: 520, essence: 8 },
  { id: "aurora_rhino",    name: "Aurora Rhino",     emoji: "🌈🦏", rarity: "rare", hp: 210, atk: 30, def: 26, mag: 10, sellPrice: 525, essence: 8, signatureSkill: "iron_wall" },
  { id: "pulsar_bull",     name: "Pulsar Bull",      emoji: "✨🐂", rarity: "rare", hp: 195, atk: 33, def: 19, mag: 12, sellPrice: 510, essence: 8 },

  // Epic (10)
  { id: "cosmic_dragon",   name: "Cosmic Dragon",    emoji: "🌌🐉", rarity: "epic", hp: 290, atk: 44, def: 28, mag: 38, sellPrice: 1800, essence: 22, signatureSkill: "fire_breath" },
  { id: "stardust_pegasus",name: "Stardust Pegasus", emoji: "🌠🐴", rarity: "epic", hp: 250, atk: 38, def: 26, mag: 38, sellPrice: 1750, essence: 22, signatureSkill: "blessed_aura" },
  { id: "aurora_griffin",  name: "Aurora Griffin",   emoji: "🌈🦅", rarity: "epic", hp: 265, atk: 42, def: 26, mag: 34, sellPrice: 1780, essence: 22, signatureSkill: "piercing_strike" },
  { id: "quasar_sphinx",   name: "Quasar Sphinx",    emoji: "✨🦁", rarity: "epic", hp: 260, atk: 38, def: 28, mag: 40, sellPrice: 1800, essence: 22, signatureSkill: "petrify" },
  { id: "galaxy_manticore",name: "Galaxy Manticore", emoji: "🌌🦂", rarity: "epic", hp: 265, atk: 44, def: 26, mag: 28, sellPrice: 1780, essence: 22, signatureSkill: "cinder_burn" },
  { id: "solar_chimera",   name: "Solar Chimera",    emoji: "☀️🐲", rarity: "epic", hp: 285, atk: 42, def: 27, mag: 34, sellPrice: 1820, essence: 22, signatureSkill: "fire_breath" },
  { id: "plasma_centaur",  name: "Plasma Centaur",   emoji: "✨🏹", rarity: "epic", hp: 255, atk: 40, def: 25, mag: 32, sellPrice: 1740, essence: 22, signatureSkill: "piercing_strike" },
  { id: "astral_trex",     name: "Astral T-Rex",     emoji: "🌌🦖", rarity: "epic", hp: 305, atk: 52, def: 25, mag: 12, sellPrice: 1820, essence: 22, signatureSkill: "fire_breath" },
  { id: "nebula_werewolf", name: "Nebula Werewolf",  emoji: "🌌🐺", rarity: "epic", hp: 275, atk: 46, def: 24, mag: 24, sellPrice: 1800, essence: 22, signatureSkill: "vampiric_bite" },
  { id: "lunar_unicorn",   name: "Lunar Unicorn",    emoji: "🌙🦄", rarity: "epic", hp: 245, atk: 36, def: 24, mag: 42, sellPrice: 1820, essence: 22, signatureSkill: "blessed_aura" },

  // Mythic (8)
  { id: "stellar_phoenix", name: "Stellar Phoenix",  emoji: "⭐🦅", rarity: "mythic", hp: 380, atk: 58, def: 32, mag: 65, sellPrice: 7500, essence: 55, signatureSkill: "blessed_aura" },
  { id: "cosmic_hydra",    name: "Cosmic Hydra",     emoji: "🌌🐍", rarity: "mythic", hp: 420, atk: 60, def: 34, mag: 50, sellPrice: 7700, essence: 55, signatureSkill: "flurry" },
  { id: "void_kraken",     name: "Void Kraken",      emoji: "🕳️🦑", rarity: "mythic", hp: 440, atk: 62, def: 36, mag: 55, sellPrice: 7900, essence: 55, signatureSkill: "petrify" },
  { id: "galactic_behemoth",name: "Galactic Behemoth",emoji: "🌌🦣", rarity: "mythic", hp: 480, atk: 60, def: 46, mag: 36, sellPrice: 8000, essence: 55, signatureSkill: "iron_wall" },
  { id: "astral_yeti",     name: "Astral Yeti",      emoji: "🌌🧊", rarity: "mythic", hp: 410, atk: 58, def: 38, mag: 46, sellPrice: 7600, essence: 55, signatureSkill: "iron_wall" },
  { id: "quasar_cerberus", name: "Quasar Cerberus",  emoji: "✨🐕‍🦺", rarity: "mythic", hp: 400, atk: 64, def: 34, mag: 44, sellPrice: 7700, essence: 55, signatureSkill: "vampiric_bite" },
  { id: "cosmic_basilisk", name: "Cosmic Basilisk",  emoji: "🌌🐍", rarity: "mythic", hp: 390, atk: 60, def: 32, mag: 50, sellPrice: 7600, essence: 55, signatureSkill: "petrify" },
  { id: "solar_levia",     name: "Solar Leviathan",  emoji: "☀️🐉", rarity: "mythic", hp: 460, atk: 60, def: 40, mag: 56, sellPrice: 8000, essence: 55, signatureSkill: "fire_breath" },

  // Legendary (3)
  { id: "galactic_empress",name: "Galactic Empress", emoji: "🌌👑", rarity: "legendary", hp: 620, atk: 95, def: 60, mag: 95, sellPrice: 60000, essence: 280, signatureSkill: "blessed_aura" },
  { id: "solar_king",      name: "Solar King",       emoji: "☀️👑", rarity: "legendary", hp: 640, atk: 100, def: 62, mag: 88, sellPrice: 62000, essence: 280, signatureSkill: "fire_breath" },
  { id: "lunar_queen",     name: "Lunar Queen",      emoji: "🌙👸", rarity: "legendary", hp: 600, atk: 88, def: 64, mag: 100, sellPrice: 62000, essence: 280, signatureSkill: "petrify" },

  // Cosmic (2)
  { id: "astrarcus",       name: "Astrarcus",        emoji: "🌌🌠", rarity: "cosmic", hp: 1100, atk: 160, def: 110, mag: 170, sellPrice: 700000, essence: 3500, signatureSkill: "petrify" },
  { id: "heliarchon",      name: "Heliarchon",       emoji: "☀️🌠", rarity: "cosmic", hp: 1150, atk: 170, def: 115, mag: 160, sellPrice: 720000, essence: 3500, signatureSkill: "fire_breath" },

  // Void (1) — top of the universe
  { id: "voidlord",        name: "Voidlord",         emoji: "🕳️👑", rarity: "void", hp: 1500, atk: 220, def: 150, mag: 220, sellPrice: 2500000, essence: 12000, signatureSkill: "petrify" },
];

// ─── Aquatic (fish) pool ──────────────────────────────────────────────────────
const FISH_ANIMALS: Animal[] = [
  { id: "goldfish",   name: "Goldfish",   emoji: "🐟", rarity: "common",   hp: 40, atk: 4,  def: 3,  mag: 3,  sellPrice: 18,  essence: 1, huntable: false, aquatic: true },
  { id: "anglerfish", name: "Anglerfish", emoji: "🎣", rarity: "uncommon", hp: 80, atk: 14, def: 8,  mag: 12, sellPrice: 70,  essence: 2, huntable: false, aquatic: true, signatureSkill: "fire_breath" },
  { id: "stingray",   name: "Stingray",   emoji: "🐡", rarity: "uncommon", hp: 90, atk: 13, def: 10, mag: 10, sellPrice: 72,  essence: 2, huntable: false, aquatic: true, signatureSkill: "petrify" },
  { id: "manta",      name: "Manta Ray",  emoji: "🪼", rarity: "uncommon", hp: 100,atk: 11, def: 13, mag: 9,  sellPrice: 75,  essence: 2, huntable: false, aquatic: true },
  { id: "seahorse",   name: "Seahorse",   emoji: "🐎", rarity: "uncommon", hp: 70, atk: 10, def: 8,  mag: 14, sellPrice: 70,  essence: 2, huntable: false, aquatic: true, signatureSkill: "blessed_aura" },
  { id: "pufferfish", name: "Pufferfish", emoji: "🐡", rarity: "common",   hp: 65, atk: 8,  def: 14, mag: 5,  sellPrice: 22,  essence: 1, huntable: false, aquatic: true, signatureSkill: "iron_wall" },
  { id: "crab",       name: "Crab",       emoji: "🦀", rarity: "common",   hp: 70, atk: 9,  def: 16, mag: 4,  sellPrice: 24,  essence: 1, huntable: false, aquatic: true, signatureSkill: "iron_wall" },
  { id: "lobster",    name: "Lobster",    emoji: "🦞", rarity: "uncommon", hp: 85, atk: 14, def: 14, mag: 6,  sellPrice: 70,  essence: 2, huntable: false, aquatic: true },
  { id: "swordfish",  name: "Swordfish",  emoji: "⚔️🐟", rarity: "rare",   hp: 130,atk: 28, def: 11, mag: 9,  sellPrice: 220, essence: 5, huntable: false, aquatic: true, signatureSkill: "piercing_strike" },
  { id: "tuna",       name: "Tuna",       emoji: "🐟", rarity: "rare",     hp: 140,atk: 22, def: 13, mag: 8,  sellPrice: 200, essence: 5, huntable: false, aquatic: true },
  { id: "salmon",     name: "Salmon",     emoji: "🍣", rarity: "uncommon", hp: 90, atk: 13, def: 10, mag: 8,  sellPrice: 70,  essence: 2, huntable: false, aquatic: true },
  { id: "eel",        name: "Eel",        emoji: "🪱", rarity: "rare",     hp: 130,atk: 26, def: 11, mag: 14, sellPrice: 215, essence: 5, huntable: false, aquatic: true, signatureSkill: "vampiric_bite" },
  { id: "narwhal",    name: "Narwhal",    emoji: "🦄🌊", rarity: "epic",   hp: 220,atk: 36, def: 22, mag: 28, sellPrice: 820, essence: 12, huntable: false, aquatic: true, signatureSkill: "piercing_strike" },
  { id: "beluga",     name: "Beluga",     emoji: "🐋", rarity: "epic",     hp: 240,atk: 32, def: 26, mag: 26, sellPrice: 820, essence: 12, huntable: false, aquatic: true, signatureSkill: "blessed_aura" },
  { id: "orca",       name: "Orca",       emoji: "🐋", rarity: "epic",     hp: 250,atk: 40, def: 24, mag: 24, sellPrice: 850, essence: 12, huntable: false, aquatic: true, signatureSkill: "fire_breath" },
  { id: "dolphin",    name: "Dolphin",    emoji: "🐬", rarity: "rare",     hp: 145,atk: 24, def: 14, mag: 18, sellPrice: 220, essence: 5, huntable: false, aquatic: true },
  { id: "bluewhale",  name: "Blue Whale", emoji: "🐳", rarity: "mythic",   hp: 480,atk: 50, def: 42, mag: 38, sellPrice: 3800, essence: 30, huntable: false, aquatic: true, signatureSkill: "iron_wall" },
  { id: "squid",      name: "Squid",      emoji: "🦑", rarity: "rare",     hp: 130,atk: 20, def: 12, mag: 22, sellPrice: 210, essence: 5, huntable: false, aquatic: true },
  { id: "coelacanth", name: "Coelacanth", emoji: "🐠", rarity: "epic",     hp: 200,atk: 30, def: 22, mag: 30, sellPrice: 800, essence: 12, huntable: false, aquatic: true, signatureSkill: "petrify" },
  { id: "jellyfish",  name: "Jellyfish",  emoji: "🪼", rarity: "rare",     hp: 110,atk: 18, def: 10, mag: 26, sellPrice: 200, essence: 5, huntable: false, aquatic: true, signatureSkill: "petrify" },
  { id: "megalodon",  name: "Megalodon",  emoji: "🦈🌊", rarity: "legendary", hp: 600, atk: 90, def: 50, mag: 60, sellPrice: 28000, essence: 160, huntable: false, aquatic: true, signatureSkill: "vampiric_bite" },
];

// ─── Glitched (event-only) + Pepsodent (secret, any-area) ─────────────────────
const SPECIAL_ANIMALS: Animal[] = [
  // Glitched — fixed price (was suspiciously low for its rarity)
  { id: "glitchfox",  name: "Glitch Fox", emoji: "🟥🦊", rarity: "glitched", hp: 666, atk: 99, def: 99, mag: 99, sellPrice: 750000, essence: 4500, eventOnly: true, huntable: false, signatureSkill: "flurry" },
  // Pepsodent — secret rarity, 0.000045% chance in ANY area, can't be sold cheap
  { id: "pepsodent",  name: "Pepsodent", emoji: "🦷✨", rarity: "secret", hp: 999, atk: 222, def: 222, mag: 222, sellPrice: 5000000, essence: 25000, area: "any", signatureSkill: "blessed_aura" },
];

// Mark area on every animal (default fallback for legacy entries)
function tagArea(arr: Animal[], area: HuntArea): Animal[] {
  return arr.map((a) => ({ ...a, area: a.area ?? area }));
}

export const ANIMALS: Animal[] = [
  ...tagArea(DEFAULT_ANIMALS, "default"),
  ...tagArea(VOLCANIC_ANIMALS, "volcanic"),
  ...tagArea(SPACE_ANIMALS, "space"),
  ...FISH_ANIMALS,
  ...SPECIAL_ANIMALS,
];

export const ANIMAL_BY_ID: Record<string, Animal> = Object.fromEntries(ANIMALS.map((a) => [a.id, a]));

// Pools
export const HUNT_POOL = ANIMALS.filter((a) => a.huntable !== false && !a.aquatic && !a.eventOnly && a.area === "default");
export const VOLCANIC_HUNT_POOL = ANIMALS.filter((a) => a.huntable !== false && !a.aquatic && !a.eventOnly && a.area === "volcanic");
export const SPACE_HUNT_POOL = ANIMALS.filter((a) => a.huntable !== false && !a.aquatic && !a.eventOnly && a.area === "space");
export const FISH_POOL = ANIMALS.filter((a) => a.aquatic === true);

export function poolForArea(area: HuntArea): Animal[] {
  if (area === "volcanic") return VOLCANIC_HUNT_POOL;
  if (area === "space")    return SPACE_HUNT_POOL;
  return HUNT_POOL;
}

// ─── Hunt Areas (display + unlock metadata) ───────────────────────────────────
export interface AreaDef {
  id: HuntArea;
  name: string;
  emoji: string;
  description: string;
  unlock: (dexCount: { default: number; volcanic: number; space: number }, totals: { default: number; volcanic: number; space: number }) => boolean;
  unlockHint: string;
}
export const AREA_DEFS: AreaDef[] = [
  {
    id: "default", name: "Forest", emoji: "🌲",
    description: "The default hunting grounds. All your old favorites live here.",
    unlock: () => true,
    unlockHint: "Always available.",
  },
  {
    id: "volcanic", name: "Volcanic", emoji: "🌋",
    description: "Magma rivers and brimstone — fiery beasts and the new INFERNO rarity.",
    unlock: (d, t) => d.default >= t.default,
    unlockHint: "Complete 100% of the default-area dex.",
  },
  {
    id: "space", name: "Space", emoji: "🌌",
    description: "Beyond the stratosphere — cosmic creatures and the COSMIC / VOID rarities.",
    unlock: (d, t) => d.volcanic >= t.volcanic,
    unlockHint: "Complete 100% of the volcanic-area dex.",
  },
];
export const AREA_BY_ID: Record<HuntArea, AreaDef> = Object.fromEntries(AREA_DEFS.map((a) => [a.id, a])) as Record<HuntArea, AreaDef>;

// Per-area dex totals (used for unlock checks)
export const AREA_DEX_TOTALS = {
  default:  HUNT_POOL.length,
  volcanic: VOLCANIC_HUNT_POOL.length,
  space:    SPACE_HUNT_POOL.length,
};

// ─── Roll helpers ─────────────────────────────────────────────────────────────
function pickRarityFromPool(pool: Animal[], luck: number): Rarity {
  const present = new Set<Rarity>(pool.map((a) => a.rarity));
  // Apply luck multiplier to all rarities above "rare"
  const rareTiers = new Set<Rarity>(["rare", "epic", "mythic", "legendary", "ethereal", "divine", "omni", "inferno", "cosmic", "void"]);
  const weights: Array<[Rarity, number]> = [];
  for (const r of Object.keys(RARITY_WEIGHTS) as Rarity[]) {
    if (!present.has(r)) continue;
    if (RARITY_WEIGHTS[r] === 0) continue;
    const w = rareTiers.has(r) ? RARITY_WEIGHTS[r] * luck : RARITY_WEIGHTS[r];
    weights.push([r, w]);
  }
  const total = weights.reduce((s, [, w]) => s + w, 0);
  let roll = Math.random() * total;
  for (const [r, w] of weights) { if (roll < w) return r; roll -= w; }
  return weights[0][0];
}

// 0.000045% per roll
export const SECRET_PEPSODENT_CHANCE = 4.5e-7;

export function rollAnimalInArea(area: HuntArea, luck = 1): Animal {
  // Secret animal can drop in any area before regular roll
  if (Math.random() < SECRET_PEPSODENT_CHANCE * luck) {
    const peps = ANIMAL_BY_ID["pepsodent"];
    if (peps) return peps;
  }
  const pool = poolForArea(area);
  for (let attempt = 0; attempt < 8; attempt++) {
    const r = pickRarityFromPool(pool, luck);
    const sub = pool.filter((a) => a.rarity === r);
    if (sub.length) return sub[Math.floor(Math.random() * sub.length)];
  }
  return pool[0];
}

// Backward-compat (default area). Kept so legacy callers stay working.
export function rollAnimal(luck = 1): Animal {
  return rollAnimalInArea("default", luck);
}

export function rollFish(luck = 1): Animal {
  // Secret bypass works for fishing too — fairness across activities.
  if (Math.random() < SECRET_PEPSODENT_CHANCE * luck) {
    const peps = ANIMAL_BY_ID["pepsodent"];
    if (peps) return peps;
  }
  for (let attempt = 0; attempt < 8; attempt++) {
    const r = pickRarityFromPool(FISH_POOL, luck);
    const pool = FISH_POOL.filter((a) => a.rarity === r);
    if (pool.length) return pool[Math.floor(Math.random() * pool.length)];
  }
  return FISH_POOL[0];
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
  bronze: { name: "Bronze Crate", emoji: "🟫", price: 3500,  rolls: 1, floor: "common" },
  silver: { name: "Silver Crate", emoji: "⬜", price: 12000, rolls: 2, floor: "uncommon" },
  gold:   { name: "Gold Crate",   emoji: "🟨", price: 35000, rolls: 3, floor: "rare" },
};

export function rollWeaponFromBox(tier: BoxTier): ReturnType<typeof rollWeapon> {
  const floors: Record<WeaponRarity, number> = { common: 0, uncommon: 1, rare: 2, epic: 3, mythic: 4 };
  const floorN = floors[BOX_DEFS[tier].floor];
  for (let i = 0; i < 8; i++) {
    const w = rollWeapon();
    if (floors[w.rarity] >= floorN) return w;
  }
  return rollWeapon();
}

// ─── Profile Backgrounds (now with patterns) ─────────────────────────────────
export type BgPattern = "none" | "stars" | "hex" | "waves" | "flames" | "sakura" | "dots" | "circuit" | "aurora";
export interface Background { id: string; name: string; price: number; gradient: [string, string]; accent: string; pattern: BgPattern }
export const BACKGROUNDS: Background[] = [
  { id: "bg_dark",     name: "Midnight",   price: 0,      gradient: ["#0f1117", "#1a1d26"], accent: "#5865f2", pattern: "none" },
  { id: "bg_sakura",   name: "Sakura",     price: 8000,   gradient: ["#3a1c2e", "#7a3a52"], accent: "#ff7eb6", pattern: "sakura" },
  { id: "bg_ocean",    name: "Ocean",      price: 8000,   gradient: ["#0a1f3a", "#1f4d7a"], accent: "#4dd0e1", pattern: "waves" },
  { id: "bg_forest",   name: "Forest",     price: 8000,   gradient: ["#10261a", "#2a5c3d"], accent: "#7ed957", pattern: "dots" },
  { id: "bg_royal",    name: "Royal",      price: 25000,  gradient: ["#1a0f3a", "#5c2eb3"], accent: "#ffd700", pattern: "hex" },
  { id: "bg_lava",     name: "Lava",       price: 25000,  gradient: ["#2a0808", "#8a1f1f"], accent: "#ff7043", pattern: "flames" },
  { id: "bg_cosmos",   name: "Cosmos",     price: 80000,  gradient: ["#070a1a", "#2a0f4d"], accent: "#9d65ff", pattern: "stars" },
  { id: "bg_aurora",   name: "Aurora",     price: 80000,  gradient: ["#08221d", "#0f4d52"], accent: "#7df0c8", pattern: "aurora" },
  { id: "bg_circuit",  name: "Circuit",    price: 60000,  gradient: ["#0a1a14", "#143b2e"], accent: "#41ff9f", pattern: "circuit" },
  { id: "bg_inferno",  name: "Inferno",    price: 0,      gradient: ["#1a0303", "#a82200"], accent: "#ffb000", pattern: "flames" },
];
export const BACKGROUND_BY_ID: Record<string, Background> = Object.fromEntries(BACKGROUNDS.map((b) => [b.id, b]));

// ─── Animal Skill Tree (per-animal XP perks) ──────────────────────────────────
export const ANIMAL_LEVEL_CAP = 10;
export function animalLevelFromXp(xp: number): number {
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
  { id: "double_hunt",    name: "Double Hunt",     emoji: "🎯", description: "Hunt drops 2 animals at once",      durationMs: 60 * 60 * 1000 },
  { id: "rare_rush",      name: "Rare Rush",       emoji: "💎", description: "Rare+ drop chance ×3 on hunt",      durationMs: 60 * 60 * 1000 },
  { id: "essence_storm",  name: "Essence Storm",   emoji: "✨", description: "Sacrifices yield ×2 essence",       durationMs: 90 * 60 * 1000 },
  { id: "battle_frenzy",  name: "Battle Frenzy",   emoji: "⚔️", description: "Battle rewards ×2 cowoncy",         durationMs: 60 * 60 * 1000 },
  { id: "cowoncy_event",  name: "Cowoncy Event",   emoji: "💰", description: "All cowoncy gains ×2 (server-wide, scroll-triggered)", durationMs: 30 * 60 * 1000 },
  { id: "mineral_rush",   name: "Mineral Rush",    emoji: "⛏️", description: "Mining drops 2 minerals at once",   durationMs: 60 * 60 * 1000 },
  { id: "lucky_skies",    name: "Lucky Skies",     emoji: "🍀", description: "All hunt/fish/mine luck ×1.5",      durationMs: 45 * 60 * 1000 },
  { id: "blood_moon",     name: "Blood Moon",      emoji: "🩸", description: "Battle damage ×1.5 across the board", durationMs: 60 * 60 * 1000 },
  { id: "boss_invasion",  name: "Boss Invasion",   emoji: "👹", description: "World bosses spawn 4× more often",  durationMs: 90 * 60 * 1000 },
  { id: "crafting_surge", name: "Crafting Surge",  emoji: "🛠️", description: "Crafting yields +1 weapon roll",     durationMs: 60 * 60 * 1000 },
  { id: "skill_storm",    name: "Skill Storm",     emoji: "🌟", description: "Pet active-skill cooldowns halved", durationMs: 60 * 60 * 1000 },
  { id: "void_breach",    name: "Void Breach",     emoji: "🕳️", description: "Cosmic & void rarities ×4 weight",   durationMs: 30 * 60 * 1000 },
  { id: "secret_whisper", name: "Secret Whisper",  emoji: "🤫", description: "Secret-rarity (Pepsodent) chance ×100", durationMs: 15 * 60 * 1000 },
  { id: "shop_sale",      name: "Shop Sale",       emoji: "🏷️", description: "All shop prices −20% server-wide",   durationMs: 60 * 60 * 1000 },
  { id: "xp_bonanza",     name: "XP Bonanza",      emoji: "📈", description: "Animal XP gains ×2 from hunts/battles", durationMs: 60 * 60 * 1000 },
];
export const EVENT_BY_ID: Record<string, LowoEvent> = Object.fromEntries(EVENTS.map((e) => [e.id, e]));

// ─── Pity System ──────────────────────────────────────────────────────────────
export const PITY_THRESHOLD = 200;

// ─── Pet Armor / Charms ───────────────────────────────────────────────────────
export interface ArmorDef { id: string; name: string; emoji: string; price: number; lowoCashPrice?: number; mods: { hp: number; def: number; mag: number }; description: string }
export const ARMOR_DEFS: ArmorDef[] = [
  { id: "leather_vest",   name: "Leather Vest",    emoji: "🦺", price: 4500,  mods: { hp: 25, def: 5, mag: 0 },  description: "Basic armor — small HP/DEF." },
  { id: "chain_mail",     name: "Chain Mail",      emoji: "⛓️", price: 12000, mods: { hp: 60, def: 12, mag: 0 }, description: "Sturdy chain — moderate HP/DEF." },
  { id: "plate_armor",    name: "Plate Armor",     emoji: "🛡️", price: 32000, mods: { hp: 120, def: 25, mag: 0 }, description: "Heavy plate — big HP/DEF boost." },
  { id: "mage_robe",      name: "Mage Robe",       emoji: "🧙", price: 14000, mods: { hp: 30, def: 5, mag: 18 }, description: "Channels arcane energy — boosts MAG." },
  { id: "lucky_charm",    name: "Lucky Charm",     emoji: "🍀", price: 18000, mods: { hp: 20, def: 4, mag: 6 },  description: "Charm — small all-round boost." },
  { id: "dragon_scale",   name: "Dragon Scale",    emoji: "🐲", price: 0, lowoCashPrice: 5, mods: { hp: 200, def: 40, mag: 20 }, description: "Premium scale — massive HP/DEF/MAG." },
  { id: "void_armor",     name: "Void Armor",      emoji: "🕳️", price: 0, lowoCashPrice: 12, mods: { hp: 350, def: 70, mag: 50 }, description: "Forged in the void — endgame protection." },
];
export const ARMOR_BY_ID: Record<string, ArmorDef> = Object.fromEntries(ARMOR_DEFS.map((a) => [a.id, a]));

// ─── Pet Accessories (NEW 3rd equip slot) ────────────────────────────────────
export interface AccessoryDef { id: string; name: string; emoji: string; price: number; lowoCashPrice?: number; mods: { hp: number; atk: number; def: number; mag: number; crit?: number }; description: string }
export const ACCESSORY_DEFS: AccessoryDef[] = [
  { id: "leather_collar", name: "Leather Collar", emoji: "🦮", price: 6000,   mods: { hp: 15, atk: 3, def: 3, mag: 0 },                description: "Basic pet collar — small all-round boost." },
  { id: "tinkling_bell",  name: "Tinkling Bell",  emoji: "🔔", price: 9000,   mods: { hp: 10, atk: 5, def: 2, mag: 5 },                description: "Pings to confuse foes — +ATK/MAG." },
  { id: "feathered_hat",  name: "Feathered Hat",  emoji: "🎩", price: 12000,  mods: { hp: 20, atk: 4, def: 4, mag: 6 },                description: "Stylish — buffs MAG and presence." },
  { id: "shades",         name: "Pet Shades",     emoji: "🕶️", price: 14000,  mods: { hp: 0,  atk: 8, def: 0, mag: 0, crit: 0.05 },     description: "+CRIT chance & ATK." },
  { id: "silk_scarf",     name: "Silk Scarf",     emoji: "🧣", price: 16000,  mods: { hp: 30, atk: 0, def: 6, mag: 6 },                description: "Wraps the pet in style — HP/DEF/MAG." },
  { id: "ribbon_bow",     name: "Ribbon Bow",     emoji: "🎀", price: 18000,  mods: { hp: 25, atk: 5, def: 5, mag: 5 },                description: "Cute & balanced — all stats up." },
  { id: "amulet",         name: "Mystic Amulet",  emoji: "🧿", price: 22000,  mods: { hp: 30, atk: 0, def: 8, mag: 14 },               description: "Wards off ill — MAG-leaning." },
  { id: "pet_halo",       name: "Pet Halo",       emoji: "😇", price: 28000,  mods: { hp: 40, atk: 4, def: 8, mag: 12 },               description: "Saintly — stronger MAG/DEF/HP." },
  { id: "pet_crown",      name: "Pet Crown",      emoji: "👑", price: 38000,  mods: { hp: 50, atk: 10, def: 10, mag: 10 },             description: "Royal — solid boosts to every stat." },
  { id: "wing_pack",      name: "Wing Pack",      emoji: "🪽", price: 45000,  mods: { hp: 30, atk: 12, def: 6, mag: 10, crit: 0.05 },   description: "Flight unlocks high-impact strikes." },
  { id: "pet_cape",       name: "Pet Cape",       emoji: "🦸", price: 52000,  mods: { hp: 60, atk: 8, def: 14, mag: 8 },               description: "Heroic — durable & balanced." },
  { id: "war_badge",      name: "War Badge",      emoji: "🎖️", price: 60000,  mods: { hp: 35, atk: 16, def: 6, mag: 6, crit: 0.06 },    description: "+ATK/CRIT — for offensive teams." },
  { id: "jet_pack",       name: "Jet Pack",       emoji: "🚀", price: 75000,  mods: { hp: 30, atk: 18, def: 4, mag: 12, crit: 0.04 },   description: "Pets can sprint and dive-bomb." },
  { id: "neural_chip",    name: "Neural Chip",    emoji: "🧠", price: 90000,  mods: { hp: 30, atk: 6, def: 6, mag: 28 },               description: "Boosts MAG drastically — caster's pick." },
  { id: "time_piece",     name: "Time Piece",     emoji: "⌛", price: 110000, mods: { hp: 40, atk: 10, def: 10, mag: 18, crit: 0.05 },   description: "Bends time — boosts everything." },
  { id: "lantern",        name: "Spirit Lantern", emoji: "🏮", price: 130000, mods: { hp: 60, atk: 6, def: 12, mag: 22 },              description: "Sustaining magical glow." },
  { id: "void_sigil",     name: "Void Sigil",     emoji: "🕳️", price: 0, lowoCashPrice: 8, mods: { hp: 80, atk: 18, def: 18, mag: 24, crit: 0.08 }, description: "Premium endgame accessory." },
  { id: "cosmic_amulet",  name: "Cosmic Amulet",  emoji: "🌌", price: 0, lowoCashPrice: 6, mods: { hp: 60, atk: 12, def: 12, mag: 30, crit: 0.05 }, description: "Premium magic-focused amulet." },
];
export const ACCESSORY_BY_ID: Record<string, AccessoryDef> = Object.fromEntries(ACCESSORY_DEFS.map((a) => [a.id, a]));

// ─── Active Pet Skills (slot-based, used in skill battle) ────────────────────
export type ActiveSkillKind = "damage" | "true_damage" | "aoe" | "heal" | "lifesteal" | "stun" | "shield";
export interface ActiveSkill {
  id: string; name: string; emoji: string; description: string;
  kind: ActiveSkillKind;
  power: number;             // base power (multiplier of attacker stat for damage; fraction of maxHp for heal)
  cooldown: number;          // turns; 0 = no cooldown
  cost: number;              // cowoncy cost to LEARN (one-time)
  rarity: "common" | "rare" | "epic" | "mythic" | "legendary";
}
export const ACTIVE_SKILLS: Record<string, ActiveSkill> = {
  basic_strike:      { id: "basic_strike",      name: "Basic Strike",        emoji: "👊", description: "Reliable hit. 1.0× ATK damage.",                          kind: "damage",      power: 1.00, cooldown: 0, cost: 0,      rarity: "common" },
  heavy_swing:       { id: "heavy_swing",       name: "Heavy Swing",         emoji: "🔨", description: "Big windup. 1.6× ATK damage. 1-turn cooldown.",            kind: "damage",      power: 1.60, cooldown: 1, cost: 1500,   rarity: "common" },
  triple_jab:        { id: "triple_jab",        name: "Triple Jab",          emoji: "🥊", description: "Three hits at 0.55× ATK each.",                            kind: "damage",      power: 1.65, cooldown: 1, cost: 2500,   rarity: "common" },
  arcane_bolt:       { id: "arcane_bolt",       name: "Arcane Bolt",         emoji: "🔮", description: "1.4× MAG damage that ignores half of DEF.",                kind: "damage",      power: 1.40, cooldown: 0, cost: 3000,   rarity: "rare" },
  shadow_pierce:     { id: "shadow_pierce",     name: "Shadow Pierce",       emoji: "🗡️", description: "Pure 1.2× ATK true damage (ignores DEF).",                 kind: "true_damage", power: 1.20, cooldown: 1, cost: 5000,   rarity: "rare" },
  vampire_strike:    { id: "vampire_strike",    name: "Vampire Strike",      emoji: "🧛", description: "1.1× ATK damage, heals attacker for 50% of damage dealt.", kind: "lifesteal",   power: 1.10, cooldown: 1, cost: 6000,   rarity: "rare" },
  mend_team:         { id: "mend_team",         name: "Mend",                emoji: "💚", description: "Heals all your remaining pets for 25% of their max HP.",   kind: "heal",        power: 0.25, cooldown: 2, cost: 7500,   rarity: "rare" },
  iron_brace:        { id: "iron_brace",        name: "Iron Brace",          emoji: "🛡️", description: "Halves incoming damage on this pet for 1 turn.",           kind: "shield",      power: 0.50, cooldown: 2, cost: 5000,   rarity: "rare" },
  terror_glare:      { id: "terror_glare",      name: "Terror Glare",        emoji: "👁️", description: "Stuns target for 1 turn (skip their next attack).",        kind: "stun",        power: 1.00, cooldown: 3, cost: 10000,  rarity: "epic" },
  gamma_burst:       { id: "gamma_burst",       name: "Gamma Burst",         emoji: "💥", description: "Hits ALL enemy pets for 0.9× ATK each.",                   kind: "aoe",         power: 0.90, cooldown: 2, cost: 14000,  rarity: "epic" },
  divine_killer:     { id: "divine_killer",     name: "Divine Killer Burst", emoji: "🌟", description: "2.0× ATK true damage to one target. 2-turn cooldown.",     kind: "true_damage", power: 2.00, cooldown: 2, cost: 25000,  rarity: "epic" },
  celestial_banish:  { id: "celestial_banish",  name: "Celestial Banisher",  emoji: "✨", description: "1.6× MAG damage AOE to all enemy pets.",                   kind: "aoe",         power: 1.60, cooldown: 3, cost: 35000,  rarity: "mythic" },
  void_lance:        { id: "void_lance",        name: "Void Lance",          emoji: "🕳️", description: "2.5× ATK true damage to one target. 3-turn cooldown.",     kind: "true_damage", power: 2.50, cooldown: 3, cost: 45000,  rarity: "mythic" },
  inferno_wave:      { id: "inferno_wave",      name: "Inferno Wave",        emoji: "🔥", description: "1.5× ATK + 5% of target maxHp burn damage.",               kind: "damage",      power: 1.50, cooldown: 1, cost: 12000,  rarity: "epic" },
  arcues_judgment:   { id: "arcues_judgment",   name: "Arcues' Judgment",    emoji: "🌠", description: "3.0× ATK damage. 4-turn cooldown. Endgame nuke.",          kind: "damage",      power: 3.00, cooldown: 4, cost: 80000,  rarity: "legendary" },
};
export const ACTIVE_SKILL_LIST: ActiveSkill[] = Object.values(ACTIVE_SKILLS);
export const PET_SKILL_SLOTS = 5;

// ─── Mining (mineral catalog) ────────────────────────────────────────────────
export interface Mineral {
  id: string; name: string; emoji: string;
  rarity: "common" | "uncommon" | "rare" | "epic" | "mythic" | "legendary" | "cosmic";
  weight: number;
  sellPrice: number;
}
export const MINERALS: Mineral[] = [
  { id: "stone",      name: "Stone Pebble",   emoji: "🪨",  rarity: "common",    weight: 60,  sellPrice: 30 },
  { id: "iron",       name: "Iron Ore",       emoji: "⛓️",  rarity: "common",    weight: 40,  sellPrice: 60 },
  { id: "copper",     name: "Copper Chunk",   emoji: "🟠",  rarity: "common",    weight: 30,  sellPrice: 80 },
  { id: "silver",     name: "Silver Vein",    emoji: "⚪",  rarity: "uncommon",  weight: 18,  sellPrice: 220 },
  { id: "crystal",    name: "Crystal Shard",  emoji: "💠",  rarity: "uncommon",  weight: 14,  sellPrice: 280 },
  { id: "obsidian",   name: "Obsidian Shard", emoji: "🖤",  rarity: "uncommon",  weight: 12,  sellPrice: 320 },
  { id: "gold",       name: "Gold Nugget",    emoji: "🟡",  rarity: "rare",      weight: 8,   sellPrice: 800 },
  { id: "sapphire",   name: "Sapphire",       emoji: "🔷",  rarity: "rare",      weight: 6,   sellPrice: 1200 },
  { id: "ruby",       name: "Ruby",           emoji: "🔴",  rarity: "rare",      weight: 5,   sellPrice: 1400 },
  { id: "diamond",    name: "Diamond",        emoji: "💎",  rarity: "epic",      weight: 2,   sellPrice: 4500 },
  { id: "emerald",    name: "Emerald",        emoji: "🟢",  rarity: "epic",      weight: 2,   sellPrice: 4200 },
  { id: "mithril",    name: "Mithril",        emoji: "🤍",  rarity: "mythic",    weight: 0.7, sellPrice: 18000 },
  { id: "adamantine", name: "Adamantine",     emoji: "⚙️",  rarity: "legendary", weight: 0.15,sellPrice: 90000 },
  { id: "stardust",   name: "Stardust Crystal",emoji: "🌌",  rarity: "cosmic",    weight: 0.04,sellPrice: 350000 },
];
export const MINERAL_BY_ID: Record<string, Mineral> = Object.fromEntries(MINERALS.map((m) => [m.id, m]));

export function rollMineral(luck = 1): Mineral {
  const rareTiers = new Set(["rare", "epic", "mythic", "legendary", "cosmic"]);
  const totals = MINERALS.reduce((s, m) => s + (rareTiers.has(m.rarity) ? m.weight * luck : m.weight), 0);
  let r = Math.random() * totals;
  for (const m of MINERALS) {
    const w = rareTiers.has(m.rarity) ? m.weight * luck : m.weight;
    if (r < w) return m;
    r -= w;
  }
  return MINERALS[0];
}

// ─── Crafting Recipes (mineral → weapon) ─────────────────────────────────────
export interface CraftRecipe {
  id: string;
  name: string;
  emoji: string;
  rarity: WeaponRarity;
  cost: Record<string, number>;     // mineralId -> count
  cowoncyCost: number;
  modsBase: { atk: number; def: number; mag: number };
}
export const CRAFT_RECIPES: CraftRecipe[] = [
  { id: "iron_blade",   name: "Iron Blade",    emoji: "🗡️",   rarity: "common",   cost: { iron: 5, stone: 3 },                       cowoncyCost: 1500,  modsBase: { atk: 8,  def: 3,  mag: 0  } },
  { id: "copper_bow",   name: "Copper Bow",    emoji: "🏹",   rarity: "common",   cost: { copper: 5, stone: 3 },                     cowoncyCost: 1500,  modsBase: { atk: 7,  def: 2,  mag: 4  } },
  { id: "silver_dagger",name: "Silver Dagger", emoji: "🔪",   rarity: "uncommon", cost: { silver: 4, iron: 4 },                      cowoncyCost: 4000,  modsBase: { atk: 14, def: 4,  mag: 4  } },
  { id: "crystal_wand", name: "Crystal Wand",  emoji: "🪄",   rarity: "uncommon", cost: { crystal: 5, silver: 2 },                   cowoncyCost: 4500,  modsBase: { atk: 8,  def: 4,  mag: 18 } },
  { id: "obsidian_axe", name: "Obsidian Axe",  emoji: "🪓",   rarity: "uncommon", cost: { obsidian: 6, iron: 3 },                    cowoncyCost: 5000,  modsBase: { atk: 18, def: 6,  mag: 0  } },
  { id: "gold_sword",   name: "Gold Sword",    emoji: "⚔️",   rarity: "rare",     cost: { gold: 4, silver: 4, iron: 6 },             cowoncyCost: 12000, modsBase: { atk: 28, def: 12, mag: 8  } },
  { id: "ruby_lance",   name: "Ruby Lance",    emoji: "🔱",   rarity: "rare",     cost: { ruby: 3, gold: 2, iron: 8 },               cowoncyCost: 14000, modsBase: { atk: 32, def: 10, mag: 12 } },
  { id: "sapphire_staff",name: "Sapphire Staff",emoji: "🔮",  rarity: "rare",     cost: { sapphire: 3, crystal: 4, silver: 4 },      cowoncyCost: 14000, modsBase: { atk: 16, def: 10, mag: 32 } },
  { id: "diamond_blade",name: "Diamond Blade", emoji: "💎🗡️", rarity: "epic",     cost: { diamond: 3, gold: 4, mithril: 1 },         cowoncyCost: 40000, modsBase: { atk: 55, def: 22, mag: 18 } },
  { id: "emerald_bow",  name: "Emerald Bow",   emoji: "💚🏹", rarity: "epic",     cost: { emerald: 3, sapphire: 2, mithril: 1 },     cowoncyCost: 40000, modsBase: { atk: 50, def: 16, mag: 32 } },
  { id: "mithril_axe",  name: "Mithril Axe",   emoji: "🪓✨", rarity: "epic",     cost: { mithril: 2, gold: 6, obsidian: 4 },        cowoncyCost: 45000, modsBase: { atk: 60, def: 24, mag: 14 } },
  { id: "adamant_blade",name: "Adamantine Blade",emoji: "⚙️🗡️",rarity: "mythic",   cost: { adamantine: 1, mithril: 3, diamond: 2 },  cowoncyCost: 120000,modsBase: { atk: 90, def: 50, mag: 40 } },
  { id: "stardust_relic",name:"Stardust Relic",emoji: "🌌✨", rarity: "mythic",   cost: { stardust: 1, adamantine: 1, mithril: 4 },  cowoncyCost: 250000,modsBase: { atk: 110, def: 70, mag: 80 } },
];
export const CRAFT_RECIPE_BY_ID: Record<string, CraftRecipe> = Object.fromEntries(CRAFT_RECIPES.map((r) => [r.id, r]));

// ─── Shop items (now categorized) ─────────────────────────────────────────────
export type ShopCategory = "items" | "potions" | "events" | "equips" | "premium" | "pets" | "mining" | "skills";
export interface ShopItem {
  id: string; name: string; emoji: string;
  price: number;                 // cowoncy price (0 if premium-only)
  lowoCashPrice?: number;        // optional premium price
  category: ShopCategory;
  description: string;
}
export const SHOP_ITEMS: ShopItem[] = [
  // items
  { id: "ring",     name: "Wedding Ring",     emoji: "💍", price: 12000,  category: "items", description: "Required to use `lowo propose`" },
  { id: "crate",    name: "Weapon Crate",     emoji: "📦", price: 6000,   category: "items", description: "Stored — open with `lowo crate`" },
  { id: "bronze",   name: "Bronze Crate",     emoji: "🟫", price: 3500,   category: "items", description: "1 weapon roll — `lowo box bronze`" },
  { id: "silver",   name: "Silver Crate",     emoji: "⬜", price: 12000,  category: "items", description: "2 weapon rolls (uncommon+ floor)" },
  { id: "gold",     name: "Gold Crate",       emoji: "🟨", price: 35000,  category: "items", description: "3 weapon rolls (rare+ floor)" },
  { id: "carrot",   name: "Magic Carrot",     emoji: "🥕", price: 800,    category: "items", description: "Boosts your next piku harvest" },
  { id: "lottery",  name: "Lottery Ticket",   emoji: "🎟️", price: 1500,   category: "items", description: "Daily lottery — winner takes the pot" },
  { id: "petfood",  name: "Pet Food",         emoji: "🍖", price: 400,    category: "items", description: "Feed your Lowo Pet" },
  { id: "rod",      name: "Fishing Rod",      emoji: "🎣", price: 9000,   category: "items", description: "Required for `lowo fish`" },
  { id: "pickaxe",  name: "Pickaxe",          emoji: "⛏️", price: 12000,  category: "items", description: "Required for `lowo mine`" },
  // backgrounds (items)
  ...BACKGROUNDS.filter((b) => b.price > 0).map<ShopItem>((b) => ({
    id: b.id, name: `BG: ${b.name}`, emoji: "🖼️", price: b.price, category: "items",
    description: `Profile background — set with \`lowo setbg ${b.id}\``,
  })),
  // potions
  { id: "luck_potion",  name: "Luck Potion",     emoji: "🧪", price: 12000,  category: "potions", description: "+10% luck (rare+ drop boost) for 30 minutes." },
  { id: "mega_luck",    name: "Mega Luck Potion",emoji: "🍀", price: 60000,  category: "potions", description: "+25% luck for 30 minutes." },
  { id: "haste_potion", name: "Haste Potion",    emoji: "💨", price: 18000,  category: "potions", description: "Hunt cooldown −30% for 20 minutes." },
  { id: "shield_potion",name: "Shield Potion",   emoji: "🛡️", price: 15000,  category: "potions", description: "Battle DEF +20% for 20 minutes." },
  // events
  { id: "event_scroll", name: "Event Scroll",  emoji: "📜", price: 60000, category: "events", description: "Triggers a server-wide ×2 cowoncy event for 30 minutes." },
  // equips (armor / charms)
  ...ARMOR_DEFS.filter((a) => a.price > 0).map<ShopItem>((a) => ({
    id: a.id, name: a.name, emoji: a.emoji, price: a.price, category: "equips",
    description: `${a.description} HP+${a.mods.hp} DEF+${a.mods.def}${a.mods.mag ? ` MAG+${a.mods.mag}` : ""}`,
  })),
  // pets — all accessory equips that improve pets (the user-requested category)
  ...ACCESSORY_DEFS.filter((a) => a.price > 0).map<ShopItem>((a) => ({
    id: a.id, name: a.name, emoji: a.emoji, price: a.price, category: "pets",
    description: `${a.description} HP+${a.mods.hp} ATK+${a.mods.atk} DEF+${a.mods.def} MAG+${a.mods.mag}${a.mods.crit ? ` CRIT+${Math.round((a.mods.crit) * 100)}%` : ""}`,
  })),
  // mining
  { id: "pickaxe_iron",  name: "Iron Pickaxe",   emoji: "⛏️", price: 25000,  category: "mining", description: "Mine cooldown −15% (passive)." },
  { id: "pickaxe_gold",  name: "Gold Pickaxe",   emoji: "⛏️", price: 80000,  category: "mining", description: "Mine cooldown −30% (passive)." },
  { id: "pickaxe_diamond",name:"Diamond Pickaxe",emoji: "⛏️", price: 200000, category: "mining", description: "Mine cooldown −50% (passive)." },
  // skills (curated entry skills players can buy directly)
  ...ACTIVE_SKILL_LIST.filter((s) => s.cost > 0 && s.rarity !== "legendary").map<ShopItem>((s) => ({
    id: `skill_${s.id}`, name: `Skill: ${s.name}`, emoji: s.emoji, price: s.cost, category: "skills",
    description: `${s.description} *(${s.rarity})*`,
  })),
  // premium (Lowo Cash)
  { id: "mythic_crate", name: "Mythic Crate",  emoji: "💎📦", price: 0, lowoCashPrice: 3, category: "premium", description: "1 weapon roll — guaranteed mythic." },
  { id: "perm_border",  name: "Permanent Border", emoji: "🪙", price: 0, lowoCashPrice: 10, category: "premium", description: "Cosmetic gold border on your profile card." },
  { id: "global_event", name: "Global Event Trigger", emoji: "🌍", price: 0, lowoCashPrice: 8, category: "premium", description: "Forces a random global event right now." },
  { id: "skill_legendary", name: "Skill: Arcues' Judgment", emoji: "🌠", price: 0, lowoCashPrice: 15, category: "premium", description: "Endgame legendary active skill." },
  ...ARMOR_DEFS.filter((a) => (a.lowoCashPrice ?? 0) > 0).map<ShopItem>((a) => ({
    id: a.id, name: a.name, emoji: a.emoji, price: 0, lowoCashPrice: a.lowoCashPrice, category: "premium",
    description: `${a.description} HP+${a.mods.hp} DEF+${a.mods.def}${a.mods.mag ? ` MAG+${a.mods.mag}` : ""}`,
  })),
  ...ACCESSORY_DEFS.filter((a) => (a.lowoCashPrice ?? 0) > 0).map<ShopItem>((a) => ({
    id: a.id, name: a.name, emoji: a.emoji, price: 0, lowoCashPrice: a.lowoCashPrice, category: "premium",
    description: `${a.description} HP+${a.mods.hp} ATK+${a.mods.atk} DEF+${a.mods.def} MAG+${a.mods.mag}`,
  })),
];
export const SHOP_BY_ID: Record<string, ShopItem> = Object.fromEntries(SHOP_ITEMS.map((i) => [i.id, i]));
export const SHOP_CATEGORIES: ShopCategory[] = ["items", "potions", "events", "equips", "pets", "mining", "skills", "premium"];

// ─── Luck helper (Arcues + potions + events) ──────────────────────────────────
// Returns a multiplier applied to rare+ rarity weights when rolling.
export function luckMultiplier(arcuesUnlocked: boolean, luckUntil: number, megaLuckUntil = 0, autohuntActive = false): number {
  let m = 1;
  if (arcuesUnlocked) m *= 1.05;
  if (Date.now() < luckUntil)     m *= 1.10;
  if (Date.now() < megaLuckUntil) m *= 1.25;
  // Autohunt halves your effective luck (the user-requested nerf).
  if (autohuntActive) m *= 0.5;
  return m;
}

// ─── Essence helper (Arcues bonus) ────────────────────────────────────────────
export function essenceArcuesMultiplier(arcuesUnlocked: boolean): number {
  return arcuesUnlocked ? 1.10 : 1;
}
