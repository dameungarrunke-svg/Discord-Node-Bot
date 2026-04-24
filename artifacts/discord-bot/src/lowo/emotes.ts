import type { Message } from "discord.js";
import { fetchAnimeGif } from "../fun/gifService.js";
import { isCensored } from "./censor.js";

async function selfEmote(message: Message, label: string, emoji: string, gifKey: string, censorKey?: string): Promise<void> {
  if (censorKey && isCensored(message.guildId)) {
    await message.reply(`🤫 \`lowo ${censorKey}\` is censored on this server.`);
    return;
  }
  const gif = await fetchAnimeGif(gifKey).catch(() => null);
  const txt = `${emoji} **${message.author.username}** ${label} ${emoji}`;
  const ch = message.channel;
  if (gif && "send" in ch) await ch.send({ content: txt, files: [gif] }).catch(() => message.reply(txt));
  else await message.reply(txt);
}

export const cmdBlush     = (m: Message) => selfEmote(m, "is blushing", "☺️", "blush");
export const cmdCry       = (m: Message) => selfEmote(m, "is crying", "😭", "cry");
export const cmdDance     = (m: Message) => selfEmote(m, "is dancing", "💃", "dance");
export const cmdLewd      = (m: Message) => selfEmote(m, "feels lewd", "😳", "blush", "lewd");
export const cmdPout      = (m: Message) => selfEmote(m, "is pouting", "😤", "pout");
export const cmdShrug     = (m: Message) => selfEmote(m, "shrugs", "🤷", "shrug");
export const cmdSleepy    = (m: Message) => selfEmote(m, "is sleepy", "😴", "sleep");
export const cmdSmile     = (m: Message) => selfEmote(m, "smiles", "😊", "smile");
export const cmdSmug      = (m: Message) => selfEmote(m, "looks smug", "😏", "smug");
export const cmdThumbsup  = (m: Message) => selfEmote(m, "gives a thumbs up", "👍", "thumbsup");
export const cmdWag       = (m: Message) => selfEmote(m, "wags their tail", "🐕", "happy");
export const cmdThinking  = (m: Message) => selfEmote(m, "is thinking", "🤔", "think");
export const cmdTriggered = (m: Message) => selfEmote(m, "is triggered", "💢", "triggered");
export const cmdTeehee    = (m: Message) => selfEmote(m, "teehee~", "🤭", "happy");
export const cmdDeredere  = (m: Message) => selfEmote(m, "is feeling deredere", "💕", "blush");
export const cmdThonking  = (m: Message) => selfEmote(m, "is thonking", "🧠", "think");
export const cmdScoff     = (m: Message) => selfEmote(m, "scoffs", "😒", "smug");
export const cmdHappy     = (m: Message) => selfEmote(m, "is happy", "😄", "happy");
export const cmdGrin      = (m: Message) => selfEmote(m, "grins", "😁", "happy");
