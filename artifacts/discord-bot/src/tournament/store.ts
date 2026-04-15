import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, "../../../data");
const DATA_FILE = resolve(DATA_DIR, "tournaments.json");

export interface TournamentParticipant {
  userId: string;
  userTag: string;
  joinedAt: string;
}

export interface TournamentData {
  id: string;
  guildId: string;
  channelId: string;
  messageId: string;
  about: string;
  rules: string;
  gameLink: string;
  prize: string;
  pingRoleId: string;
  tournamentDate: string;
  tournamentTime: string;
  hostId: string;
  hostTag: string;
  maxParticipants: number;
  entryRequirement: string;
  notes?: string;
  registrationDeadline?: string;
  closed?: boolean;
  createdById: string;
  createdByTag: string;
  createdAt: string;
  participants: TournamentParticipant[];
}

interface TournamentStore {
  counter: number;
  tournaments: TournamentData[];
}

function emptyStore(): TournamentStore {
  return { counter: 0, tournaments: [] };
}

function load(): TournamentStore {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(DATA_FILE)) {
    const data = emptyStore();
    writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    return data;
  }

  try {
    const parsed = JSON.parse(readFileSync(DATA_FILE, "utf-8")) as Partial<TournamentStore>;
    return {
      counter: parsed.counter ?? 0,
      tournaments: parsed.tournaments ?? [],
    };
  } catch {
    return emptyStore();
  }
}

function save(data: TournamentStore): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

export function nextTournamentId(): string {
  const data = load();
  data.counter += 1;
  save(data);
  return `LS-${data.counter.toString().padStart(4, "0")}`;
}

export function saveTournament(tournament: TournamentData): void {
  const data = load();
  const index = data.tournaments.findIndex((item) => item.id === tournament.id);
  if (index >= 0) {
    data.tournaments[index] = tournament;
  } else {
    data.tournaments.push(tournament);
  }
  save(data);
}

export function getTournament(id: string): TournamentData | undefined {
  return load().tournaments.find((item) => item.id === id);
}

export function closeTournament(id: string): TournamentData | undefined {
  const data = load();
  const tournament = data.tournaments.find((item) => item.id === id);
  if (!tournament) return undefined;

  tournament.closed = true;
  save(data);
  return tournament;
}

export function addTournamentParticipant(
  id: string,
  participant: TournamentParticipant
): "joined" | "duplicate" | "full" | "missing" {
  const data = load();
  const tournament = data.tournaments.find((item) => item.id === id);
  if (!tournament) return "missing";
  if (tournament.participants.some((item) => item.userId === participant.userId)) return "duplicate";
  if (tournament.participants.length >= tournament.maxParticipants) return "full";

  tournament.participants.push(participant);
  save(data);
  return "joined";
}

export function removeTournamentParticipant(id: string, userId: string): "left" | "not_joined" | "missing" {
  const data = load();
  const tournament = data.tournaments.find((item) => item.id === id);
  if (!tournament) return "missing";

  const before = tournament.participants.length;
  tournament.participants = tournament.participants.filter((item) => item.userId !== userId);
  if (tournament.participants.length === before) return "not_joined";

  save(data);
  return "left";
}