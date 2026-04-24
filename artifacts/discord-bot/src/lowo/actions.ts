import type { Message } from "discord.js";
import { fetchAnimeGif } from "../fun/gifService.js";

async function actionCmd(message: Message, verb: string, gifKey: string, emoji: string, selfText?: string): Promise<void> {
  const target = message.mentions.users.first();
  if (!target) { await message.reply(`Usage: \`lowo ${verb} @user\``); return; }
  if (target.id === message.author.id) { await message.reply(selfText ?? `You ${verb} yourself ${emoji}`); return; }
  const gif = await fetchAnimeGif(gifKey).catch(() => null);
  const txt = `${emoji} **${message.author.username}** ${verb}s **${target.username}** ${emoji}`;
  const ch = message.channel;
  if (gif && "send" in ch) await ch.send({ content: txt, files: [gif] }).catch(() => message.reply(txt));
  else await message.reply(txt);
}

export const cmdLick = (m: Message) => actionCmd(m, "lick", "lick", "👅");
export const cmdNom = (m: Message) => actionCmd(m, "nom", "bite", "😋");
export const cmdStare = (m: Message) => actionCmd(m, "stare", "stare", "👀");
export const cmdHighfive = (m: Message) => actionCmd(m, "highfive", "highfive", "🙏");
export const cmdBite = (m: Message) => actionCmd(m, "bite", "bite", "🦷");
export const cmdGreet = (m: Message) => actionCmd(m, "greet", "wave", "👋");
export const cmdPunch = (m: Message) => actionCmd(m, "punch", "punch", "🥊");
export const cmdHandholding = (m: Message) => actionCmd(m, "hold hands with", "handhold", "🤝");
export const cmdTickle = (m: Message) => actionCmd(m, "tickle", "tickle", "🤭");
export const cmdKill = (m: Message) => actionCmd(m, "kill", "kill", "🔪");
export const cmdHold = (m: Message) => actionCmd(m, "hold", "cuddle", "🫂");
export const cmdPats = (m: Message) => actionCmd(m, "pat", "pat", "🫶");
export const cmdWave = (m: Message) => actionCmd(m, "wave at", "wave", "👋");
export const cmdBoop = (m: Message) => actionCmd(m, "boop", "poke", "👉");
export const cmdSnuggle = (m: Message) => actionCmd(m, "snuggle", "cuddle", "🥰");
export const cmdBully = (m: Message) => actionCmd(m, "bully", "slap", "😈");
