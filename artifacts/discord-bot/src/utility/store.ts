import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, "../../../data");
const FILE = resolve(DATA_DIR, "utility.json");

export interface WarnEntry {
  id: string;
  userId: string;
  userTag: string;
  moderatorId: string;
  moderatorTag: string;
  reason: string;
  timestamp: string;
  guildId: string;
}

export interface PromotionEntry {
  id: string;
  userId: string;
  userTag: string;
  moderatorId: string;
  moderatorTag: string;
  type: "promote" | "demote";
  newRank: string;
  timestamp: string;
  guildId: string;
}

export interface AttendanceEntry {
  id: string;
  userId: string;
  userTag: string;
  event: string;
  markedById: string;
  markedByTag: string;
  timestamp: string;
  guildId: string;
}

export interface MvpEntry {
  id: string;
  userId: string;
  userTag: string;
  event: string;
  reason: string;
  awardedById: string;
  awardedByTag: string;
  timestamp: string;
  guildId: string;
}

interface UtilityData {
  warns: WarnEntry[];
  promotions: PromotionEntry[];
  attendances: AttendanceEntry[];
  mvps: MvpEntry[];
}

function load(): UtilityData {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(FILE)) {
    const empty: UtilityData = { warns: [], promotions: [], attendances: [], mvps: [] };
    writeFileSync(FILE, JSON.stringify(empty, null, 2));
    return empty;
  }
  try {
    return JSON.parse(readFileSync(FILE, "utf-8")) as UtilityData;
  } catch {
    return { warns: [], promotions: [], attendances: [], mvps: [] };
  }
}

function save(data: UtilityData): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(FILE, JSON.stringify(data, null, 2));
}

export function addWarn(entry: WarnEntry): void {
  const data = load();
  data.warns.push(entry);
  save(data);
}

export function getWarns(userId: string, guildId: string): WarnEntry[] {
  return load().warns.filter((w) => w.userId === userId && w.guildId === guildId);
}

export function addPromotion(entry: PromotionEntry): void {
  const data = load();
  data.promotions.push(entry);
  save(data);
}

export function addAttendance(entry: AttendanceEntry): void {
  const data = load();
  data.attendances.push(entry);
  save(data);
}

export function addMvp(entry: MvpEntry): void {
  const data = load();
  data.mvps.push(entry);
  save(data);
}
