import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_PATH = path.join(__dirname, "../../data/leveling.json");

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserData {
  xp: number;
  level: number;
  totalXp: number;
  weeklyXp: number;
  lastMessageAt: number;
  lastMessageContent: string;
}

export interface GuildConfig {
  enabled: boolean;
  xpMin: number;
  xpMax: number;
  cooldown: number;
  levelUpChannelId: string | null;
  announcements: boolean;
  pingOnLevelUp: boolean;
  keepOldRoles: boolean;
  blacklistedChannels: string[];
  whitelistedChannels: string[];
  serverMultiplier: number;
  roleMultipliers: Record<string, number>;
  eventMultiplier: number;
}

export interface WeeklyHistoryEntry {
  week: string;
  guildId: string;
  winners: Array<{ userId: string; weeklyXp: number }>;
}

export interface LevelingData {
  configs: Record<string, GuildConfig>;
  users: Record<string, Record<string, UserData>>;
  levelRoles: Record<string, Record<string, string>>;
  lastWeeklyReset: number;
  weeklyHistory: WeeklyHistoryEntry[];
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

export const DEFAULT_CONFIG: GuildConfig = {
  enabled: true,
  xpMin: 15,
  xpMax: 25,
  cooldown: 60,
  levelUpChannelId: null,
  announcements: true,
  pingOnLevelUp: true,
  keepOldRoles: true,
  blacklistedChannels: [],
  whitelistedChannels: [],
  serverMultiplier: 1.0,
  roleMultipliers: {},
  eventMultiplier: 1.0,
};

export const DEFAULT_LEVEL_ROLES: Record<string, string> = {
  "5": "Rookie",
  "10": "Experienced",
  "15": "Active",
  "20": "Elite",
  "25": "Elite Active",
  "30": "Elite official member",
  "35": "Monarch",
  "40": "Divine general",
  "45": "Mystic",
  "50": "King 👑",
};

// ─── In-memory cache ──────────────────────────────────────────────────────────

let _data: LevelingData | null = null;
let _dirty = false;
let _saveTimer: ReturnType<typeof setTimeout> | null = null;

function ensureDir(): void {
  const dir = path.dirname(DATA_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function load(): LevelingData {
  if (_data) return _data;
  try {
    if (fs.existsSync(DATA_PATH)) {
      _data = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8")) as LevelingData;
    }
  } catch (err) {
    console.error("[LEVELING] Failed to parse data file, starting fresh:", err);
  }
  if (!_data) {
    _data = { configs: {}, users: {}, levelRoles: {}, lastWeeklyReset: Date.now(), weeklyHistory: [] };
  }
  return _data;
}

function scheduleSave(): void {
  if (_saveTimer) return;
  _saveTimer = setTimeout(() => {
    _saveTimer = null;
    if (_dirty && _data) {
      try {
        ensureDir();
        fs.writeFileSync(DATA_PATH, JSON.stringify(_data, null, 2), "utf-8");
        _dirty = false;
      } catch (err) {
        console.error("[LEVELING] Save failed:", err);
      }
    }
  }, 1500);
}

function markDirty(): void {
  _dirty = true;
  scheduleSave();
}

// ─── Config ───────────────────────────────────────────────────────────────────

export function getGuildConfig(guildId: string): GuildConfig {
  const d = load();
  if (!d.configs[guildId]) {
    d.configs[guildId] = { ...DEFAULT_CONFIG, blacklistedChannels: [], whitelistedChannels: [], roleMultipliers: {} };
    markDirty();
  }
  return d.configs[guildId];
}

export function patchGuildConfig(guildId: string, patch: Partial<GuildConfig>): void {
  const d = load();
  if (!d.configs[guildId]) d.configs[guildId] = { ...DEFAULT_CONFIG, blacklistedChannels: [], whitelistedChannels: [], roleMultipliers: {} };
  Object.assign(d.configs[guildId], patch);
  markDirty();
}

// ─── Level Roles ──────────────────────────────────────────────────────────────

export function getGuildLevelRoles(guildId: string): Record<string, string> {
  const d = load();
  if (!d.levelRoles[guildId]) {
    d.levelRoles[guildId] = { ...DEFAULT_LEVEL_ROLES };
    markDirty();
  }
  return d.levelRoles[guildId];
}

export function setLevelRole(guildId: string, level: number, roleName: string): void {
  const d = load();
  if (!d.levelRoles[guildId]) d.levelRoles[guildId] = { ...DEFAULT_LEVEL_ROLES };
  d.levelRoles[guildId][String(level)] = roleName;
  markDirty();
}

export function removeLevelRole(guildId: string, level: number): boolean {
  const d = load();
  if (!d.levelRoles[guildId] || !d.levelRoles[guildId][String(level)]) return false;
  delete d.levelRoles[guildId][String(level)];
  markDirty();
  return true;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export function getUser(guildId: string, userId: string): UserData {
  const d = load();
  if (!d.users[guildId]) d.users[guildId] = {};
  if (!d.users[guildId][userId]) {
    d.users[guildId][userId] = { xp: 0, level: 0, totalXp: 0, weeklyXp: 0, lastMessageAt: 0, lastMessageContent: "" };
  }
  return d.users[guildId][userId];
}

export function saveUser(guildId: string, userId: string, user: UserData): void {
  const d = load();
  if (!d.users[guildId]) d.users[guildId] = {};
  d.users[guildId][userId] = user;
  markDirty();
}

export function getAllUsers(guildId: string): Array<{ userId: string } & UserData> {
  const d = load();
  return Object.entries(d.users[guildId] ?? {}).map(([userId, u]) => ({ userId, ...u }));
}

export function resetUser(guildId: string, userId: string): void {
  const d = load();
  if (!d.users[guildId]) d.users[guildId] = {};
  d.users[guildId][userId] = { xp: 0, level: 0, totalXp: 0, weeklyXp: 0, lastMessageAt: 0, lastMessageContent: "" };
  markDirty();
}

export function modifyUserXp(guildId: string, userId: string, deltaOrAbsolute: number, mode: "add" | "remove" | "set"): UserData {
  const d = load();
  if (!d.users[guildId]) d.users[guildId] = {};
  const user = getUser(guildId, userId);
  if (mode === "add") user.totalXp = Math.max(0, user.totalXp + deltaOrAbsolute);
  else if (mode === "remove") user.totalXp = Math.max(0, user.totalXp - deltaOrAbsolute);
  else user.totalXp = Math.max(0, deltaOrAbsolute);
  d.users[guildId][userId] = user;
  markDirty();
  return user;
}

// ─── Weekly ───────────────────────────────────────────────────────────────────

export function getLastWeeklyReset(): number {
  return load().lastWeeklyReset;
}

export function setLastWeeklyReset(ts: number): void {
  load().lastWeeklyReset = ts;
  markDirty();
}

export function resetWeeklyXp(guildId: string): void {
  const d = load();
  if (!d.users[guildId]) return;
  for (const u of Object.values(d.users[guildId])) u.weeklyXp = 0;
  markDirty();
}

export function recordWeeklyHistory(entry: WeeklyHistoryEntry): void {
  const d = load();
  d.weeklyHistory.push(entry);
  if (d.weeklyHistory.length > 104) d.weeklyHistory = d.weeklyHistory.slice(-104);
  markDirty();
}

export function flushSync(): void {
  if (_data) {
    try {
      ensureDir();
      fs.writeFileSync(DATA_PATH, JSON.stringify(_data, null, 2), "utf-8");
      _dirty = false;
    } catch (err) {
      console.error("[LEVELING] flushSync failed:", err);
    }
  }
}
