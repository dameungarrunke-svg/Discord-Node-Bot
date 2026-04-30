// ─── INFINITE VOID — 100 NATIVE PETS (v6.2) ─────────────────────────────────
// Every pet here lives in `area: "infinite_void"` and is EPIC rarity or higher.
// Stats are roughly 2× of Area-5 equivalents; HP scales from 2,000 (epic) up
// to ~15,000 (secret) so wild encounters here read as "boss-class" fights.
//
// Rarity spread (totals to 101):
//   Epic:        25      Legendary:   15
//   Mythic:      30      Ethereal:    10
//   Inferno:     10      Cosmic:       4
//   Void:         4      Secret:       3  (Void Sovereign, The Architect's Mistake, Divine Dihraga)

import type { Animal, Rarity } from "./data.js";

type Sig =
  | "vampiric_bite" | "iron_wall" | "fire_breath" | "piercing_strike"
  | "flurry" | "cinder_burn" | "blessed_aura" | "petrify" | "dih_crusher";

function p(
  id: string, name: string, emoji: string, rarity: Rarity,
  hp: number, atk: number, def: number, mag: number,
  sellPrice: number, essence: number, signatureSkill?: Sig,
): Animal {
  return {
    id, name, emoji, rarity, hp, atk, def, mag, sellPrice, essence,
    area: "infinite_void", signatureSkill,
  };
}

export const INFINITE_VOID_NATIVE_PETS: Animal[] = [
  // ───────────────── EPIC (25) — HP 2,000–2,400 / ATK 80–120 ─────────────────
  p("iv_void_drake",         "Void Drake",            "🐉",   "epic", 2050,  92,  78,  80, 3800,  55, "fire_breath"),
  p("iv_glitch_spiderling",  "Glitched Spiderling",   "🕸️",  "epic", 2000,  95,  70,  88, 3700,  52, "flurry"),
  p("iv_eldritch_husk",      "Eldritch Husk",         "🧟",   "epic", 2150,  82,  92,  72, 3900,  58, "iron_wall"),
  p("iv_abyssal_imp",        "Abyssal Imp",           "😈",   "epic", 2010, 105,  68,  90, 3950,  60, "vampiric_bite"),
  p("iv_void_wyrmling",      "Void Wyrmling",         "🐲",   "epic", 2200,  88,  82,  78, 4000,  60, "petrify"),
  p("iv_glitch_widow",       "Glitched Widow",        "🕷️",   "epic", 2050, 110,  72,  86, 4100,  62, "vampiric_bite"),
  p("iv_shadow_acolyte",     "Shadow Acolyte",        "🥷",   "epic", 2100,  98,  78,  92, 4050,  60, "piercing_strike"),
  p("iv_void_pup",           "Void Pup",              "🐺",   "epic", 2080, 100,  76,  82, 4000,  58, "flurry"),
  p("iv_eldritch_eye",       "Eldritch Eye",          "👁️",   "epic", 2020,  85,  70, 115, 4150,  64, "petrify"),
  p("iv_abyssal_eel",        "Abyssal Eel",           "🪱",   "epic", 2000, 108,  68,  88, 3900,  56, "vampiric_bite"),
  p("iv_glitch_moth",        "Glitched Moth",         "🦋",   "epic", 2050,  90,  75, 105, 4050,  60, "blessed_aura"),
  p("iv_void_kitten",        "Void Kitten",           "🐈‍⬛", "epic", 2000, 102,  70,  84, 3850,  55, "flurry"),
  p("iv_shadow_squire",      "Shadow Squire",         "🛡️",   "epic", 2300,  85,  98,  72, 4100,  60, "iron_wall"),
  p("iv_eldritch_crawler",   "Eldritch Crawler",      "🦂",   "epic", 2100, 112,  78,  76, 4000,  58, "piercing_strike"),
  p("iv_void_finch",         "Void Finch",            "🐦‍⬛", "epic", 2000,  95,  68, 102, 3900,  55, "blessed_aura"),
  p("iv_glitch_rat",         "Glitched Rat",          "🐀",   "epic", 2050, 105,  72,  82, 3850,  54, "vampiric_bite"),
  p("iv_abyssal_snail",      "Abyssal Snail",         "🐌",   "epic", 2400,  78, 118,  70, 4200,  62, "iron_wall"),
  p("iv_void_bat",           "Void Bat",              "🦇",   "epic", 2000,  98,  72,  98, 3950,  56),
  p("iv_eldritch_pollywog",  "Eldritch Pollywog",     "🐸",   "epic", 2080,  88,  78,  96, 3950,  56, "petrify"),
  p("iv_glitch_octopling",   "Glitched Octopling",    "🐙",   "epic", 2100,  92,  82,  98, 4050,  60, "petrify"),
  p("iv_void_serpentling",   "Void Serpentling",      "🐍",   "epic", 2050, 105,  74,  86, 4000,  58, "vampiric_bite"),
  p("iv_shadow_jester",      "Shadow Jester",         "🎭",   "epic", 2000, 115,  70,  92, 4200,  64, "flurry"),
  p("iv_abyssal_squelp",     "Abyssal Squelp",        "🦑",   "epic", 2150,  86,  88,  90, 3950,  56),
  p("iv_eldritch_centipede", "Eldritch Centipede",    "🪳",   "epic", 2200, 108,  82,  72, 4050,  60, "piercing_strike"),
  p("iv_void_pugling",       "Void Pugling",          "🐶",   "epic", 2050, 100,  76,  80, 3850,  55, "flurry"),

  // ──────────────── LEGENDARY (15) — HP 2,800–3,500 / ATK 140–200 ────────────
  p("iv_void_dragon",        "Void Dragon",           "🐉",   "legendary", 3300, 185, 145, 150, 22000, 280, "fire_breath"),
  p("iv_glitch_chimera",     "Glitched Chimera",      "🦁",   "legendary", 3200, 195, 130, 160, 22500, 290, "flurry"),
  p("iv_reality_eater",      "Reality Eater",         "🪐",   "legendary", 3500, 175, 160, 170, 24000, 310, "vampiric_bite"),
  p("iv_shadow_knight",      "Shadow Knight",         "🤺",   "legendary", 3400, 180, 165, 130, 22000, 280, "piercing_strike"),
  p("iv_abyssal_leviathan_jr","Lesser Abyssal Leviathan","🐳","legendary", 3500, 170, 158, 150, 23000, 295, "iron_wall"),
  p("iv_void_phoenix",       "Void-Reaper Phoenix",   "🦅",   "legendary", 3000, 200, 120, 175, 24500, 320, "fire_breath"),
  p("iv_glitch_kraken",      "Glitched Kraken",       "🐙",   "legendary", 3450, 165, 155, 165, 23500, 300, "petrify"),
  p("iv_shadow_warden",      "Shadow Warden",         "🛡️",   "legendary", 3500, 145, 195, 130, 21500, 270, "iron_wall"),
  p("iv_eldritch_revenant",  "Eldritch Revenant",     "💀",   "legendary", 3100, 190, 135, 165, 23000, 295, "vampiric_bite"),
  p("iv_void_basilisk",      "Void Basilisk",         "🐍",   "legendary", 3050, 195, 130, 158, 22500, 285, "petrify"),
  p("iv_abyssal_anglerlord", "Abyssal Anglerlord",    "🎣",   "legendary", 3250, 180, 150, 155, 22000, 280, "vampiric_bite"),
  p("iv_glitch_mantis",      "Glitched Mantis",       "🦗",   "legendary", 2900, 200, 125, 145, 22000, 280, "piercing_strike"),
  p("iv_void_griffon",       "Void Griffon",          "🦅",   "legendary", 3150, 185, 140, 152, 22500, 285, "flurry"),
  p("iv_eldritch_wendigo",   "Eldritch Wendigo",      "🦌",   "legendary", 3200, 195, 138, 148, 23000, 295, "vampiric_bite"),
  p("iv_shadow_inquisitor",  "Shadow Inquisitor",     "🗡️",   "legendary", 2950, 200, 130, 168, 23500, 300, "piercing_strike"),

  // ──────────────── MYTHIC (30) — HP 4,000–5,500 / ATK 250–340 ───────────────
  p("iv_void_hydra",         "Void Hydra",            "🐲",   "mythic", 5200, 290, 235, 240,  72000, 760, "fire_breath"),
  p("iv_glitch_archon",      "Glitched Archon",       "♾️",   "mythic", 4800, 320, 215, 260,  78000, 820, "petrify"),
  p("iv_abyssal_kraken",     "Abyssal Kraken",        "🐙",   "mythic", 5100, 280, 240, 250,  74000, 780, "petrify"),
  p("iv_eldritch_lich",      "Eldritch Lich",         "💀",   "mythic", 4500, 310, 200, 290,  82000, 870, "vampiric_bite"),
  p("iv_shadow_paladin",     "Shadow Paladin",        "⚔️",  "mythic", 5400, 270, 260, 200,  68000, 720, "iron_wall"),
  p("iv_void_chimera",       "Void Chimera",          "🦁",   "mythic", 5000, 305, 220, 245,  76000, 800, "flurry"),
  p("iv_reality_glutton",    "Reality Glutton",       "🌀",   "mythic", 5500, 265, 250, 260,  80000, 850, "vampiric_bite"),
  p("iv_glitch_arachnid",    "Glitched Arachnid",     "🕷️",   "mythic", 4400, 335, 195, 240,  78000, 820, "vampiric_bite"),
  p("iv_void_cerberus",      "Void Cerberus",         "🐕‍🦺", "mythic", 5300, 300, 230, 220,  74000, 780, "flurry"),
  p("iv_eldritch_horror",    "Eldritch Horror",       "👁️",   "mythic", 4800, 280, 220, 320,  84000, 880, "petrify"),
  p("iv_abyssal_serpent_lord","Abyssal Serpent Lord", "🐉",   "mythic", 5100, 295, 230, 235,  76000, 800, "petrify"),
  p("iv_shadow_executioner", "Shadow Executioner",    "🪓",   "mythic", 4700, 340, 200, 230,  82000, 870, "piercing_strike"),
  p("iv_void_manticore",     "Void Manticore",        "🦂",   "mythic", 4900, 315, 225, 240,  78000, 820, "piercing_strike"),
  p("iv_glitch_swarm",       "Glitched Swarm",        "🦟",   "mythic", 4400, 335, 190, 250,  76000, 800, "flurry"),
  p("iv_eldritch_devourer",  "Eldritch Devourer",     "👹",   "mythic", 5200, 305, 225, 245,  80000, 850, "vampiric_bite"),
  p("iv_void_basilisk_elder","Elder Void Basilisk",   "🐍",   "mythic", 5000, 300, 220, 250,  78000, 820, "petrify"),
  p("iv_abyssal_titan",      "Abyssal Titan",         "🗿",   "mythic", 5500, 270, 260, 220,  76000, 800, "iron_wall"),
  p("iv_shadow_seraph",      "Shadow Seraph",         "😇",   "mythic", 4800, 290, 220, 290,  82000, 870, "blessed_aura"),
  p("iv_glitch_overlord",    "Glitched Overlord",     "👾",   "mythic", 5100, 320, 230, 245,  84000, 880, "fire_breath"),
  p("iv_void_djinn",         "Void Djinn",            "🧞",   "mythic", 4600, 305, 210, 295,  82000, 870, "petrify"),
  p("iv_eldritch_ghoul",     "Eldritch Ghoul",        "🧟",   "mythic", 4900, 295, 225, 240,  74000, 780, "vampiric_bite"),
  p("iv_void_wyrm",          "Void Wyrm",             "🐲",   "mythic", 5400, 285, 245, 230,  76000, 800, "fire_breath"),
  p("iv_abyssal_warlord",    "Abyssal Warlord",       "⚓",   "mythic", 5200, 310, 235, 220,  78000, 820, "piercing_strike"),
  p("iv_shadow_warlock",     "Shadow Warlock",        "🧙",   "mythic", 4500, 290, 200, 320,  82000, 870, "petrify"),
  p("iv_glitch_titan",       "Glitched Titan",        "🤖",   "mythic", 5500, 300, 255, 215,  80000, 850, "iron_wall"),
  p("iv_void_phantom",       "Void Phantom",          "👻",   "mythic", 4400, 320, 195, 305,  82000, 870, "vampiric_bite"),
  p("iv_eldritch_terror",    "Eldritch Terror",       "😱",   "mythic", 4800, 315, 220, 270,  82000, 870, "petrify"),
  p("iv_abyssal_behemoth",   "Abyssal Behemoth",      "🦣",   "mythic", 5500, 280, 260, 215,  78000, 820, "iron_wall"),
  p("iv_shadow_archmage",    "Shadow Archmage",       "🪄",   "mythic", 4500, 295, 205, 320,  84000, 880, "petrify"),
  p("iv_glitch_fiend",       "Glitched Fiend",        "😈",   "mythic", 4900, 325, 220, 250,  82000, 870, "fire_breath"),

  // ──────────────── ETHEREAL (10) — HP 6,000–7,500 / ATK 380–450 ─────────────
  p("iv_void_emperor",       "Void Emperor",          "👑",   "ethereal", 7200, 420, 340, 340, 250000, 1900, "fire_breath"),
  p("iv_glitch_god_shard",   "Glitched God-Shard",    "⚙️",   "ethereal", 6800, 445, 310, 360, 270000, 2100, "petrify"),
  p("iv_eldritch_seer",      "Eldritch All-Seer",     "👁️",   "ethereal", 6500, 395, 290, 440, 280000, 2200, "petrify"),
  p("iv_abyssal_god_kraken", "Abyssal God-Kraken",    "🦑",   "ethereal", 7000, 410, 330, 360, 260000, 2000, "petrify"),
  p("iv_shadow_lord",        "Shadow Lord",           "👑",   "ethereal", 7500, 405, 360, 310, 240000, 1850, "iron_wall"),
  p("iv_void_titan",         "Void Titan",            "🗿",   "ethereal", 7500, 390, 360, 310, 245000, 1900, "iron_wall"),
  p("iv_glitch_hivemind",    "Glitched Hivemind",     "🧠",   "ethereal", 6200, 430, 290, 415, 275000, 2150, "petrify"),
  p("iv_eldritch_chronoeater","Eldritch Chrono-Eater","⏳",   "ethereal", 6800, 415, 320, 380, 260000, 2050, "vampiric_bite"),
  p("iv_abyssal_oracle",     "Abyssal Oracle",        "🔮",   "ethereal", 6300, 405, 305, 425, 270000, 2100, "blessed_aura"),
  p("iv_void_reaper",        "Void Reaper",           "💀",   "ethereal", 6700, 450, 320, 365, 290000, 2250, "vampiric_bite"),

  // ──────────────── INFERNO (10) — HP 7,500–9,000 / ATK 460–540 ──────────────
  p("iv_void_pyrelord",      "Void Pyrelord",         "🔥",   "inferno", 8500, 510, 410, 415, 420000, 2900, "fire_breath"),
  p("iv_glitch_pyromancer",  "Glitched Pyromancer",   "🌋",   "inferno", 8200, 525, 395, 430, 440000, 3000, "fire_breath"),
  p("iv_eldritch_inferno",   "Eldritch Inferno",      "🔥",   "inferno", 8800, 500, 420, 410, 430000, 2950, "cinder_burn"),
  p("iv_abyssal_magma_serpent","Abyssal Magma Serpent","🌋",  "inferno", 8500, 520, 405, 405, 430000, 2950, "fire_breath"),
  p("iv_shadow_pyre",        "Shadow Pyre",           "🕯️",   "inferno", 7800, 540, 380, 440, 460000, 3100, "cinder_burn"),
  p("iv_void_cinderking",    "Void Cinderking",       "♨️",   "inferno", 9000, 495, 440, 395, 440000, 3000, "cinder_burn"),
  p("iv_glitch_blazemaw",    "Glitched Blazemaw",     "🦷",   "inferno", 8000, 530, 390, 420, 450000, 3050, "fire_breath"),
  p("iv_eldritch_burnlord",  "Eldritch Burnlord",     "🩸",   "inferno", 8400, 515, 410, 415, 440000, 3000, "vampiric_bite"),
  p("iv_abyssal_brimstone",  "Abyssal Brimstone",     "🪨",   "inferno", 9000, 480, 450, 380, 430000, 2950, "iron_wall"),
  p("iv_void_furnace",       "Void Furnace",          "🏭",   "inferno", 8800, 510, 430, 400, 450000, 3050, "fire_breath"),

  // ──────────────── COSMIC (4) — HP 9,500–11,000 / ATK 600–720 ───────────────
  p("iv_void_galaxy",        "Void Galaxy-Eater",     "🌌",   "cosmic",  10500, 690, 540, 560,  900000, 5500, "vampiric_bite"),
  p("iv_glitch_quasar",      "Glitched Quasar",       "🌠",   "cosmic",  10000, 720, 510, 580,  950000, 5800, "fire_breath"),
  p("iv_eldritch_singular",  "Eldritch Singular",     "🪐",   "cosmic",  10800, 660, 555, 575,  920000, 5600, "petrify"),
  p("iv_abyssal_starwhale",  "Abyssal Star-Whale",    "🐋",   "cosmic",  11000, 645, 575, 555,  880000, 5400, "iron_wall"),

  // ──────────────── VOID (4) — HP 11,000–13,000 / ATK 750–880 ────────────────
  p("iv_void_voidking",      "The Voidking",          "👑",   "void",    12500, 850, 690, 700, 1900000, 8500, "fire_breath"),
  p("iv_glitch_avatar",      "Glitched Avatar",       "🤖",   "void",    11500, 880, 660, 720, 2000000, 9000, "petrify"),
  p("iv_eldritch_overgod",   "Eldritch Overgod",      "🜏",   "void",    12000, 820, 680, 730, 2100000, 9200, "vampiric_bite"),
  p("iv_abyssal_genesis",    "Abyssal Genesis",       "⚫",   "void",    13000, 790, 720, 700, 2200000, 9500, "iron_wall"),

  // ──────────────── SECRET (3) — HP 13,800–15,000 / ATK 1,000–1,200 ──────────
  p("iv_divine_dihraga",     "Divine Dihraga",        "🪬",   "secret",  13800, 1050,  880, 920, 4400000, 18000, "dih_crusher"),
  p("iv_void_sovereign",     "Void Sovereign",        "🜏",   "secret",  14500, 1100,  900, 950, 6000000, 21000, "fire_breath"),
  p("iv_architects_mistake", "The Architect's Mistake","🌀",  "secret",  15000, 1200,  950, 980, 8000000, 25000, "vampiric_bite"),
];

// Sanity check at module load — fail fast if a future edit breaks the count.
if (INFINITE_VOID_NATIVE_PETS.length !== 101) {
  throw new Error(
    `INFINITE_VOID_NATIVE_PETS must contain exactly 101 pets (got ${INFINITE_VOID_NATIVE_PETS.length}).`
  );
}
