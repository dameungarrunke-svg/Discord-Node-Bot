import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, "../../../../data");
const FILE = resolve(DATA_DIR, "censor.json");

export interface GuildCensorConfig {
  enabled: boolean;
  modLogChannelId: string | null;
}

export interface UserFlagRecord {
  count: number;           // total flags (resets after timeout served)
  lastFlag: string;        // ISO timestamp
  totalLifetime: number;   // never resets — lifetime stat
}

interface CensorData {
  guilds: Record<string, GuildCensorConfig>;
  flags: Record<string, UserFlagRecord>; // key = "guildId:userId"
}

function load(): CensorData {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(FILE)) {
    const empty: CensorData = { guilds: {}, flags: {} };
    writeFileSync(FILE, JSON.stringify(empty, null, 2));
    return empty;
  }
  try {
    return JSON.parse(readFileSync(FILE, "utf-8")) as CensorData;
  } catch {
    return { guilds: {}, flags: {} };
  }
}

function save(data: CensorData): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(FILE, JSON.stringify(data, null, 2));
}

// ── Guild config ──────────────────────────────────────────────────────────────

export function getCensorConfig(guildId: string): GuildCensorConfig {
  const data = load();
  return data.guilds[guildId] ?? { enabled: false, modLogChannelId: null };
}

export function setCensorConfig(guildId: string, patch: Partial<GuildCensorConfig>): void {
  const data = load();
  data.guilds[guildId] = { ...getCensorConfig(guildId), ...patch };
  save(data);
}

export function isCensorEnabled(guildId: string): boolean {
  return getCensorConfig(guildId).enabled;
}

// ── User flags ────────────────────────────────────────────────────────────────

function flagKey(guildId: string, userId: string): string {
  return `${guildId}:${userId}`;
}

export function getUserFlags(guildId: string, userId: string): UserFlagRecord {
  const data = load();
  return (
    data.flags[flagKey(guildId, userId)] ?? {
      count: 0,
      lastFlag: new Date().toISOString(),
      totalLifetime: 0,
    }
  );
}

/** Increment flag count and return the NEW count. */
export function incrementFlag(guildId: string, userId: string): number {
  const data = load();
  const key = flagKey(guildId, userId);
  const existing = data.flags[key] ?? { count: 0, lastFlag: "", totalLifetime: 0 };
  existing.count += 1;
  existing.totalLifetime += 1;
  existing.lastFlag = new Date().toISOString();
  data.flags[key] = existing;
  save(data);
  return existing.count;
}

/** Reset active flag count (e.g. after timeout served). Lifetime stays. */
export function resetFlags(guildId: string, userId: string): void {
  const data = load();
  const key = flagKey(guildId, userId);
  if (data.flags[key]) {
    data.flags[key].count = 0;
  }
  save(data);
}
