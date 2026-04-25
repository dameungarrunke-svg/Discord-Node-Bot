import type { Message } from "discord.js";
import { getEvent } from "./storage.js";
import { EVENT_BY_ID, type LowoEvent } from "./data.js";

export function activeEvent(): LowoEvent | null {
  const ev = getEvent();
  if (!ev.id || Date.now() > ev.until) return null;
  return EVENT_BY_ID[ev.id] ?? null;
}

// Map of eventId -> bonusKey -> numeric multiplier. Anything missing returns 1
// so callers can safely chain `eventBonus("foo")` without checking event id first.
const BONUS_MAP: Record<string, Record<string, number>> = {
  double_hunt:    { hunt: 2 },
  rare_rush:      { rare: 3 },
  essence_storm:  { essence: 2 },
  battle_frenzy:  { battle: 2 },
  cowoncy_event:  { cowoncy: 2 },
  mineral_rush:   { mineral_rush: 2 },
  lucky_skies:    { luck: 1.5 },
  blood_moon:     { blood_moon: 1.5, battle: 1.5 },
  boss_invasion:  { boss_invasion: 4 },
  crafting_surge: { crafting_surge: 2 },
  skill_storm:    { skill_storm: 0.5 },
  void_breach:    { void_breach: 4 },
  secret_whisper: { secret_whisper: 100 },
  shop_sale:      { shop_sale: 0.8 },
  xp_bonanza:     { xp_bonanza: 2 },
};

export function eventBonus(kind: string): number {
  const ev = activeEvent();
  if (!ev) return 1;
  return BONUS_MAP[ev.id]?.[kind] ?? 1;
}

export async function cmdEvent(message: Message): Promise<void> {
  const ev = activeEvent();
  if (!ev) {
    await message.reply("🌙 No active global event right now. Check back later — they pop up randomly!");
    return;
  }
  const left = Math.max(0, getEvent().until - Date.now());
  const m = Math.floor(left / 60000);
  const s = Math.floor((left % 60000) / 1000);
  await message.reply([
    `${ev.emoji} **Global Event Active: ${ev.name}**`,
    `> ${ev.description}`,
    `⏳ Ends in **${m}m ${s}s**`,
  ].join("\n"));
}
