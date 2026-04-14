import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, "../../../data");
const FILE = resolve(DATA_DIR, "raids.json");

export interface RaidResult {
  id: string;
  clanName: string;
  opponentClan: string;
  result: "Win" | "Loss" | "Draw";
  topPerformers: string;
  notes: string;
  endedBy: string;
  endedById: string;
  timestamp: string;
  guildId: string;
}

interface RaidsData {
  results: RaidResult[];
}

function load(): RaidsData {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(FILE)) {
    writeFileSync(FILE, JSON.stringify({ results: [] }, null, 2));
    return { results: [] };
  }
  try {
    return JSON.parse(readFileSync(FILE, "utf-8")) as RaidsData;
  } catch {
    return { results: [] };
  }
}

function save(data: RaidsData): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(FILE, JSON.stringify(data, null, 2));
}

export function saveRaidResult(result: RaidResult): void {
  const data = load();
  data.results.push(result);
  save(data);
}

export function getRaidResults(guildId: string): RaidResult[] {
  return load().results.filter((r) => r.guildId === guildId);
}
