import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = resolve(__dirname, "../../data");
const FILE = join(DATA_DIR, "fun_toggle.json");

interface ToggleState { enabled: boolean }

function readState(): ToggleState {
  try {
    if (!existsSync(FILE)) return { enabled: true };
    const raw = readFileSync(FILE, "utf-8");
    const parsed = JSON.parse(raw) as Partial<ToggleState>;
    return { enabled: parsed.enabled !== false };
  } catch {
    return { enabled: true };
  }
}

function writeState(state: ToggleState): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(FILE, JSON.stringify(state, null, 2), "utf-8");
}

let cached: ToggleState | null = null;

export function isFunEnabled(): boolean {
  if (!cached) cached = readState();
  return cached.enabled;
}

export function setFunEnabled(enabled: boolean): void {
  cached = { enabled };
  writeState(cached);
}
