import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = resolve(__dirname, "../../data");
const FILE = join(DATA_DIR, "lowo.json");

export interface CraftedWeapon {
  id: string;
  recipeId: string;
  name: string;
  rarity: string;
  mods: { atk: number; def: number; mag: number };
}

// Per-pet enchantment record (one enchant per pet at a time).
export interface PetEnchantment { enchantId: string; appliedAt: number }
// Per-pet mutation record (one mutation per pet, rolled at capture only).
export interface PetMutation { mutationId: string; appliedAt: number }

export interface UserData {
  cowoncy: number;
  essence: number;
  zoo: Record<string, number>;
  weapons: Array<{ id: string; rarity: string; mods: { atk: number; def: number; mag: number } }>;
  team: string[];
  equipped: Record<string, string>;
  lastDaily: number;
  lastHunt: number;
  marriedTo: string | null;
  pet: { lastFed: number; streak: number };
  piku: { harvested: number; lastHarvest: number };
  dex: string[];
  lotteryTickets: number;
  // ── original expansion ──
  dailyStreak: number;
  lastBattle: number;
  lastRep: number;
  rep: number;
  pity: number;
  tag: string | null;
  background: string | null;
  instantBattle: boolean;
  carrots: number;
  rings: number;
  petfood: number;
  claimedQuests: { date: string; ids: string[] };
  animalXp: Record<string, number>;
  boxes: Record<string, number>;
  lowoCash: number;
  huntsTotal: number;
  lastFish: number;
  fishingRod: number;
  armor: Array<{ id: string; defId: string; mods: { hp: number; def: number; mag: number } }>;
  equippedArmor: Record<string, string>;
  luckUntil: number;
  isAdmin: boolean;
  arcuesUnlocked: boolean;
  // ── MEGA EXPANSION ──
  // Areas
  huntArea: "default" | "volcanic" | "space" | "heaven" | "void_unknown";
  unlockedAreas: string[];
  volcanicDex: string[];
  spaceDex: string[];
  heavenDex: string[];
  voidUnknownDex: string[];
  fishDex: string[];
  // Mining + crafting
  hasPickaxe: boolean;
  pickaxeTier: number;                         // 0/1/2/3 (basic / iron / gold / diamond)
  lastMine: number;
  minerals: Record<string, number>;
  craftedWeapons: CraftedWeapon[];
  // Pet active skill slots & owned skill catalog
  petSkills: Record<string, string[]>;         // animalId -> array of length 5 (skillId or "")
  ownedSkills: Record<string, number>;         // skillId -> count
  // Accessory equip slot (3rd pet slot)
  accessories: Array<{ id: string; defId: string; mods: { hp: number; atk: number; def: number; mag: number; crit?: number } }>;
  equippedAccessory: Record<string, string>;
  // Aquarium (separate from zoo)
  aquarium: Record<string, number>;
  // Skill battle session
  sbInvite: { from: string; channelId: string; expiresAt: number } | null;
  sbActive: { opponent: string; channelId: string; teamA: any[]; teamB: any[]; turn: "a" | "b"; cooldowns: Record<string, number>; round: number } | null;
  // Boss damage tracking (per-boss totals; periodically pruned by bosses module)
  bossDamage: Record<string, number>;
  // Potion timers
  megaLuckUntil: number;
  hasteUntil: number;
  shieldUntil: number;
  // Tracks last hunt area to render area-aware messages
  lastHuntArea: "default" | "volcanic" | "space" | "heaven" | "void_unknown";
  // Pet active rate (cooldowns per skill across battles — kept simple per skill battle)
  // The sbActive.cooldowns is per-active-session; not persisted long-term.
  // Lifetime stats
  bossKills: number;
  sbWins: number;
  sbLosses: number;
  // ── THE NEW ERA ──
  battleTokens: number;            // new currency from `lowo battle`
  gamepasses: Record<string, boolean>; // owned permanent gamepasses
  petMaterials: number;            // currency from recycling pets
  fusionPetCount: number;          // total fusions performed (lifetime)
  ownedGamepassesPurchased: number; // total gamepasses bought (achievement)
  // ── MASSIVE LOWO UPDATE ──
  enchantments: Record<string, PetEnchantment>;     // animalId -> applied enchant
  mutations:    Record<string, PetMutation>;        // animalId -> applied mutation
  enchantTomes: Record<string, number>;             // tomeId -> count owned (unused tomes)
  extraTeamSlots: number;                           // 0..3 added to base 3
  defeatedBossPets: Record<string, number>;         // bossPetId -> times awarded
  opChests: Record<string, number>;                 // opChestId -> count owned
  dinoSummonUntil: number;                          // OP Dino Summon Stone end ts
  // ── HOTFIX UPDATE (v5.1) ──
  autoSell: string[];          // rarities the user has auto-sell enabled for
  lifetimeCowoncy: number;     // monotonic — used as stable XP source for `lowo level`
  // ── ADMIN ──
  lowoBanned: boolean;         // set by admin toggleban — blocks all lowo commands
}

interface Store {
  users: Record<string, UserData>;
  lottery: { pot: number; tickets: Array<{ userId: string; count: number }>; lastDraw: number };
  event: { id: string | null; until: number };
}

function defaultUser(): UserData {
  return {
    cowoncy: 0, essence: 0, zoo: {}, weapons: [], team: [], equipped: {},
    lastDaily: 0, lastHunt: 0, marriedTo: null,
    pet: { lastFed: 0, streak: 0 },
    piku: { harvested: 0, lastHarvest: 0 },
    dex: [], lotteryTickets: 0,
    dailyStreak: 0, lastBattle: 0, lastRep: 0, rep: 0,
    pity: 0, tag: null, background: null, instantBattle: false,
    carrots: 0, rings: 0, petfood: 0,
    claimedQuests: { date: "", ids: [] },
    animalXp: {}, boxes: {},
    lowoCash: 0, huntsTotal: 0, lastFish: 0, fishingRod: 0,
    armor: [], equippedArmor: {},
    luckUntil: 0, isAdmin: false, arcuesUnlocked: false,
    // mega-expansion
    huntArea: "default",
    unlockedAreas: ["default"],
    volcanicDex: [],
    spaceDex: [],
    heavenDex: [],
    voidUnknownDex: [],
    fishDex: [],
    hasPickaxe: false,
    pickaxeTier: 0,
    lastMine: 0,
    minerals: {},
    craftedWeapons: [],
    petSkills: {},
    ownedSkills: { basic_strike: 1 },     // every user starts with the basic strike
    accessories: [], equippedAccessory: {},
    aquarium: {},
    sbInvite: null, sbActive: null,
    bossDamage: {},
    megaLuckUntil: 0, hasteUntil: 0, shieldUntil: 0,
    lastHuntArea: "default",
    bossKills: 0, sbWins: 0, sbLosses: 0,
    // The New Era
    battleTokens: 0,
    gamepasses: {},
    petMaterials: 0,
    fusionPetCount: 0,
    ownedGamepassesPurchased: 0,
    // Massive Lowo Update
    enchantments: {},
    mutations: {},
    enchantTomes: {},
    extraTeamSlots: 0,
    defeatedBossPets: {},
    opChests: {},
    dinoSummonUntil: 0,
    // HOTFIX UPDATE
    autoSell: [],
    lifetimeCowoncy: 0,
    // ADMIN
    lowoBanned: false,
  };
}

let cache: Store | null = null;

function load(): Store {
  if (cache) return cache;
  try {
    if (existsSync(FILE)) {
      cache = JSON.parse(readFileSync(FILE, "utf-8")) as Store;
      if (!cache.users) cache.users = {};
      if (!cache.lottery) cache.lottery = { pot: 0, tickets: [], lastDraw: 0 };
      if (!cache.event) cache.event = { id: null, until: 0 };
      return cache;
    }
  } catch { /* fallthrough */ }
  cache = { users: {}, lottery: { pot: 0, tickets: [], lastDraw: 0 }, event: { id: null, until: 0 } };
  return cache;
}

let saveTimer: NodeJS.Timeout | null = null;
function save(): void {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    if (!cache) return;
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(FILE, JSON.stringify(cache, null, 2), "utf-8");
  }, 500);
}

export function getUser(id: string): UserData {
  const s = load();
  if (!s.users[id]) {
    s.users[id] = defaultUser();
    save();
  }
  // backfill missing fields for old saves
  const u = s.users[id];
  const def = defaultUser();
  for (const k of Object.keys(def) as Array<keyof UserData>) {
    if ((u as any)[k] === undefined) (u as any)[k] = (def as any)[k];
  }
  // Make sure existing users always have the basic skill available (free).
  if (!u.ownedSkills) u.ownedSkills = {};
  if (!u.ownedSkills.basic_strike) u.ownedSkills.basic_strike = 1;
  if (!Array.isArray(u.unlockedAreas) || u.unlockedAreas.length === 0) u.unlockedAreas = ["default"];
  return u;
}

export function updateUser(id: string, fn: (u: UserData) => void): UserData {
  const u = getUser(id);
  fn(u);
  save();
  return u;
}

export function getLottery() {
  return load().lottery;
}

export function updateLottery(fn: (l: Store["lottery"]) => void): void {
  fn(load().lottery);
  save();
}

export function getEvent() {
  return load().event;
}

export function updateEvent(fn: (e: Store["event"]) => void): void {
  fn(load().event);
  save();
}

export function allUsers(): Record<string, UserData> {
  return load().users;
}

export function flush(): void {
  if (!cache) return;
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(FILE, JSON.stringify(cache, null, 2), "utf-8");
}
