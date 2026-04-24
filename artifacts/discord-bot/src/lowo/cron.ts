import type { Client } from "discord.js";
import { allUsers, getLottery, updateLottery, getEvent, updateEvent, updateUser } from "./storage.js";
import { EVENTS } from "./data.js";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

let started = false;

export function startLowoCron(client: Client): void {
  if (started) return;
  started = true;

  // Run every 5 minutes — lightweight checks that pick up state changes.
  const tick = () => {
    try { runLotteryDraw(client); } catch (e) { console.error("[LOWO CRON] lottery", e); }
    try { runEventScheduler(); } catch (e) { console.error("[LOWO CRON] events", e); }
  };
  tick();
  setInterval(tick, 5 * 60 * 1000);
  console.log("[LOWO] Cron started (lottery + events).");
}

function runLotteryDraw(_client: Client): void {
  const lot = getLottery();
  const now = Date.now();
  // Draw once per 24h
  if (now - lot.lastDraw < DAY) return;
  if (!lot.tickets || lot.tickets.length === 0 || lot.pot <= 0) {
    updateLottery((l) => { l.lastDraw = now; });
    return;
  }
  // Weighted random by ticket count
  const totalTickets = lot.tickets.reduce((a, t) => a + t.count, 0);
  if (totalTickets <= 0) {
    updateLottery((l) => { l.lastDraw = now; l.tickets = []; l.pot = 0; });
    return;
  }
  let roll = Math.floor(Math.random() * totalTickets);
  let winnerId: string | null = null;
  for (const t of lot.tickets) {
    if (roll < t.count) { winnerId = t.userId; break; }
    roll -= t.count;
  }
  if (!winnerId) winnerId = lot.tickets[0].userId;
  const prize = lot.pot;
  updateUser(winnerId, (x) => { x.cowoncy += prize; x.lotteryTickets = 0; });
  // Reset pot + clear all tickets
  updateLottery((l) => { l.pot = 0; l.tickets = []; l.lastDraw = now; });
  // Reset lotteryTickets count on every user
  const users = allUsers();
  for (const id of Object.keys(users)) {
    if (id === winnerId) continue;
    if (users[id].lotteryTickets > 0) updateUser(id, (x) => { x.lotteryTickets = 0; });
  }
  console.log(`[LOWO LOTTERY] Drew ${winnerId} → ${prize} cowoncy.`);
}

function runEventScheduler(): void {
  const ev = getEvent();
  const now = Date.now();
  // Expire current event
  if (ev.id && now > ev.until) {
    updateEvent((e) => { e.id = null; e.until = 0; });
    console.log(`[LOWO EVENT] Expired.`);
  }
  // Roll a new event ~every 4 hours when none active (25% chance per tick)
  if (!ev.id && Math.random() < 0.10) {
    const pick = EVENTS[Math.floor(Math.random() * EVENTS.length)];
    updateEvent((e) => { e.id = pick.id; e.until = now + pick.durationMs; });
    console.log(`[LOWO EVENT] Started ${pick.id} for ${pick.durationMs / 60000}m.`);
  }
}
