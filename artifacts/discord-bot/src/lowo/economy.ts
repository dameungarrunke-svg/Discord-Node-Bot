import type { Message } from "discord.js";
import { getUser, updateUser } from "./storage.js";
import { emoji } from "./emojis.js";
import {
  baseEmbed, replyEmbed, successEmbed, errorEmbed, warnEmbed, val, COLOR, statsGrid, progressBar,
} from "./embeds.js";

const DAILY_AMOUNT = 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const STREAK_WINDOW_MS = 48 * 60 * 60 * 1000; // claim within 48h to keep streak

export async function cmdCowoncy(message: Message, _args: string[]): Promise<void> {
  const target = message.mentions.users.first() ?? message.author;
  const u = getUser(target.id);
  const e = baseEmbed(message, COLOR.brand)
    .setAuthor({ name: `${target.username}'s Wallet`, iconURL: target.displayAvatarURL({ size: 128 }) })
    .setThumbnail(target.displayAvatarURL({ size: 256 }))
    .setTitle(`${emoji("cowoncy")} Balance`)
    .addFields(statsGrid({
      "🪙 Cowoncy":  u.cowoncy,
      "✨ Essence":  u.essence,
      "💎 Lowo Cash": u.lowoCash,
    }));
  await replyEmbed(message, e);
}

// Premium currency balance
export async function cmdCash(message: Message): Promise<void> {
  const target = message.mentions.users.first() ?? message.author;
  const u = getUser(target.id);
  const e = baseEmbed(message, COLOR.brand)
    .setAuthor({ name: `${target.username}'s Premium Wallet`, iconURL: target.displayAvatarURL({ size: 128 }) })
    .setThumbnail(target.displayAvatarURL({ size: 256 }))
    .setTitle(`${emoji("cash")} Lowo Cash`)
    .setDescription(`💎 **${target.username}** has ${val(u.lowoCash)} Lowo Cash *(premium currency)*.`)
    .addFields(
      { name: "How to earn", value: "+1 every **50 hunts**", inline: true },
      { name: "How to spend", value: "`lowo shop premium`", inline: true },
    );
  await replyEmbed(message, e);
}

export async function cmdDaily(message: Message): Promise<void> {
  const u = getUser(message.author.id);
  const now = Date.now();
  if (now - u.lastDaily < DAY_MS) {
    const left = DAY_MS - (now - u.lastDaily);
    const h = Math.floor(left / 3600000);
    const m = Math.floor((left % 3600000) / 60000);
    await replyEmbed(message, warnEmbed(message, "Daily Already Claimed",
      `Come back in **${h}h ${m}m** for your next reward.`));
    return;
  }

  // Streak: continued if claimed within 48h (1 missed day breaks it)
  const continued = u.lastDaily > 0 && (now - u.lastDaily) <= STREAK_WINDOW_MS;
  const newStreak = continued ? u.dailyStreak + 1 : 1;
  const bonusPct = Math.min(1.0, (newStreak - 1) * 0.05);
  const reward = Math.floor(DAILY_AMOUNT * (1 + bonusPct));

  let milestone = 0;
  if (newStreak === 7)   milestone = 2000;
  if (newStreak === 14)  milestone = 5000;
  if (newStreak === 30)  milestone = 15000;
  if (newStreak === 60)  milestone = 40000;
  if (newStreak === 100) milestone = 100000;

  const total = reward + milestone;
  updateUser(message.author.id, (x) => {
    x.cowoncy += total;
    x.lastDaily = now;
    x.dailyStreak = newStreak;
  });

  // Visual streak bar — 30-day cycle (every 30 days = visual reset)
  const streakInCycle = ((newStreak - 1) % 30) + 1;
  const e = successEmbed(message, "Daily Claimed!")
    .setDescription([
      `${emoji("daily")} +${val(reward)} cowoncy${milestone ? `\n${emoji("rank")} Milestone bonus: **+${val(milestone)}**!` : ""}`,
      ``,
      `**Streak:** ${newStreak} day${newStreak === 1 ? "" : "s"}  *(+${Math.round(bonusPct * 100)}% bonus)*`,
      `${progressBar(streakInCycle, 30)}`,
      !continued && u.dailyStreak > 1 ? `\n💔 *Previous streak of ${u.dailyStreak} reset — claim within 48h next time.*` : "",
    ].filter(Boolean).join("\n"))
    .addFields(statsGrid({
      "Total Earned": total,
      "New Balance":  getUser(message.author.id).cowoncy,
      "Next Claim":   "in 24h",
    }));
  await replyEmbed(message, e);
}

export async function cmdGive(message: Message, args: string[]): Promise<void> {
  const target = message.mentions.users.first();
  const amountStr = args.find(a => /^\d+$/.test(a));
  if (!target || !amountStr) {
    await replyEmbed(message, errorEmbed(message, "Usage", "`lowo give @user <amount>`")); return;
  }
  if (target.id === message.author.id) { await replyEmbed(message, errorEmbed(message, "Can't give to yourself.")); return; }
  if (target.bot) { await replyEmbed(message, errorEmbed(message, "Bots don't need cowoncy.")); return; }
  const amount = parseInt(amountStr, 10);
  if (amount <= 0) { await replyEmbed(message, errorEmbed(message, "Amount must be positive.")); return; }
  const sender = getUser(message.author.id);
  if (sender.cowoncy < amount) {
    await replyEmbed(message, errorEmbed(message, "Insufficient funds", `You only have ${val(sender.cowoncy)} cowoncy.`)); return;
  }
  updateUser(message.author.id, (x) => { x.cowoncy -= amount; });
  updateUser(target.id, (x) => { x.cowoncy += amount; });
  const e = successEmbed(message, "Transfer Complete")
    .setThumbnail(target.displayAvatarURL({ size: 128 }))
    .setDescription(`Sent ${val(amount)} 🪙 cowoncy to **${target.username}**.`);
  await replyEmbed(message, e);
}

export async function cmdVote(message: Message): Promise<void> {
  updateUser(message.author.id, (x) => { x.cowoncy += 250; });
  await replyEmbed(message, successEmbed(message, "Thanks for voting!", `+${val(250)} cowoncy. *(Hook a real bot-list webhook for live tracking.)*`));
}

// ─── Reputation ───────────────────────────────────────────────────────────────
const REP_COOLDOWN_MS = 24 * 60 * 60 * 1000;
export async function cmdRep(message: Message): Promise<void> {
  const target = message.mentions.users.first();
  if (!target) { await replyEmbed(message, errorEmbed(message, "Usage", "`lowo rep @user`")); return; }
  if (target.id === message.author.id) { await replyEmbed(message, errorEmbed(message, "Can't rep yourself.")); return; }
  if (target.bot) { await replyEmbed(message, errorEmbed(message, "Can't rep bots.")); return; }
  const me = getUser(message.author.id);
  const now = Date.now();
  const left = REP_COOLDOWN_MS - (now - me.lastRep);
  if (left > 0) {
    const h = Math.floor(left / 3600000);
    const m = Math.floor((left % 3600000) / 60000);
    await replyEmbed(message, warnEmbed(message, "Rep Cooldown", `You can give rep again in **${h}h ${m}m**.`));
    return;
  }
  updateUser(message.author.id, (x) => { x.lastRep = now; });
  updateUser(target.id, (x) => { x.rep += 1; });
  const them = getUser(target.id);
  const e = successEmbed(message, "Reputation Given!")
    .setThumbnail(target.displayAvatarURL({ size: 128 }))
    .setDescription(`⭐ **${message.author.username}** gave rep to **${target.username}** — they now have ${val(them.rep)} rep!`);
  await replyEmbed(message, e);
}

// ─── Tag (profile blurb) ──────────────────────────────────────────────────────
export async function cmdTag(message: Message, args: string[]): Promise<void> {
  const text = args.join(" ").trim();
  if (!text) {
    const u = getUser(message.author.id);
    await replyEmbed(message, baseEmbed(message)
      .setTitle("🏷️ Profile Tag")
      .setDescription(u.tag ? `Your tag: *"${u.tag}"*\n\nClear with \`lowo tag clear\`.` : "No tag set. Try `lowo tag <text>` *(max 60 chars)*."));
    return;
  }
  if (text.toLowerCase() === "clear" || text.toLowerCase() === "reset") {
    updateUser(message.author.id, (x) => { x.tag = null; });
    await replyEmbed(message, successEmbed(message, "Tag cleared."));
    return;
  }
  const clean = text.slice(0, 60);
  updateUser(message.author.id, (x) => { x.tag = clean; });
  await replyEmbed(message, successEmbed(message, "Tag Updated", `*"${clean}"*`));
}
