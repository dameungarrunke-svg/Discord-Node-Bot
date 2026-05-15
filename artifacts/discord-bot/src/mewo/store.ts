import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = resolve(__dirname, "../../data");
const FILE = join(DATA_DIR, "mewo.json");

export interface MewoTag {
  name: string;
  content: string;
  createdBy: string;
  createdByTag: string;
  createdAt: string;
}

interface WalletEntry {
  balance: number;
  dailyDate: string;
  streak: number;
  lastClaimDate: string;
}

interface MewoData {
  enabledChannels: string[];
  tags: Record<string, Record<string, MewoTag>>;
  timezones: Record<string, string>;
  embedColors: Record<string, string>;
  aiUsage: Record<string, { chatgpt: number; llama: number; deepseek: number; resetDate: string }>;
  wallets: Record<string, WalletEntry>;
}

let _cache: MewoData | null = null;

function createDefault(): MewoData {
  return { enabledChannels: [], tags: {}, timezones: {}, embedColors: {}, aiUsage: {}, wallets: {} };
}

function load(): MewoData {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(FILE)) {
    const empty = createDefault();
    writeFileSync(FILE, JSON.stringify(empty, null, 2), "utf-8");
    return empty;
  }
  try {
    const d = JSON.parse(readFileSync(FILE, "utf-8")) as MewoData;
    if (!d.wallets) d.wallets = {};
    if (!d.enabledChannels) d.enabledChannels = [];
    if (!d.tags) d.tags = {};
    if (!d.timezones) d.timezones = {};
    if (!d.embedColors) d.embedColors = {};
    if (!d.aiUsage) d.aiUsage = {};
    for (const [id, w] of Object.entries(d.wallets)) {
      if (typeof (w as WalletEntry).streak !== "number") {
        d.wallets[id] = { ...w, streak: 0, lastClaimDate: (w as WalletEntry).dailyDate ?? "" };
      }
    }
    return d;
  } catch {
    return createDefault();
  }
}

function getData(): MewoData {
  if (!_cache) _cache = load();
  return _cache;
}

function save(): void {
  if (!_cache) return;
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(FILE, JSON.stringify(_cache, null, 2), "utf-8");
}

export function isChannelEnabled(channelId: string): boolean {
  const d = getData();
  return d.enabledChannels.length === 0 || d.enabledChannels.includes(channelId);
}

export function enableChannel(channelId: string): void {
  const d = getData();
  if (!d.enabledChannels.includes(channelId)) {
    d.enabledChannels.push(channelId);
    save();
  }
}

export function disableChannel(channelId: string): void {
  const d = getData();
  d.enabledChannels = d.enabledChannels.filter(id => id !== channelId);
  save();
}

export function getEnabledChannels(): string[] {
  return getData().enabledChannels;
}

export function getTag(guildId: string, name: string): MewoTag | null {
  return getData().tags[guildId]?.[name.toLowerCase()] ?? null;
}

export function createTag(guildId: string, tag: MewoTag): boolean {
  const d = getData();
  if (!d.tags[guildId]) d.tags[guildId] = {};
  if (d.tags[guildId][tag.name.toLowerCase()]) return false;
  d.tags[guildId][tag.name.toLowerCase()] = tag;
  save();
  return true;
}

export function deleteTag(guildId: string, name: string): boolean {
  const d = getData();
  if (!d.tags[guildId]?.[name.toLowerCase()]) return false;
  delete d.tags[guildId][name.toLowerCase()];
  save();
  return true;
}

export function listTags(guildId: string): MewoTag[] {
  return Object.values(getData().tags[guildId] ?? {});
}

export function editTag(guildId: string, name: string, content: string): boolean {
  const d = getData();
  const tag = d.tags[guildId]?.[name.toLowerCase()];
  if (!tag) return false;
  tag.content = content;
  save();
  return true;
}

export function getTimezone(userId: string): string {
  return getData().timezones[userId] ?? "UTC";
}

export function setTimezone(userId: string, tz: string): void {
  const d = getData();
  d.timezones[userId] = tz;
  save();
}

export function getEmbedColor(userId: string): number {
  const color = getData().embedColors[userId];
  return color ? (parseInt(color.replace("#", ""), 16) || 0x5865F2) : 0x5865F2;
}

export function setEmbedColor(userId: string, hex: string): void {
  const d = getData();
  d.embedColors[userId] = hex.replace("#", "");
  save();
}

export function getAiUsage(userId: string): { chatgpt: number; llama: number; deepseek: number; resetDate: string } {
  const d = getData();
  const today = new Date().toISOString().slice(0, 10);
  const u = d.aiUsage[userId];
  if (!u || u.resetDate !== today) return { chatgpt: 0, llama: 0, deepseek: 0, resetDate: today };
  return { chatgpt: u.chatgpt ?? 0, llama: u.llama ?? 0, deepseek: u.deepseek ?? 0, resetDate: u.resetDate };
}

export function incrementAiUsage(userId: string, model: "chatgpt" | "llama" | "deepseek"): void {
  const d = getData();
  const today = new Date().toISOString().slice(0, 10);
  const u = d.aiUsage[userId] ?? { chatgpt: 0, llama: 0, deepseek: 0, resetDate: today };
  if (u.resetDate !== today) { u.chatgpt = 0; u.llama = 0; u.deepseek = 0; u.resetDate = today; }
  u[model] = (u[model] ?? 0) + 1;
  d.aiUsage[userId] = u;
  save();
}

export function getWallet(userId: string): WalletEntry {
  return getData().wallets[userId] ?? { balance: 0, dailyDate: "", streak: 0, lastClaimDate: "" };
}

export function setWalletBalance(userId: string, balance: number): void {
  const d = getData();
  const w = d.wallets[userId] ?? { balance: 0, dailyDate: "", streak: 0, lastClaimDate: "" };
  w.balance = balance;
  d.wallets[userId] = w;
  save();
}

export function updateWalletBalance(userId: string, delta: number): void {
  const d = getData();
  const w = d.wallets[userId] ?? { balance: 0, dailyDate: "", streak: 0, lastClaimDate: "" };
  w.balance = Math.max(0, w.balance + delta);
  d.wallets[userId] = w;
  save();
}

export function claimDaily(userId: string): { claimed: boolean; amount: number; balance: number; streak: number; bonus: number } {
  const d = getData();
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  const w = d.wallets[userId] ?? { balance: 0, dailyDate: "", streak: 0, lastClaimDate: "" };
  if (w.dailyDate === today) return { claimed: false, amount: 0, balance: w.balance, streak: w.streak ?? 0, bonus: 0 };

  const lastClaim = w.lastClaimDate ?? w.dailyDate ?? "";
  const isConsecutive = lastClaim === yesterday;
  const streak = isConsecutive ? (w.streak ?? 0) + 1 : 1;

  const base = Math.floor(Math.random() * 400) + 100;
  let bonus = 0;
  if (streak >= 30) bonus = Math.floor(base * 4);
  else if (streak >= 7) bonus = Math.floor(base * 1);
  else if (streak >= 3) bonus = Math.floor(base * 0.5);

  const amount = base + bonus;
  w.balance += amount;
  w.dailyDate = today;
  w.lastClaimDate = today;
  w.streak = streak;
  d.wallets[userId] = w;
  save();
  return { claimed: true, amount, balance: w.balance, streak, bonus };
}

export function transferCoins(fromId: string, toId: string, amount: number): boolean {
  const d = getData();
  const from = d.wallets[fromId] ?? { balance: 0, dailyDate: "", streak: 0, lastClaimDate: "" };
  const to   = d.wallets[toId]   ?? { balance: 0, dailyDate: "", streak: 0, lastClaimDate: "" };
  if (from.balance < amount) return false;
  from.balance -= amount;
  to.balance   += amount;
  d.wallets[fromId] = from;
  d.wallets[toId]   = to;
  save();
  return true;
}

export function getWalletLeaderboard(limit = 10): Array<{ userId: string; balance: number }> {
  return Object.entries(getData().wallets)
    .map(([userId, w]) => ({ userId, balance: w.balance }))
    .sort((a, b) => b.balance - a.balance)
    .slice(0, limit);
}
