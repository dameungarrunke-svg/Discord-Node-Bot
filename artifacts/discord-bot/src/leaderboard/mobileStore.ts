import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, "../../../data");
const DATA_FILE = resolve(DATA_DIR, "mobile-leaderboard.json");

export type StageRank =
  | "High Strong"
  | "High Stable"
  | "Mid Strong"
  | "Mid Stable"
  | "Weak Stable";

export const STAGE_RANKS: StageRank[] = [
  "High Strong",
  "High Stable",
  "Mid Strong",
  "Mid Stable",
  "Weak Stable",
];

export const STAGE_RANK_COLORS: Record<StageRank, number> = {
  "High Strong": 0xffd700,
  "High Stable": 0xf39c12,
  "Mid Strong": 0x3498db,
  "Mid Stable": 0x9b59b6,
  "Weak Stable": 0x95a5a6,
};

export const STAGE_RANK_EMOJI: Record<StageRank, string> = {
  "High Strong": "🏆",
  "High Stable": "🥇",
  "Mid Strong": "🥈",
  "Mid Stable": "🥉",
  "Weak Stable": "⚔️",
};

export interface LeaderboardPlayer {
  position: number;
  displayName: string;
  robloxUsername: string;
  discordUsername: string;
  country: string;
  avatarUrl: string;
  stageRank: StageRank;
}

export interface PinnedMessage {
  guildId: string;
  channelId: string;
  messageId: string;
}

interface LeaderboardData {
  players: LeaderboardPlayer[];
  pinnedMessage?: PinnedMessage;
}

function load(): LeaderboardData {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(DATA_FILE)) {
    writeFileSync(DATA_FILE, JSON.stringify({ players: [] }, null, 2));
    return { players: [] };
  }
  try {
    return JSON.parse(readFileSync(DATA_FILE, "utf-8")) as LeaderboardData;
  } catch {
    return { players: [] };
  }
}

function save(data: LeaderboardData): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

export function getMobilePlayers(): LeaderboardPlayer[] {
  return load().players.sort((a, b) => a.position - b.position);
}

export function addMobilePlayer(player: LeaderboardPlayer): void {
  const data = load();
  data.players.push(player);
  data.players.sort((a, b) => a.position - b.position);
  save(data);
}

export function removeMobilePlayerByPosition(position: number): boolean {
  const data = load();
  const before = data.players.length;
  data.players = data.players.filter((p) => p.position !== position);
  save(data);
  return data.players.length < before;
}

export function editMobilePlayer(
  position: number,
  updates: Partial<LeaderboardPlayer>
): boolean {
  const data = load();
  const idx = data.players.findIndex((p) => p.position === position);
  if (idx === -1) return false;
  data.players[idx] = { ...data.players[idx], ...updates };
  data.players.sort((a, b) => a.position - b.position);
  save(data);
  return true;
}

export function mobilePlayerExistsAtPosition(position: number): boolean {
  return load().players.some((p) => p.position === position);
}

export function getMobilePinnedMessage(): PinnedMessage | undefined {
  return load().pinnedMessage;
}

export function setMobilePinnedMessage(pinned: PinnedMessage): void {
  const data = load();
  data.pinnedMessage = pinned;
  save(data);
}

export function clearMobilePinnedMessage(): void {
  const data = load();
  delete data.pinnedMessage;
  save(data);
}
