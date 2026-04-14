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
  result: string;
  topPerformers: string;
  notes: string;
  endedBy: string;
  endedById: string;
  timestamp: string;
  guildId: string;
  raidNumber: number;
}

interface RaidsData {
  results: RaidResult[];
  counter: number;
}

function load(): RaidsData {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(FILE)) {
    writeFileSync(FILE, JSON.stringify({ results: [], counter: 0 }, null, 2));
    return { results: [], counter: 0 };
  }
  try {
    const parsed = JSON.parse(readFileSync(FILE, "utf-8")) as Partial<RaidsData>;
    return {
      results: parsed.results ?? [],
      counter: parsed.counter ?? 0,
    };
  } catch {
    return { results: [], counter: 0 };
  }
}

function save(data: RaidsData): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(FILE, JSON.stringify(data, null, 2));
}

export function nextRaidNumber(): number {
  const data = load();
  data.counter += 1;
  save(data);
  return data.counter;
}

export function saveRaidResult(result: RaidResult): void {
  const data = load();
  data.results.push(result);
  save(data);
}

export function getRaidResults(guildId: string): RaidResult[] {
  return load().results.filter((r) => r.guildId === guildId);
}
