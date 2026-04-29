import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = resolve(__dirname, "../../data");
const FILE = join(DATA_DIR, "lowo_channels.json");

/**
 * whitelistMode: guild IDs that have ever called "lowo enable all".
 *   Once a guild enters whitelist mode it NEVER leaves it automatically.
 *   An empty channels list + whitelistMode = total silence (only bypass cmds work).
 *
 * channels: the actual per-guild allow-list.
 */
interface State {
  whitelistMode: string[];
  channels: Record<string, string[]>;
}

let cache: State | null = null;

function readStore(): State {
  if (cache) return cache;
  try {
    if (existsSync(FILE)) {
      const raw = JSON.parse(readFileSync(FILE, "utf-8")) as Partial<State>;
      cache = {
        whitelistMode: raw.whitelistMode ?? [],
        channels: raw.channels ?? {},
      };
    }
  } catch { /* fallthrough */ }
  if (!cache) cache = { whitelistMode: [], channels: {} };
  return cache;
}

function writeStore(): void {
  if (!cache) return;
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(FILE, JSON.stringify(cache, null, 2), "utf-8");
}

/**
 * Returns true if Lowo should respond in this channel.
 *
 * Rules:
 *  - Guild NOT in whitelistMode → always allowed (no restrictions configured yet).
 *  - Guild IN whitelistMode     → allowed only if channelId is in the list.
 *    An empty list means the guild is in full-silence mode.
 */
export function isChannelAllowed(guildId: string | null, channelId: string): boolean {
  if (!guildId) return true;
  const s = readStore();
  if (!s.whitelistMode.includes(guildId)) return true; // no restrictions configured
  return (s.channels[guildId] ?? []).includes(channelId);
}

/** Returns the current allow-list for a guild (may be empty). */
export function getChannelList(guildId: string): string[] {
  return readStore().channels[guildId] ?? [];
}

/** Returns true if the guild has ever enabled the whitelist. */
export function isWhitelistMode(guildId: string): boolean {
  return readStore().whitelistMode.includes(guildId);
}

/**
 * Enables the current channel for a guild.
 * Also marks the guild as being in whitelistMode (irreversible).
 */
export function enableChannel(guildId: string, channelId: string): void {
  const s = readStore();
  if (!s.whitelistMode.includes(guildId)) s.whitelistMode.push(guildId);
  const set = new Set(s.channels[guildId] ?? []);
  set.add(channelId);
  s.channels[guildId] = Array.from(set);
  writeStore();
}

/**
 * Removes a channel from the allow-list.
 * Also marks the guild as being in whitelistMode so that an empty list
 * means full silence (not "unconfigured / allow everywhere").
 */
export function disableChannel(guildId: string, channelId: string): void {
  const s = readStore();
  if (!s.whitelistMode.includes(guildId)) s.whitelistMode.push(guildId);
  s.channels[guildId] = (s.channels[guildId] ?? []).filter((id) => id !== channelId);
  writeStore();
}
