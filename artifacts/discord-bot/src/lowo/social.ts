import type { Message } from "discord.js";
import { fetchAnimeGif } from "../fun/gifService.js";
import { getUser, updateUser } from "./storage.js";
import { isCensored } from "./censor.js";

async function actionCmd(message: Message, verb: string, gifKey: string, emoji: string, censorKey?: string): Promise<void> {
  if (censorKey && isCensored(message.guildId)) {
    await message.reply(`🤫 \`lowo ${censorKey}\` is censored on this server.`);
    return;
  }
  const target = message.mentions.users.first();
  if (!target) { await message.reply(`Usage: \`lowo ${verb} @user\``); return; }
  if (target.id === message.author.id) { await message.reply(`You ${verb} yourself ${emoji}`); return; }
  const gif = await fetchAnimeGif(gifKey).catch(() => null);
  const txt = `${emoji} **${message.author.username}** ${verb}s **${target.username}** ${emoji}`;
  const ch = message.channel;
  if (gif && "send" in ch) await ch.send({ content: txt, files: [gif] }).catch(() => message.reply(txt));
  else await message.reply(txt);
}

export const cmdHug    = (m: Message) => actionCmd(m, "hug",    "hug",    "🤗");
export const cmdKiss   = (m: Message) => actionCmd(m, "kiss",   "kiss",   "💋");
export const cmdSlap   = (m: Message) => actionCmd(m, "slap",   "slap",   "🖐️", "slap");
export const cmdPat    = (m: Message) => actionCmd(m, "pat",    "pat",    "🫶");
export const cmdCuddle = (m: Message) => actionCmd(m, "cuddle", "cuddle", "🥰");
export const cmdPoke   = (m: Message) => actionCmd(m, "poke",   "poke",   "👉");

export async function cmdPropose(message: Message): Promise<void> {
  const target = message.mentions.users.first();
  if (!target) { await message.reply("Usage: `lowo propose @user`"); return; }
  if (target.id === message.author.id) { await message.reply("❌ Can't marry yourself."); return; }
  if (target.bot) { await message.reply("❌ Bots can't marry."); return; }
  const me = getUser(message.author.id);
  if (me.marriedTo) { await message.reply("❌ You're already married."); return; }
  if ((me.rings ?? 0) <= 0) { await message.reply("❌ You need a 💍 Wedding Ring. Buy via `lowo buy ring`."); return; }
  const them = getUser(target.id);
  if (them.marriedTo) { await message.reply(`❌ ${target.username} is already married.`); return; }
  updateUser(message.author.id, (x) => { x.marriedTo = target.id; x.rings -= 1; });
  updateUser(target.id, (x) => { x.marriedTo = message.author.id; });
  await message.reply(`💍 **${message.author.username}** proposed to **${target.username}** — they're now married! 💕`);
}

export async function cmdDivorce(message: Message): Promise<void> {
  const me = getUser(message.author.id);
  if (!me.marriedTo) { await message.reply("❌ You're not married."); return; }
  const partnerId = me.marriedTo;
  updateUser(message.author.id, (x) => { x.marriedTo = null; });
  updateUser(partnerId, (x) => { x.marriedTo = null; });
  await message.reply(`💔 You divorced <@${partnerId}>.`);
}

export function lowoify(text: string): string {
  let out = text
    .replace(/[rl]/g, "w")
    .replace(/[RL]/g, "W")
    .replace(/n([aeiou])/g, "ny$1")
    .replace(/N([aeiou])/g, "Ny$1");
  const suffixes = [" owo", " uwu", " >w<", " ^-^", " :3", " (◕‿◕)"];
  out += suffixes[Math.floor(Math.random() * suffixes.length)];
  return out;
}

export async function cmdLowoify(message: Message, args: string[]): Promise<void> {
  const text = args.join(" ");
  if (!text) { await message.reply("Usage: `lowo lowoify <text>`"); return; }
  await message.reply(lowoify(text).slice(0, 1900));
}

export async function cmdShip(message: Message): Promise<void> {
  const a = message.mentions.users.first();
  const b = message.mentions.users.at(1) ?? message.author;
  if (!a) { await message.reply("Usage: `lowo ship @user1 [@user2]`"); return; }
  const score = Math.floor(((a.id.length + b.id.length) * 7) % 101);
  const heart = score >= 80 ? "💖" : score >= 50 ? "💕" : score >= 25 ? "💔" : "🖤";
  await message.reply(`${heart} **${a.username}** + **${b.username}** = **${score}%** compatible ${heart}`);
}
