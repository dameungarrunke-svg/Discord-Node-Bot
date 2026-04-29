import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = resolve(__dirname, "../../data");
const FILE = join(DATA_DIR, "lowo_channels.json");

type State = Record<string, string[]>; // guildId → channelId[]

let cache: State | null = null;

function readStore(): State {
  if (cache) return cache;
  try {
    if (existsSync(FILE)) cache = JSON.parse(readFileSync(FILE, "utf-8")) as State;
  } catch { /* fallthrough */ }
  if (!cache) cache = {};
  return cache;
}

function writeStore(): void {
  if (!cache) return;
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(FILE, JSON.stringify(cache, null, 2), "utf-8");
}

/**
 * Returns true if Lowo should respond in this channel.
 * If no whitelist is set for the guild, all channels are allowed.
 */
export function isChannelAllowed(guildId: string | null, channelId: string): boolean {
  if (!guildId) return true;
  const list = readStore()[guildId];
  if (!list || list.length === 0) return true;
  return list.includes(channelId);
}

/** Returns the full whitelist for a guild (empty = no restriction). */
export function getChannelList(guildId: string): string[] {
  return readStore()[guildId] ?? [];
}

/** Adds a channel to the whitelist. Creates the entry if needed. */
export function enableChannel(guildId: string, channelId: string): void {
  const s = readStore();
  const set = new Set(s[guildId] ?? []);
  set.add(channelId);
  s[guildId] = Array.from(set);
  writeStore();
}

/**
 * Removes a channel from the whitelist.
 * If the list becomes empty the guild entry is deleted (= back to allow-all).
 */
export function disableChannel(guildId: string, channelId: string): void {
  const s = readStore();
  const arr = (s[guildId] ?? []).filter((id) => id !== channelId);
  if (arr.length === 0) {
    delete s[guildId];
  } else {
    s[guildId] = arr;
  }
  writeStore();
}
