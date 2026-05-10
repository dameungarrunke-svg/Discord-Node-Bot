import type { Message } from "discord.js";
import { EmbedBuilder } from "discord.js";

type Handler = (msg: Message, args: string[]) => Promise<void>;

interface NekosResult {
  results: Array<{ anime_name: string; url: string }>;
}

async function fetchGif(action: string): Promise<string | null> {
  try {
    const res = await fetch(`https://nekos.best/api/v2/${action}`);
    if (!res.ok) return null;
    const data = await res.json() as NekosResult;
    return data.results?.[0]?.url ?? null;
  } catch {
    return null;
  }
}

async function roleplayCmd(
  msg: Message,
  action: string,
  selfText: string,
  targetVerb: string,
  color: number,
  emoji: string
): Promise<void> {
  const target = msg.mentions.users.first();
  const gifUrl = await fetchGif(action);
  const title = target
    ? `${emoji} ${msg.author.username} ${targetVerb} ${target.username}`
    : `${emoji} ${msg.author.username} ${selfText}`;
  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setFooter({ text: "mewo • roleplay" });
  if (gifUrl) embed.setImage(gifUrl);
  await msg.reply({ embeds: [embed] });
}

export const cmdBaka: Handler = (msg) =>
  roleplayCmd(msg, "baka", "called someone a baka!", "called you a baka!", 0xED4245, "💢");

export const cmdBite: Handler = (msg) =>
  roleplayCmd(msg, "bite", "bit the air!", "bit you!", 0xED4245, "😬");

export const cmdCry: Handler = (msg) =>
  roleplayCmd(msg, "cry", "is crying...", "made you cry!", 0x5865F2, "😢");

export const cmdCuddle: Handler = (msg) =>
  roleplayCmd(msg, "cuddle", "wants cuddles!", "cuddled you!", 0xFF73FA, "🤗");

export const cmdFeed: Handler = (msg) =>
  roleplayCmd(msg, "feed", "is eating!", "fed you!", 0x57F287, "🍴");

export const cmdHandhold: Handler = (msg) =>
  roleplayCmd(msg, "handhold", "wants to hold hands!", "held your hand!", 0xFF73FA, "🤝");

export const cmdHandshake: Handler = (msg) =>
  roleplayCmd(msg, "handshake", "wants a handshake!", "shook your hand!", 0x5865F2, "🤝");

export const cmdHighfive: Handler = (msg) =>
  roleplayCmd(msg, "highfive", "high-fived the air!", "high-fived you!", 0x57F287, "✋");

export const cmdHug: Handler = (msg) =>
  roleplayCmd(msg, "hug", "wants a hug!", "hugged you!", 0xFF73FA, "🫂");

export const cmdKick: Handler = (msg) =>
  roleplayCmd(msg, "kick", "kicked the air!", "kicked you!", 0xED4245, "👟");

export const cmdKiss: Handler = (msg) =>
  roleplayCmd(msg, "kiss", "blew a kiss!", "kissed you!", 0xFF73FA, "💋");

export const cmdPat: Handler = (msg) =>
  roleplayCmd(msg, "pat", "wants headpats!", "patted your head!", 0xFF73FA, "👋");

export const cmdPeck: Handler = (msg) =>
  roleplayCmd(msg, "peck", "pecked the air!", "pecked your cheek!", 0xFF73FA, "💕");

export const cmdPoke: Handler = (msg) =>
  roleplayCmd(msg, "poke", "poked the air!", "poked you!", 0xFEE75C, "👉");

export const cmdPunch: Handler = (msg) =>
  roleplayCmd(msg, "punch", "punched the air!", "punched you!", 0xED4245, "👊");

export const cmdShoot: Handler = (msg) =>
  roleplayCmd(msg, "shoot", "fired into the air!", "shot you!", 0xED4245, "🔫");

export const cmdSlap: Handler = (msg) =>
  roleplayCmd(msg, "slap", "slapped the air!", "slapped you!", 0xED4245, "👋");

export const cmdRoleplayHelp: Handler = async (msg) => {
  await msg.reply({
    embeds: [new EmbedBuilder()
      .setColor(0xFF73FA)
      .setTitle("🎭 Roleplay Commands")
      .setDescription(
        "All roleplay commands send an anime GIF. Add `@user` to target someone.\n\n" +
        "`mewo roleplay baka [@u]` — Call someone a baka\n" +
        "`mewo roleplay bite [@u]` — Bite someone\n" +
        "`mewo roleplay cry` — Let it all out\n" +
        "`mewo roleplay cuddle [@u]` — Cuddle with someone\n" +
        "`mewo roleplay feed [@u]` — Feed someone\n" +
        "`mewo roleplay handhold [@u]` — Hold hands\n" +
        "`mewo roleplay handshake [@u]` — Shake hands\n" +
        "`mewo roleplay highfive [@u]` — High five\n" +
        "`mewo roleplay hug [@u]` — Hug someone\n" +
        "`mewo roleplay kick [@u]` — Kick someone\n" +
        "`mewo roleplay kiss [@u]` — Kiss someone\n" +
        "`mewo roleplay pat [@u]` — Pat someone's head\n" +
        "`mewo roleplay peck [@u]` — Peck someone\n" +
        "`mewo roleplay poke [@u]` — Poke someone\n" +
        "`mewo roleplay punch [@u]` — Punch someone\n" +
        "`mewo roleplay shoot [@u]` — Shoot someone\n" +
        "`mewo roleplay slap [@u]` — Slap someone"
      )
      .setFooter({ text: "mewo • roleplay • Powered by nekos.best" })
    ],
  });
};
