import type { Message } from "discord.js";
import { getUser, updateUser, getLottery, updateLottery } from "./storage.js";

const SLOT_SYMBOLS = ["🍒", "🍋", "🔔", "⭐", "💎", "🦊"];

export async function cmdSlots(message: Message, args: string[]): Promise<void> {
  const amt = parseInt(args[0] ?? "", 10);
  if (!amt || amt <= 0) { await message.reply("Usage: `lowo slots <amount>`"); return; }
  const u = getUser(message.author.id);
  if (u.cowoncy < amt) { await message.reply(`❌ Need ${amt}, you have ${u.cowoncy}.`); return; }
  const r = [SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
             SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
             SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)]];
  let mult = 0;
  if (r[0] === r[1] && r[1] === r[2]) mult = r[0] === "🦊" ? 10 : r[0] === "💎" ? 5 : 3;
  else if (r[0] === r[1] || r[1] === r[2] || r[0] === r[2]) mult = 1.5;
  const winnings = Math.floor(amt * mult);
  const delta = winnings - amt;
  updateUser(message.author.id, (x) => { x.cowoncy += delta; });
  await message.reply(`🎰 [ ${r.join(" | ")} ]\n${mult > 0 ? `🏆 You won **${winnings}** (net **+${delta}**)` : `💸 You lost **${amt}**`}`);
}

export async function cmdCoinflip(message: Message, args: string[]): Promise<void> {
  const side = args[0]?.toLowerCase();
  const amt = parseInt(args[1] ?? "", 10);
  if ((side !== "h" && side !== "t" && side !== "heads" && side !== "tails") || !amt || amt <= 0) {
    await message.reply("Usage: `lowo coinflip h|t <amount>`"); return;
  }
  const u = getUser(message.author.id);
  if (u.cowoncy < amt) { await message.reply(`❌ Need ${amt}.`); return; }
  const flip = Math.random() < 0.5 ? "h" : "t";
  const won = side.startsWith(flip);
  updateUser(message.author.id, (x) => { x.cowoncy += won ? amt : -amt; });
  await message.reply(`🪙 Landed on **${flip === "h" ? "Heads" : "Tails"}** — ${won ? `🏆 +${amt}` : `💸 -${amt}`}`);
}

// ─── Blackjack (single-shot, no double/split) ─────────────────────────────────
function drawCard(): number {
  const c = Math.floor(Math.random() * 13) + 1;
  return c === 1 ? 11 : c >= 10 ? 10 : c;
}
function dealHand(): number[] { return [drawCard(), drawCard()]; }
function score(h: number[]): number {
  let s = h.reduce((a, b) => a + b, 0);
  let aces = h.filter(c => c === 11).length;
  while (s > 21 && aces > 0) { s -= 10; aces--; }
  return s;
}

export async function cmdBlackjack(message: Message, args: string[]): Promise<void> {
  const amt = parseInt(args[0] ?? "", 10);
  if (!amt || amt <= 0) { await message.reply("Usage: `lowo blackjack <amount>`"); return; }
  const u = getUser(message.author.id);
  if (u.cowoncy < amt) { await message.reply(`❌ Need ${amt}.`); return; }
  const player = dealHand();
  const dealer = dealHand();
  // simple auto-play: hit until 17
  while (score(player) < 17) player.push(drawCard());
  while (score(dealer) < 17) dealer.push(drawCard());
  const ps = score(player), ds = score(dealer);
  let result = ""; let delta = 0;
  if (ps > 21) { result = "💥 Bust!"; delta = -amt; }
  else if (ds > 21 || ps > ds) { result = "🏆 Win!"; delta = amt; }
  else if (ps === ds) { result = "🤝 Push"; delta = 0; }
  else { result = "💸 Dealer wins"; delta = -amt; }
  updateUser(message.author.id, (x) => { x.cowoncy += delta; });
  await message.reply(`🃏 **You:** [${player.join(", ")}] = **${ps}**\n**Dealer:** [${dealer.join(", ")}] = **${ds}**\n${result} (${delta >= 0 ? "+" : ""}${delta})`);
}

export async function cmdLottery(message: Message, args: string[]): Promise<void> {
  const sub = args[0]?.toLowerCase();
  const lot = getLottery();
  if (!sub || sub === "info") {
    const totalTickets = lot.tickets.reduce((s, t) => s + t.count, 0);
    await message.reply(`🎟️ **Lottery Pot:** ${lot.pot} cowoncy\n🎫 Total tickets: ${totalTickets}\nBuy tickets: \`lowo lottery buy <count>\` (500 each)`);
    return;
  }
  if (sub === "buy") {
    const n = Math.max(1, parseInt(args[1] ?? "1", 10));
    const cost = n * 500;
    const u = getUser(message.author.id);
    if (u.cowoncy < cost) { await message.reply(`❌ Need ${cost} cowoncy.`); return; }
    updateUser(message.author.id, (x) => { x.cowoncy -= cost; x.lotteryTickets += n; });
    updateLottery((l) => {
      l.pot += cost;
      const existing = l.tickets.find(t => t.userId === message.author.id);
      if (existing) existing.count += n; else l.tickets.push({ userId: message.author.id, count: n });
    });
    await message.reply(`🎟️ Bought **${n}** tickets for ${cost} cowoncy.`);
    return;
  }
  await message.reply("Usage: `lowo lottery info|buy <n>`");
}

// Manual draw (admin or self-triggered for demo); a cron would run this daily
export async function drawLotteryWinner(): Promise<{ winnerId: string | null; pot: number }> {
  const l = getLottery();
  const total = l.tickets.reduce((s, t) => s + t.count, 0);
  if (total === 0 || l.pot === 0) return { winnerId: null, pot: 0 };
  let roll = Math.floor(Math.random() * total);
  let winnerId: string | null = null;
  for (const t of l.tickets) {
    if (roll < t.count) { winnerId = t.userId; break; }
    roll -= t.count;
  }
  const pot = l.pot;
  if (winnerId) updateUser(winnerId, (x) => { x.cowoncy += pot; x.lotteryTickets = 0; });
  updateLottery((lot) => { lot.pot = 0; lot.tickets = []; lot.lastDraw = Date.now(); });
  return { winnerId, pot };
}
