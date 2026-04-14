import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, "../../../data");
const DATA_FILE = resolve(DATA_DIR, "kill-leaderboard.json");

export type KillStage = string;

export interface KillPlayer {
  rank: number;
  displayName: string;
  robloxUsername: string;
  discordUsername: string;
  position: string;
  killCount: number;
  stage: KillStage;
  avatarUrl: string;
}

export interface KillPinnedMessage {
  guildId: string;
  channelId: string;
  messageId: string;
}

interface KillLeaderboardData {
  players: KillPlayer[];
  pinnedMessage?: KillPinnedMessage;
}

function emptyData(): KillLeaderboardData {
  return { players: [] };
}

function normalize(data: KillLeaderboardData): KillLeaderboardData {
  return {
    ...data,
    players: [...(data.players ?? [])]
      .map((player) => {
        const legacyPlayer = player as KillPlayer & { country?: string; rolePosition?: string; position?: string };
        return {
          ...player,
          position: legacyPlayer.position ?? legacyPlayer.rolePosition ?? legacyPlayer.country ?? "Clan Member",
        };
      })
      .sort((a, b) => a.rank - b.rank || b.killCount - a.killCount),
  };
}

function load(): KillLeaderboardData {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(DATA_FILE)) {
    const data = emptyData();
    writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    return data;
  }

  try {
    return normalize(JSON.parse(readFileSync(DATA_FILE, "utf-8")) as KillLeaderboardData);
  } catch {
    return emptyData();
  }
}

function save(data: KillLeaderboardData): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(DATA_FILE, JSON.stringify(normalize(data), null, 2));
}

export function getKillPlayers(): KillPlayer[] {
  return load().players;
}

export function killPlayerExistsAtRank(rank: number): boolean {
  return load().players.some((p) => p.rank === rank);
}

export function addKillPlayer(player: KillPlayer): void {
  const data = load();
  data.players.push(player);
  save(data);
}

export function editKillPlayer(rank: number, updates: Partial<KillPlayer>): boolean {
  const data = load();
  const index = data.players.findIndex((p) => p.rank === rank);
  if (index === -1) return false;
  data.players[index] = { ...data.players[index], ...updates };
  save(data);
  return true;
}

export function removeKillPlayerByRank(rank: number): boolean {
  const data = load();
  const before = data.players.length;
  data.players = data.players.filter((p) => p.rank !== rank);
  save(data);
  return data.players.length < before;
}

export function moveKillPlayerRank(rank: number, newRank: number): boolean {
  const data = load();
  const index = data.players.findIndex((p) => p.rank === rank);
  if (index === -1) return false;

  data.players[index].rank = newRank;
  save(data);
  return true;
}

export function getKillPinnedMessage(): KillPinnedMessage | undefined {
  return load().pinnedMessage;
}

export function setKillPinnedMessage(pinned: KillPinnedMessage): void {
  const data = load();
  data.pinnedMessage = pinned;
  save(data);
}

export function clearKillPinnedMessage(): void {
  const data = load();
  delete data.pinnedMessage;
  save(data);
}