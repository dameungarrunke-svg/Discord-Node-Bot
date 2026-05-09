import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const DATA_DIR   = resolve(__dirname, "../../data");
const ECO_FILE   = join(DATA_DIR, "economy.json");

export interface EcoUser {
  balance: number;
  bank: number;
  lastDaily: number;
  lastWeekly: number;
  lastWork: number;
  lastRob: number;
  lastCrime: number;
  lastInvest: number;
  inventory: { name: string; qty: number; price: number }[];
  investAmount: number;
  investAt: number;
  totalEarned: number;
}

type EcoStore = Record<string, EcoUser>;

let _store: EcoStore | null = null;
let _dirty = false;

function defaultUser(): EcoUser {
  return {
    balance: 0, bank: 0,
    lastDaily: 0, lastWeekly: 0, lastWork: 0, lastRob: 0, lastCrime: 0, lastInvest: 0,
    inventory: [], investAmount: 0, investAt: 0, totalEarned: 0,
  };
}

function load(): EcoStore {
  if (_store) return _store;
  try {
    if (existsSync(ECO_FILE)) {
      _store = JSON.parse(readFileSync(ECO_FILE, "utf-8")) as EcoStore;
      return _store;
    }
  } catch { /**/ }
  _store = {};
  return _store;
}

function save(): void {
  if (!_dirty) return;
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(ECO_FILE, JSON.stringify(_store ?? {}, null, 2), "utf-8");
  _dirty = false;
}

// Auto-save every 10 seconds
setInterval(save, 10_000);

export function getUser(userId: string): EcoUser {
  const store = load();
  if (!store[userId]) { store[userId] = defaultUser(); _dirty = true; }
  const u = store[userId];
  // backfill missing fields
  const def = defaultUser();
  let changed = false;
  for (const [k, v] of Object.entries(def)) {
    if ((u as unknown as Record<string, unknown>)[k] === undefined) {
      (u as unknown as Record<string, unknown>)[k] = v; changed = true;
    }
  }
  if (changed) _dirty = true;
  return u;
}

export function setUser(userId: string, data: Partial<EcoUser>): void {
  const store = load();
  if (!store[userId]) store[userId] = defaultUser();
  Object.assign(store[userId], data);
  _dirty = true;
}

export function addBalance(userId: string, amount: number): number {
  const u = getUser(userId);
  u.balance += amount;
  if (amount > 0) u.totalEarned += amount;
  _dirty = true;
  return u.balance;
}

export function getTopUsers(limit = 10): { userId: string; balance: number; bank: number }[] {
  const store = load();
  return Object.entries(store)
    .map(([userId, u]) => ({ userId, balance: u.balance + u.bank, bank: u.bank }))
    .sort((a, b) => b.balance - a.balance)
    .slice(0, limit);
}
