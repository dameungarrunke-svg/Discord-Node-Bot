import type { Message } from "discord.js";
import { getUser, updateUser } from "./storage.js";

const DAILY_AMOUNT = 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export async function cmdCowoncy(message: Message, args: string[]): Promise<void> {
  const target = message.mentions.users.first() ?? message.author;
  const u = getUser(target.id);
  await message.reply(`💰 **${target.username}** has **${u.cowoncy.toLocaleString()}** cowoncy and **${u.essence.toLocaleString()}** ✨ essence.`);
}

export async function cmdDaily(message: Message): Promise<void> {
  const u = getUser(message.author.id);
  const now = Date.now();
  if (now - u.lastDaily < DAY_MS) {
    const left = DAY_MS - (now - u.lastDaily);
    const h = Math.floor(left / 3600000);
    const m = Math.floor((left % 3600000) / 60000);
    await message.reply(`🕒 Daily already claimed. Come back in **${h}h ${m}m**.`);
    return;
  }
  updateUser(message.author.id, (x) => { x.cowoncy += DAILY_AMOUNT; x.lastDaily = now; });
  await message.reply(`🎁 You claimed your daily **${DAILY_AMOUNT}** cowoncy! 💰`);
}

export async function cmdGive(message: Message, args: string[]): Promise<void> {
  const target = message.mentions.users.first();
  const amountStr = args.find(a => /^\d+$/.test(a));
  if (!target || !amountStr) {
    await message.reply("Usage: `lowo give @user <amount>`");
    return;
  }
  if (target.id === message.author.id) { await message.reply("❌ You can't give to yourself."); return; }
  if (target.bot) { await message.reply("❌ Bots don't need cowoncy."); return; }
  const amount = parseInt(amountStr, 10);
  if (amount <= 0) { await message.reply("❌ Amount must be positive."); return; }
  const sender = getUser(message.author.id);
  if (sender.cowoncy < amount) { await message.reply(`❌ You only have ${sender.cowoncy} cowoncy.`); return; }
  updateUser(message.author.id, (x) => { x.cowoncy -= amount; });
  updateUser(target.id, (x) => { x.cowoncy += amount; });
  await message.reply(`💸 Sent **${amount}** cowoncy to **${target.username}**.`);
}

export async function cmdVote(message: Message): Promise<void> {
  updateUser(message.author.id, (x) => { x.cowoncy += 250; });
  await message.reply(`🗳️ Thanks for voting! +**250** cowoncy. (Hook a real bot-list webhook for live tracking.)`);
}
