import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = resolve(__dirname, "../../data");
const FILE = join(DATA_DIR, "lowo_censor.json");

// Per-guild censor: when ON (default OFF), spicy/violent commands are blocked.
// Set of guild IDs with censor enabled.
interface State { guilds: string[] }

let cache: State | null = null;

function read(): State {
  if (cache) return cache;
  try {
    if (existsSync(FILE)) cache = JSON.parse(readFileSync(FILE, "utf-8")) as State;
  } catch { /* fallthrough */ }
  if (!cache) cache = { guilds: [] };
  return cache;
}

function write(): void {
  if (!cache) return;
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(FILE, JSON.stringify(cache, null, 2), "utf-8");
}

export function isCensored(guildId: string | null): boolean {
  if (!guildId) return false;
  return read().guilds.includes(guildId);
}

export function setCensored(guildId: string, on: boolean): void {
  const s = read();
  const set = new Set(s.guilds);
  if (on) set.add(guildId); else set.delete(guildId);
  s.guilds = Array.from(set);
  write();
}

// Commands that censor blocks when ON.
export const CENSORED_COMMANDS = new Set([
  "lewd", "kill", "bully", "slap", "punch", "bite", "curse",
]);
