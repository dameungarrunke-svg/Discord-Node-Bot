import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, "../../../data");
const FILE = resolve(DATA_DIR, "rules.json");

export interface RulesMessage {
  guildId: string;
  channelId: string;
  messageId: string;
}

interface RulesData {
  messages: RulesMessage[];
}

function load(): RulesData {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(FILE)) {
    writeFileSync(FILE, JSON.stringify({ messages: [] }, null, 2));
    return { messages: [] };
  }
  try {
    return JSON.parse(readFileSync(FILE, "utf-8")) as RulesData;
  } catch {
    return { messages: [] };
  }
}

function save(data: RulesData): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(FILE, JSON.stringify(data, null, 2));
}

export function getRulesMessage(guildId: string): RulesMessage | undefined {
  return load().messages.find((m) => m.guildId === guildId);
}

export function setRulesMessage(entry: RulesMessage): void {
  const data = load();
  const idx = data.messages.findIndex((m) => m.guildId === entry.guildId);
  if (idx >= 0) {
    data.messages[idx] = entry;
  } else {
    data.messages.push(entry);
  }
  save(data);
}
