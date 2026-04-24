import type { Message } from "discord.js";
import { getEvent } from "./storage.js";
import { EVENT_BY_ID, type LowoEvent } from "./data.js";

export function activeEvent(): LowoEvent | null {
  const ev = getEvent();
  if (!ev.id || Date.now() > ev.until) return null;
  return EVENT_BY_ID[ev.id] ?? null;
}

export function eventBonus(kind: "hunt" | "rare" | "essence" | "battle"): number {
  const ev = activeEvent();
  if (!ev) return 1;
  if (kind === "hunt"    && ev.id === "double_hunt")    return 2;
  if (kind === "rare"    && ev.id === "rare_rush")      return 3;
  if (kind === "essence" && ev.id === "essence_storm")  return 2;
  if (kind === "battle"  && ev.id === "battle_frenzy")  return 2;
  return 1;
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
