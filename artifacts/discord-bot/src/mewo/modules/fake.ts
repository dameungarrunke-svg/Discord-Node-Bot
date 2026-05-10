import type { Message } from "discord.js";
import { EmbedBuilder } from "discord.js";

type Handler = (msg: Message, args: string[]) => Promise<void>;

function err(text: string): EmbedBuilder {
  return new EmbedBuilder().setColor(0xED4245).setDescription(`❌ ${text}`);
}

async function fetchAvatarBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch { return null; }
}

async function buildFakeMessage(opts: {
  username: string;
  avatarUrl: string;
  message: string;
  roleColor?: string;
  replyUsername?: string;
  replyText?: string;
  timestamp?: string;
}): Promise<Buffer> {
  const { createCanvas, loadImage } = await import("@napi-rs/canvas");

  const W = 620;
  const PADDING = 16;
  const AVATAR_SIZE = 40;
  const hasReply = !!(opts.replyUsername && opts.replyText);
  const H = hasReply ? 130 : 90;

  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#313338";
  ctx.fillRect(0, 0, W, H);

  let yOffset = PADDING;

  if (hasReply) {
    ctx.fillStyle = "#4e5058";
    ctx.fillRect(PADDING + 18, yOffset, 2, 14);
    ctx.fillStyle = "#b5bac1";
    ctx.font = "12px sans-serif";
    const replyLabel = `${opts.replyUsername ?? ""}: ${opts.replyText ?? ""}`;
    ctx.fillText(replyLabel.slice(0, 60), PADDING + 26, yOffset + 11);
    yOffset += 20;
  }

  const avatarBuf = await fetchAvatarBuffer(opts.avatarUrl + "?size=64");
  if (avatarBuf) {
    const img = await loadImage(avatarBuf);
    ctx.save();
    ctx.beginPath();
    ctx.arc(PADDING + AVATAR_SIZE / 2, yOffset + AVATAR_SIZE / 2, AVATAR_SIZE / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(img, PADDING, yOffset, AVATAR_SIZE, AVATAR_SIZE);
    ctx.restore();
  } else {
    ctx.fillStyle = "#5865F2";
    ctx.beginPath();
    ctx.arc(PADDING + AVATAR_SIZE / 2, yOffset + AVATAR_SIZE / 2, AVATAR_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(opts.username[0]?.toUpperCase() ?? "?", PADDING + AVATAR_SIZE / 2, yOffset + AVATAR_SIZE / 2 + 6);
    ctx.textAlign = "left";
  }

  const textX = PADDING + AVATAR_SIZE + 12;
  ctx.font = "bold 15px sans-serif";
  ctx.fillStyle = opts.roleColor ?? "#ffffff";
  ctx.fillText(opts.username.slice(0, 30), textX, yOffset + 16);

  const usernameWidth = ctx.measureText(opts.username.slice(0, 30)).width;
  ctx.font = "11px sans-serif";
  ctx.fillStyle = "#87898c";
  ctx.fillText(opts.timestamp ?? "Today at 12:00 AM", textX + usernameWidth + 8, yOffset + 16);

  ctx.font = "15px sans-serif";
  ctx.fillStyle = "#dbdee1";
  const maxWidth = W - textX - PADDING;
  const words = opts.message.split(" ");
  let line = "";
  let lineY = yOffset + 36;
  for (const word of words) {
    const testLine = line + word + " ";
    if (ctx.measureText(testLine).width > maxWidth && line !== "") {
      ctx.fillText(line.trim(), textX, lineY);
      line = word + " ";
      lineY += 20;
      if (lineY > H - 8) break;
    } else {
      line = testLine;
    }
  }
  if (line.trim()) ctx.fillText(line.trim(), textX, lineY);

  return canvas.toBuffer("image/png");
}

export const cmdFakeMessage: Handler = async (msg, args) => {
  const target = msg.mentions.users.first();
  const text = args.filter(a => !a.startsWith("<@")).join(" ");
  if (!target || !text) {
    await msg.reply({ embeds: [err("Usage: `mewo fake message @user <message text>`")] });
    return;
  }
  try {
    const buf = await buildFakeMessage({
      username: target.displayName,
      avatarUrl: target.displayAvatarURL({ extension: "png", size: 64 }),
      message: text.slice(0, 200),
      timestamp: new Date().toLocaleString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
    });
    await msg.reply({
      embeds: [new EmbedBuilder()
        .setColor(0x313338)
        .setTitle("Fake Message")
        .setImage("attachment://fake-message.png")
        .setFooter({ text: "mewo • fake" })
      ],
      files: [{ attachment: buf, name: "fake-message.png" }],
    });
  } catch (e) {
    await msg.reply({ embeds: [err(`Failed to generate: ${(e as Error).message}`)] });
  }
};

export const cmdFakeReply: Handler = async (msg, args) => {
  const mentions = [...msg.mentions.users.values()];
  if (mentions.length < 2) {
    await msg.reply({ embeds: [err("Usage: `mewo fake reply @replying_to @author <reply text>`\nMention two users: the one being replied to, then the author.")] });
    return;
  }
  const [replyTarget, author] = mentions;
  const textArgs = args.filter(a => !a.startsWith("<@"));
  if (!textArgs.length) {
    await msg.reply({ embeds: [err("Provide the reply text after the mentions.")] });
    return;
  }
  const replyText = textArgs.join(" ");
  try {
    const buf = await buildFakeMessage({
      username: author.displayName,
      avatarUrl: author.displayAvatarURL({ extension: "png", size: 64 }),
      message: replyText.slice(0, 200),
      timestamp: new Date().toLocaleString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
      replyUsername: replyTarget.displayName,
      replyText: "Click to see attachment",
    });
    await msg.reply({
      embeds: [new EmbedBuilder()
        .setColor(0x313338)
        .setTitle("Fake Reply")
        .setImage("attachment://fake-reply.png")
        .setFooter({ text: "mewo • fake" })
      ],
      files: [{ attachment: buf, name: "fake-reply.png" }],
    });
  } catch (e) {
    await msg.reply({ embeds: [err(`Failed to generate: ${(e as Error).message}`)] });
  }
};

export const cmdFakeQuote: Handler = async (msg, args) => {
  const target = msg.mentions.users.first();
  const text = args.filter(a => !a.startsWith("<@")).join(" ");
  if (!target || !text) {
    await msg.reply({ embeds: [err("Usage: `mewo fake quote @user <quote text>`")] });
    return;
  }
  try {
    const { createCanvas, loadImage } = await import("@napi-rs/canvas");

    const W = 600;
    const H = 200;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#23272a";
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "#5865F2";
    ctx.fillRect(0, 0, 6, H);

    const avatarBuf = await fetchAvatarBuffer(target.displayAvatarURL({ extension: "png", size: 128 }) + "?size=128");
    if (avatarBuf) {
      const img = await loadImage(avatarBuf);
      ctx.save();
      ctx.beginPath();
      ctx.arc(54, 100, 40, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, 14, 60, 80, 80);
      ctx.restore();
    }

    ctx.font = "italic 18px sans-serif";
    ctx.fillStyle = "#dcddde";
    const words = `"${text}"`.split(" ");
    let line = "";
    let y = 60;
    for (const word of words) {
      const test = line + word + " ";
      if (ctx.measureText(test).width > 460 && line !== "") {
        ctx.fillText(line.trim(), 110, y);
        line = word + " ";
        y += 28;
        if (y > H - 50) break;
      } else {
        line = test;
      }
    }
    if (line.trim()) ctx.fillText(line.trim(), 110, y);

    ctx.font = "bold 14px sans-serif";
    ctx.fillStyle = "#5865F2";
    ctx.fillText(`— ${target.displayName}`, 110, H - 30);

    const buf = canvas.toBuffer("image/png");
    await msg.reply({
      embeds: [new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle("Fake Quote")
        .setImage("attachment://fake-quote.png")
        .setFooter({ text: "mewo • fake" })
      ],
      files: [{ attachment: buf, name: "fake-quote.png" }],
    });
  } catch (e) {
    await msg.reply({ embeds: [err(`Failed to generate: ${(e as Error).message}`)] });
  }
};
