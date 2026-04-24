import type { Message } from "discord.js";
import { getUser } from "./storage.js";
import { ANIMAL_BY_ID } from "./data.js";

export async function cmdProfile(message: Message): Promise<void> {
  const target = message.mentions.users.first() ?? message.author;
  const u = getUser(target.id);
  const animals = Object.values(u.zoo).reduce((a, b) => a + b, 0);
  const married = u.marriedTo ? `<@${u.marriedTo}>` : "single";
  await message.reply([
    `👤 **${target.username}'s Lowo Profile**`,
    `💰 Cowoncy: **${u.cowoncy.toLocaleString()}**`,
    `✨ Essence: **${u.essence.toLocaleString()}**`,
    `🐾 Animals: **${animals}** (${u.dex.length} unique)`,
    `🗡️ Weapons: **${u.weapons.length}**`,
    `🦊 Pet streak: **${u.pet.streak}** days`,
    `🥕 Garden streak: **${u.piku.harvested}** harvests`,
    `🎟️ Lottery tickets: **${u.lotteryTickets}**`,
    `💍 Married to: ${married}`,
  ].join("\n"));
}

export async function cmdLevel(message: Message): Promise<void> {
  const target = message.mentions.users.first() ?? message.author;
  const u = getUser(target.id);
  const xp = u.cowoncy + u.essence * 10 + Object.values(u.zoo).reduce((a,b)=>a+b,0) * 5;
  const level = Math.floor(Math.sqrt(xp / 100));
  const nextXp = Math.pow(level + 1, 2) * 100;
  await message.reply(`📈 **${target.username}** — Lowo Level **${level}**\nXP: ${xp.toLocaleString()} / ${nextXp.toLocaleString()}`);
}

export async function cmdAvatar(message: Message): Promise<void> {
  const target = message.mentions.users.first() ?? message.author;
  await message.reply(target.displayAvatarURL({ size: 512 }));
}

export async function cmdWallpaper(message: Message): Promise<void> {
  await message.reply("🖼️ Wallpaper customization is cosmetic — buy `background` from `lowo shop` to unlock more.");
}

export async function cmdEmoji(message: Message, args: string[]): Promise<void> {
  const e = args[0];
  if (!e) { await message.reply("Usage: `lowo emoji <emoji>`"); return; }
  await message.reply(e);
}

export async function cmdCookie(message: Message): Promise<void> {
  const target = message.mentions.users.first();
  if (target && target.id !== message.author.id) {
    await message.reply(`🍪 **${message.author.username}** gives **${target.username}** a cookie!`);
  } else {
    await message.reply(`🍪 **${message.author.username}** has a cookie!`);
  }
}

export async function cmdPray(message: Message): Promise<void> {
  const target = message.mentions.users.first();
  const blessed = Math.random() < 0.5;
  if (blessed && target) await message.reply(`🙏 **${message.author.username}** prays for **${target.username}** — they feel blessed! ✨`);
  else if (target) await message.reply(`🙏 **${message.author.username}** prays for **${target.username}** — but the gods are silent...`);
  else await message.reply(`🙏 **${message.author.username}** prays — ${blessed ? "blessed!" : "the gods are silent..."}`);
}

export async function cmdCurse(message: Message): Promise<void> {
  const target = message.mentions.users.first();
  if (!target) { await message.reply("Usage: `lowo curse @user`"); return; }
  const cursed = Math.random() < 0.5;
  await message.reply(`😈 **${message.author.username}** curses **${target.username}** — ${cursed ? "they are cursed! 💀" : "the curse fizzles."}`);
}

// Rankings
export async function cmdTop(message: Message, args: string[]): Promise<void> {
  // Read raw store (top 10 by cowoncy / essence / dex)
  const { default: fs } = await import("node:fs");
  const path = await import("node:path");
  const url = await import("node:url");
  const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
  const FILE = path.resolve(__dirname, "../../data/lowo.json");
  if (!fs.existsSync(FILE)) { await message.reply("📊 No data yet."); return; }
  const store = JSON.parse(fs.readFileSync(FILE, "utf-8")) as { users: Record<string, ReturnType<typeof getUser>> };
  const kind = (args[0] ?? "cowoncy").toLowerCase();
  const sorter: Record<string, (u: ReturnType<typeof getUser>) => number> = {
    cowoncy: (u) => u.cowoncy,
    essence: (u) => u.essence,
    dex: (u) => u.dex.length,
    animals: (u) => Object.values(u.zoo).reduce((a, b) => a + b, 0),
  };
  const fn = sorter[kind] ?? sorter.cowoncy;
  const sorted = Object.entries(store.users).map(([id, u]) => ({ id, score: fn(u) })).sort((a, b) => b.score - a.score).slice(0, 10);
  if (sorted.length === 0) { await message.reply("📊 Empty leaderboard."); return; }
  const lines = sorted.map((s, i) => `**${i + 1}.** <@${s.id}> — ${s.score.toLocaleString()}`);
  await message.reply(`🏆 **Top Lowo (${kind})**\n${lines.join("\n")}`);
}

export async function cmdMy(message: Message, args: string[]): Promise<void> {
  await cmdProfile(message);
}
