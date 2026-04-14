import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, "../../../data");
const FILE = resolve(DATA_DIR, "training.json");

export interface TrainingLog {
  id: string;
  host: string;
  durationCompleted: string;
  mvp: string;
  notes: string;
  endedBy: string;
  endedById: string;
  timestamp: string;
  guildId: string;
  sessionNumber: number;
}

interface TrainingData {
  logs: TrainingLog[];
  counter: number;
}

function load(): TrainingData {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(FILE)) {
    writeFileSync(FILE, JSON.stringify({ logs: [], counter: 0 }, null, 2));
    return { logs: [], counter: 0 };
  }
  try {
    const parsed = JSON.parse(readFileSync(FILE, "utf-8")) as Partial<TrainingData>;
    return {
      logs: parsed.logs ?? [],
      counter: parsed.counter ?? 0,
    };
  } catch {
    return { logs: [], counter: 0 };
  }
}

function save(data: TrainingData): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(FILE, JSON.stringify(data, null, 2));
}

export function nextTrainingNumber(): number {
  const data = load();
  data.counter += 1;
  save(data);
  return data.counter;
}

export function saveTrainingLog(log: TrainingLog): void {
  const data = load();
  data.logs.push(log);
  save(data);
}

export function getTrainingLogs(guildId: string): TrainingLog[] {
  return load().logs.filter((l) => l.guildId === guildId);
}
