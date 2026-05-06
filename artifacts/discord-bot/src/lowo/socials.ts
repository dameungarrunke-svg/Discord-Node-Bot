import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = resolve(__dirname, "../../data");
const FILE = join(DATA_DIR, "lowo_socials.json");

// Guilds stored here have socials DISABLED. Default = socials ON.
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

export function isSocialsEnabled(guildId: string | null): boolean {
  if (!guildId) return true;
  return !read().guilds.includes(guildId);
}

export function setSocialsEnabled(guildId: string, on: boolean): void {
  const s = read();
  const set = new Set(s.guilds);
  if (!on) set.add(guildId); else set.delete(guildId);
  s.guilds = Array.from(set);
  write();
}
