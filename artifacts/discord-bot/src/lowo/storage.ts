import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = resolve(__dirname, "../../data");
const FILE = join(DATA_DIR, "lowo.json");

export interface UserData {
  cowoncy: number;
  essence: number;
  zoo: Record<string, number>; // animalId -> count
  weapons: Array<{ id: string; rarity: string; mods: { atk: number; def: number; mag: number } }>;
  team: string[]; // animal ids
  equipped: Record<string, string>; // animalId -> weaponIndex (string)
  lastDaily: number;
  lastHunt: number;
  marriedTo: string | null;
  pet: { lastFed: number; streak: number };
  piku: { harvested: number; lastHarvest: number };
  dex: string[]; // unique animal ids ever caught
  lotteryTickets: number;
}

interface Store {
  users: Record<string, UserData>;
  lottery: { pot: number; tickets: Array<{ userId: string; count: number }>; lastDraw: number };
}

function defaultUser(): UserData {
  return {
    cowoncy: 0, essence: 0, zoo: {}, weapons: [], team: [], equipped: {},
    lastDaily: 0, lastHunt: 0, marriedTo: null,
    pet: { lastFed: 0, streak: 0 },
    piku: { harvested: 0, lastHarvest: 0 },
    dex: [], lotteryTickets: 0,
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
      return cache;
    }
  } catch { /* fallthrough */ }
  cache = { users: {}, lottery: { pot: 0, tickets: [], lastDraw: 0 } };
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

export function flush(): void {
  if (!cache) return;
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(FILE, JSON.stringify(cache, null, 2), "utf-8");
}
