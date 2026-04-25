export type Rarity =
  | "common" | "uncommon" | "rare" | "epic" | "mythic" | "legendary"
  | "ethereal" | "divine" | "omni" | "glitched";

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
  huntable?: boolean;       // false → never appears in `lowo hunt`
  aquatic?: boolean;        // true → appears in `lowo fish`
  eventOnly?: boolean;      // true → only via specific events (e.g. glitched)
  signatureSkill?: string;  // skill id from SIGNATURE_SKILLS
}

// Hunt rarity weights. New top tiers are intentionally vanishingly rare.
export const RARITY_WEIGHTS: Record<Rarity, number> = {
  common: 55, uncommon: 25, rare: 12, epic: 5, mythic: 2.5, legendary: 0.5,
  ethereal: 0.05, divine: 0.01, omni: 0.005, glitched: 0,
};

export const RARITY_ORDER: Rarity[] = [
  "glitched", "omni", "divine", "ethereal",
  "legendary", "mythic", "epic", "rare", "uncommon", "common",
];

export const RARITY_COLOR: Record<Rarity, string> = {
  common: "⚪", uncommon: "🟢", rare: "🔵", epic: "🟣",
  mythic: "🟡", legendary: "🌈", ethereal: "🩵", divine: "🌕",
  omni: "💠", glitched: "🟥",
};

// ─── Signature Skills (battle phase) ──────────────────────────────────────────
// Each animal *may* have a signatureSkill (id below). Triggers ~25% per turn.
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
// Land/forest pool — appears in `lowo hunt`.
export const ANIMALS: Animal[] = [
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

  // Glitched (event-only)
  { id: "glitchfox",  name: "Glitch Fox", emoji: "🟥🦊", rarity: "glitched", hp: 666, atk: 99, def: 99, mag: 99, sellPrice: 99999, essence: 999, eventOnly: true, huntable: false, signatureSkill: "flurry" },

  // ─── Aquatic-only (fish.ts pool) ────────────────────────────────────────────
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

export const ANIMAL_BY_ID: Record<string, Animal> = Object.fromEntries(ANIMALS.map((a) => [a.id, a]));

// Pools
export const HUNT_POOL = ANIMALS.filter((a) => a.huntable !== false && !a.aquatic && !a.eventOnly);
export const FISH_POOL = ANIMALS.filter((a) => a.aquatic === true);

// ─── Roll helpers ─────────────────────────────────────────────────────────────
function pickRarityFromPool(pool: Animal[], luck: number): Rarity {
  const present = new Set<Rarity>(pool.map((a) => a.rarity));
  // Apply luck multiplier to all rarities above "rare"
  const rareTiers = new Set<Rarity>(["rare", "epic", "mythic", "legendary", "ethereal", "divine", "omni"]);
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

export function rollAnimal(luck = 1): Animal {
  for (let attempt = 0; attempt < 8; attempt++) {
    const r = pickRarityFromPool(HUNT_POOL, luck);
    const pool = HUNT_POOL.filter((a) => a.rarity === r);
    if (pool.length) return pool[Math.floor(Math.random() * pool.length)];
  }
  return HUNT_POOL[0];
}

export function rollFish(luck = 1): Animal {
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
  bronze: { name: "Bronze Crate", emoji: "🟫", price: 1500, rolls: 1, floor: "common" },
  silver: { name: "Silver Crate", emoji: "⬜", price: 5000, rolls: 2, floor: "uncommon" },
  gold:   { name: "Gold Crate",   emoji: "🟨", price: 15000, rolls: 3, floor: "rare" },
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
  { id: "double_hunt",   name: "Double Hunt",    emoji: "🎯", description: "Hunt drops 2 animals at once",   durationMs: 60 * 60 * 1000 },
  { id: "rare_rush",     name: "Rare Rush",      emoji: "💎", description: "Rare+ drop chance ×3 on hunt",   durationMs: 60 * 60 * 1000 },
  { id: "essence_storm", name: "Essence Storm",  emoji: "✨", description: "Sacrifices yield ×2 essence",    durationMs: 90 * 60 * 1000 },
  { id: "battle_frenzy", name: "Battle Frenzy",  emoji: "⚔️", description: "Battle rewards ×2 cowoncy",      durationMs: 60 * 60 * 1000 },
  { id: "cowoncy_event", name: "Cowoncy Event",  emoji: "💰", description: "All cowoncy gains ×2 (server-wide, scroll-triggered)", durationMs: 30 * 60 * 1000 },
];
export const EVENT_BY_ID: Record<string, LowoEvent> = Object.fromEntries(EVENTS.map((e) => [e.id, e]));

// ─── Pity System ──────────────────────────────────────────────────────────────
export const PITY_THRESHOLD = 200;

// ─── Pet Armor / Charms ───────────────────────────────────────────────────────
export interface ArmorDef { id: string; name: string; emoji: string; price: number; lowoCashPrice?: number; mods: { hp: number; def: number; mag: number }; description: string }
export const ARMOR_DEFS: ArmorDef[] = [
  { id: "leather_vest",   name: "Leather Vest",    emoji: "🦺", price: 1500,  mods: { hp: 25, def: 5, mag: 0 },  description: "Basic armor — small HP/DEF." },
  { id: "chain_mail",     name: "Chain Mail",      emoji: "⛓️", price: 5000,  mods: { hp: 60, def: 12, mag: 0 }, description: "Sturdy chain — moderate HP/DEF." },
  { id: "plate_armor",    name: "Plate Armor",     emoji: "🛡️", price: 15000, mods: { hp: 120, def: 25, mag: 0 }, description: "Heavy plate — big HP/DEF boost." },
  { id: "mage_robe",      name: "Mage Robe",       emoji: "🧙", price: 6000,  mods: { hp: 30, def: 5, mag: 18 }, description: "Channels arcane energy — boosts MAG." },
  { id: "lucky_charm",    name: "Lucky Charm",     emoji: "🍀", price: 8000,  mods: { hp: 20, def: 4, mag: 6 },  description: "Charm — small all-round boost." },
  { id: "dragon_scale",   name: "Dragon Scale",    emoji: "🐲", price: 0, lowoCashPrice: 5, mods: { hp: 200, def: 40, mag: 20 }, description: "Premium scale — massive HP/DEF/MAG." },
];
export const ARMOR_BY_ID: Record<string, ArmorDef> = Object.fromEntries(ARMOR_DEFS.map((a) => [a.id, a]));

// ─── Shop items (now categorized) ─────────────────────────────────────────────
export type ShopCategory = "items" | "potions" | "events" | "equips" | "premium";
export interface ShopItem {
  id: string; name: string; emoji: string;
  price: number;                 // cowoncy price (0 if premium-only)
  lowoCashPrice?: number;        // optional premium price
  category: ShopCategory;
  description: string;
}
export const SHOP_ITEMS: ShopItem[] = [
  // items
  { id: "ring",     name: "Wedding Ring",     emoji: "💍", price: 5000,  category: "items", description: "Required to use `lowo propose`" },
  { id: "crate",    name: "Weapon Crate",     emoji: "📦", price: 2500,  category: "items", description: "Stored — open with `lowo crate`" },
  { id: "bronze",   name: "Bronze Crate",     emoji: "🟫", price: 1500,  category: "items", description: "1 weapon roll — `lowo box bronze`" },
  { id: "silver",   name: "Silver Crate",     emoji: "⬜", price: 5000,  category: "items", description: "2 weapon rolls (uncommon+ floor) — `lowo box silver`" },
  { id: "gold",     name: "Gold Crate",       emoji: "🟨", price: 15000, category: "items", description: "3 weapon rolls (rare+ floor) — `lowo box gold`" },
  { id: "carrot",   name: "Magic Carrot",     emoji: "🥕", price: 200,   category: "items", description: "Boosts your next piku harvest" },
  { id: "lottery",  name: "Lottery Ticket",   emoji: "🎟️", price: 500,   category: "items", description: "Daily lottery — winner takes the pot" },
  { id: "petfood",  name: "Pet Food",         emoji: "🍖", price: 100,   category: "items", description: "Feed your Lowo Pet" },
  { id: "rod",      name: "Fishing Rod",      emoji: "🎣", price: 3000,  category: "items", description: "Required for `lowo fish`" },
  // backgrounds (items)
  ...BACKGROUNDS.filter((b) => b.price > 0).map<ShopItem>((b) => ({
    id: b.id, name: `BG: ${b.name}`, emoji: "🖼️", price: b.price, category: "items",
    description: `Profile background — set with \`lowo setbg ${b.id}\``,
  })),
  // potions
  { id: "luck_potion",  name: "Luck Potion",   emoji: "🧪", price: 4000, category: "potions", description: "+10% luck (rare+ drop boost) for 30 minutes." },
  // events
  { id: "event_scroll", name: "Event Scroll",  emoji: "📜", price: 20000, category: "events", description: "Triggers a server-wide ×2 cowoncy event for 30 minutes." },
  // equips (armor / charms)
  ...ARMOR_DEFS.filter((a) => a.price > 0).map<ShopItem>((a) => ({
    id: a.id, name: a.name, emoji: a.emoji, price: a.price, category: "equips",
    description: `${a.description} HP+${a.mods.hp} DEF+${a.mods.def}${a.mods.mag ? ` MAG+${a.mods.mag}` : ""}`,
  })),
  // premium (Lowo Cash)
  { id: "mythic_crate", name: "Mythic Crate",  emoji: "💎📦", price: 0, lowoCashPrice: 3, category: "premium", description: "1 weapon roll — guaranteed mythic." },
  { id: "perm_border",  name: "Permanent Border", emoji: "🪙", price: 0, lowoCashPrice: 10, category: "premium", description: "Cosmetic gold border on your profile card (flag-style)." },
  { id: "global_event", name: "Global Event Trigger", emoji: "🌍", price: 0, lowoCashPrice: 8, category: "premium", description: "Forces a random global event right now." },
  ...ARMOR_DEFS.filter((a) => (a.lowoCashPrice ?? 0) > 0).map<ShopItem>((a) => ({
    id: a.id, name: a.name, emoji: a.emoji, price: 0, lowoCashPrice: a.lowoCashPrice, category: "premium",
    description: `${a.description} HP+${a.mods.hp} DEF+${a.mods.def}${a.mods.mag ? ` MAG+${a.mods.mag}` : ""}`,
  })),
];
export const SHOP_BY_ID: Record<string, ShopItem> = Object.fromEntries(SHOP_ITEMS.map((i) => [i.id, i]));
export const SHOP_CATEGORIES: ShopCategory[] = ["items", "potions", "events", "equips", "premium"];

// ─── Luck helper (Arcues + potion) ────────────────────────────────────────────
// Returns a multiplier applied to rare+ rarity weights when rolling.
export function luckMultiplier(arcuesUnlocked: boolean, luckUntil: number): number {
  let m = 1;
  if (arcuesUnlocked) m *= 1.05;
  if (Date.now() < luckUntil) m *= 1.10;
  return m;
}

// ─── Essence helper (Arcues bonus) ────────────────────────────────────────────
export function essenceArcuesMultiplier(arcuesUnlocked: boolean): number {
  return arcuesUnlocked ? 1.10 : 1;
}
