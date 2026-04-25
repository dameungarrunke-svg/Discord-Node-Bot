import type { Message } from "discord.js";
import { getUser, updateUser } from "./storage.js";
import { emoji } from "./emojis.js";

const DAILY_AMOUNT = 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const STREAK_WINDOW_MS = 48 * 60 * 60 * 1000; // claim within 48h to keep streak

export async function cmdCowoncy(message: Message, args: string[]): Promise<void> {
  const target = message.mentions.users.first() ?? message.author;
  const u = getUser(target.id);
  await message.reply(`${emoji("cowoncy")} **${target.username}** has **${u.cowoncy.toLocaleString()}** cowoncy and **${u.essence.toLocaleString()}** ${emoji("essence")} essence.`);
}

// Premium currency balance
export async function cmdCash(message: Message): Promise<void> {
  const target = message.mentions.users.first() ?? message.author;
  const u = getUser(target.id);
  await message.reply(
    `${emoji("cash")} **${target.username}** has **${u.lowoCash.toLocaleString()}** Lowo Cash *(premium currency)*.\n` +
    `_Earn +1 every 50 hunts. Spend it in \`lowo shop premium\`._`,
  );
}

export async function cmdDaily(message: Message): Promise<void> {
  const u = getUser(message.author.id);
  const now = Date.now();
  if (now - u.lastDaily < DAY_MS) {
    const left = DAY_MS - (now - u.lastDaily);
    const h = Math.floor(left / 3600000);
    const m = Math.floor((left % 3600000) / 60000);
    await message.reply(`${emoji("clock")} Daily already claimed. Come back in **${h}h ${m}m**.`);
    return;
  }

  // Streak: continued if claimed within 48h (1 missed day breaks it)
  const continued = u.lastDaily > 0 && (now - u.lastDaily) <= STREAK_WINDOW_MS;
  const newStreak = continued ? u.dailyStreak + 1 : 1;

  // Streak multiplier: +5% per consecutive day after the first, capped at +100% (day 21)
  const bonusPct = Math.min(1.0, (newStreak - 1) * 0.05);
  const reward = Math.floor(DAILY_AMOUNT * (1 + bonusPct));

  // Milestone bonuses
  let milestone = 0;
  if (newStreak === 7)  milestone = 2000;
  if (newStreak === 14) milestone = 5000;
  if (newStreak === 30) milestone = 15000;
  if (newStreak === 60) milestone = 40000;
  if (newStreak === 100) milestone = 100000;

  const total = reward + milestone;
  updateUser(message.author.id, (x) => {
    x.cowoncy += total;
    x.lastDaily = now;
    x.dailyStreak = newStreak;
  });

  const lines = [
    `${emoji("daily")} Daily claimed: **+${reward.toLocaleString()}** cowoncy`,
    `${emoji("streak")} Streak: **${newStreak} day${newStreak === 1 ? "" : "s"}** *(+${Math.round(bonusPct * 100)}% bonus)*`,
  ];
  if (milestone) lines.push(`${emoji("rank")} **Milestone bonus:** +${milestone.toLocaleString()} cowoncy!`);
  if (!continued && u.dailyStreak > 1) lines.push(`${emoji("divorce")} (Previous streak of ${u.dailyStreak} reset — claim within 48h next time.)`);
  await message.reply(lines.join("\n"));
}

export async function cmdGive(message: Message, args: string[]): Promise<void> {
  const target = message.mentions.users.first();
  const amountStr = args.find(a => /^\d+$/.test(a));
  if (!target || !amountStr) {
    await message.reply("Usage: `lowo give @user <amount>`");
    return;
  }
  if (target.id === message.author.id) { await message.reply(`${emoji("fail")} You can't give to yourself.`); return; }
  if (target.bot) { await message.reply(`${emoji("fail")} Bots don't need cowoncy.`); return; }
  const amount = parseInt(amountStr, 10);
  if (amount <= 0) { await message.reply(`${emoji("fail")} Amount must be positive.`); return; }
  const sender = getUser(message.author.id);
  if (sender.cowoncy < amount) { await message.reply(`${emoji("fail")} You only have ${sender.cowoncy} cowoncy.`); return; }
  updateUser(message.author.id, (x) => { x.cowoncy -= amount; });
  updateUser(target.id, (x) => { x.cowoncy += amount; });
  await message.reply(`${emoji("give")} Sent **${amount}** cowoncy to **${target.username}**.`);
}

export async function cmdVote(message: Message): Promise<void> {
  updateUser(message.author.id, (x) => { x.cowoncy += 250; });
  await message.reply(`${emoji("vote")} Thanks for voting! +**250** cowoncy. (Hook a real bot-list webhook for live tracking.)`);
}

// ─── Reputation ───────────────────────────────────────────────────────────────
const REP_COOLDOWN_MS = 24 * 60 * 60 * 1000;
export async function cmdRep(message: Message): Promise<void> {
  const target = message.mentions.users.first();
  if (!target) { await message.reply("Usage: `lowo rep @user`"); return; }
  if (target.id === message.author.id) { await message.reply("❌ Can't rep yourself."); return; }
  if (target.bot) { await message.reply("❌ Can't rep bots."); return; }
  const me = getUser(message.author.id);
  const now = Date.now();
  const left = REP_COOLDOWN_MS - (now - me.lastRep);
  if (left > 0) {
    const h = Math.floor(left / 3600000);
    const m = Math.floor((left % 3600000) / 60000);
    await message.reply(`⏳ You can give rep again in **${h}h ${m}m**.`);
    return;
  }
  updateUser(message.author.id, (x) => { x.lastRep = now; });
  updateUser(target.id, (x) => { x.rep += 1; });
  const them = getUser(target.id);
  await message.reply(`⭐ **${message.author.username}** gave rep to **${target.username}** — they now have **${them.rep}** rep!`);
}

// ─── Tag (profile blurb) ──────────────────────────────────────────────────────
export async function cmdTag(message: Message, args: string[]): Promise<void> {
  const text = args.join(" ").trim();
  if (!text) {
    const u = getUser(message.author.id);
    await message.reply(u.tag ? `🏷️ Your tag: *"${u.tag}"*\nClear with \`lowo tag clear\`.` : "🏷️ No tag set. Try `lowo tag <text>` (max 60 chars).");
    return;
  }
  if (text.toLowerCase() === "clear" || text.toLowerCase() === "reset") {
    updateUser(message.author.id, (x) => { x.tag = null; });
    await message.reply("🏷️ Tag cleared.");
    return;
  }
  const clean = text.slice(0, 60);
  updateUser(message.author.id, (x) => { x.tag = clean; });
  await message.reply(`🏷️ Tag set to: *"${clean}"*`);
}
