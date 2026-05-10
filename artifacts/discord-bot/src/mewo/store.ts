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

interface MewoData {
  enabledChannels: string[];
  tags: Record<string, Record<string, MewoTag>>;
  timezones: Record<string, string>;
  embedColors: Record<string, string>;
  aiUsage: Record<string, { chatgpt: number; llama: number; resetDate: string }>;
}

function load(): MewoData {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(FILE)) {
    const empty: MewoData = { enabledChannels: [], tags: {}, timezones: {}, embedColors: {}, aiUsage: {} };
    writeFileSync(FILE, JSON.stringify(empty, null, 2), "utf-8");
    return empty;
  }
  try {
    return JSON.parse(readFileSync(FILE, "utf-8")) as MewoData;
  } catch {
    return { enabledChannels: [], tags: {}, timezones: {}, embedColors: {}, aiUsage: {} };
  }
}

function save(d: MewoData): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(FILE, JSON.stringify(d, null, 2), "utf-8");
}

export function isChannelEnabled(channelId: string): boolean {
  return load().enabledChannels.includes(channelId);
}

export function enableChannel(channelId: string): void {
  const d = load();
  if (!d.enabledChannels.includes(channelId)) { d.enabledChannels.push(channelId); save(d); }
}

export function disableChannel(channelId: string): void {
  const d = load();
  d.enabledChannels = d.enabledChannels.filter(id => id !== channelId);
  save(d);
}

export function getTag(guildId: string, name: string): MewoTag | null {
  return load().tags[guildId]?.[name.toLowerCase()] ?? null;
}

export function createTag(guildId: string, tag: MewoTag): boolean {
  const d = load();
  if (!d.tags[guildId]) d.tags[guildId] = {};
  if (d.tags[guildId][tag.name.toLowerCase()]) return false;
  d.tags[guildId][tag.name.toLowerCase()] = tag;
  save(d);
  return true;
}

export function deleteTag(guildId: string, name: string): boolean {
  const d = load();
  if (!d.tags[guildId]?.[name.toLowerCase()]) return false;
  delete d.tags[guildId][name.toLowerCase()];
  save(d);
  return true;
}

export function listTags(guildId: string): MewoTag[] {
  return Object.values(load().tags[guildId] ?? {});
}

export function editTag(guildId: string, name: string, content: string): boolean {
  const d = load();
  const tag = d.tags[guildId]?.[name.toLowerCase()];
  if (!tag) return false;
  tag.content = content;
  save(d);
  return true;
}

export function getTimezone(userId: string): string {
  return load().timezones[userId] ?? "UTC";
}

export function setTimezone(userId: string, tz: string): void {
  const d = load();
  d.timezones[userId] = tz;
  save(d);
}

export function getEmbedColor(userId: string): number {
  const color = load().embedColors[userId];
  return color ? (parseInt(color.replace("#", ""), 16) || 0x5865F2) : 0x5865F2;
}

export function setEmbedColor(userId: string, hex: string): void {
  const d = load();
  d.embedColors[userId] = hex.replace("#", "");
  save(d);
}

export function getAiUsage(userId: string): { chatgpt: number; llama: number; resetDate: string } {
  const d = load();
  const today = new Date().toISOString().slice(0, 10);
  const u = d.aiUsage[userId];
  if (!u || u.resetDate !== today) return { chatgpt: 0, llama: 0, resetDate: today };
  return u;
}

export function incrementAiUsage(userId: string, model: "chatgpt" | "llama"): void {
  const d = load();
  const today = new Date().toISOString().slice(0, 10);
  const u = d.aiUsage[userId] ?? { chatgpt: 0, llama: 0, resetDate: today };
  if (u.resetDate !== today) { u.chatgpt = 0; u.llama = 0; u.resetDate = today; }
  u[model]++;
  d.aiUsage[userId] = u;
  save(d);
}
