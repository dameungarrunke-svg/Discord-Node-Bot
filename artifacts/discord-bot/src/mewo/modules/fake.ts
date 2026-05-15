import type { Message } from "discord.js";
import { EmbedBuilder } from "discord.js";

type Handler = (msg: Message, args: string[]) => Promise<void>;

function err(text: string): EmbedBuilder {
  return new EmbedBuilder().setColor(0xED4245).setDescription(`❌ ${text}`);
}

async function fetchBuf(url: string, ms = 5000): Promise<Buffer | null> {
  try {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), ms);
    const r = await fetch(url, { signal: ac.signal });
    clearTimeout(t);
    if (!r.ok) return null;
    return Buffer.from(await r.arrayBuffer());
  } catch { return null; }
}

// ─── Emoji support ────────────────────────────────────────────────────────────

const EMOJI_RE = /\p{Extended_Pictographic}(\u200D\p{Extended_Pictographic}|\uFE0F|\u20E3)*/gu;

interface Seg { type: "text" | "emoji"; value: string; }

function parseSegs(text: string): Seg[] {
  const out: Seg[] = [];
  let last = 0;
  for (const m of text.matchAll(EMOJI_RE)) {
    const cp = m[0].codePointAt(0)!;
    if (cp < 0x231A) continue;
    if (m.index! > last) out.push({ type: "text", value: text.slice(last, m.index) });
    out.push({ type: "emoji", value: m[0] });
    last = m.index! + m[0].length;
  }
  if (last < text.length) out.push({ type: "text", value: text.slice(last) });
  return out.filter(s => s.value.length > 0);
}

function twemojiUrl(emoji: string): string {
  const codes = [...emoji]
    .map(c => c.codePointAt(0)!)
    .filter(cp => cp !== 0xFE0F)
    .map(cp => cp.toString(16));
  return `https://cdn.jsdelivr.net/npm/twemoji@14.0.2/assets/72x72/${codes.join("-")}.png`;
}

const emojiCache = new Map<string, Buffer | null>();
async function getEmojiImg(emoji: string): Promise<Buffer | null> {
  if (emojiCache.has(emoji)) return emojiCache.get(emoji)!;
  const buf = await fetchBuf(twemojiUrl(emoji), 3000);
  emojiCache.set(emoji, buf);
  return buf;
}

// ─── Layout constants ────────────────────────────────────────────────────────

const W = 900;
const PAD_X = 16;
const PAD_Y = 12;
const AVATAR = 40;
const TEXT_X = PAD_X + AVATAR + 12;
const TEXT_MAX_W = W - TEXT_X - PAD_X;
const FONT = "15px 'DejaVu Sans', sans-serif";
const FONT_BOLD = "bold 15px 'DejaVu Sans', sans-serif";
const FONT_SMALL = "12px 'DejaVu Sans', sans-serif";
const FONT_SIZE = 15;
const EMOJI_SZ = 18;
const LINE_H = 22;

// ─── Line builder ────────────────────────────────────────────────────────────

function buildLines(segs: Seg[], measure: (s: string) => number): Seg[][] {
  const tokens: Seg[] = [];
  for (const seg of segs) {
    if (seg.type === "emoji") {
      tokens.push(seg);
      continue;
    }
    const nl = seg.value.split("\n");
    for (let i = 0; i < nl.length; i++) {
      if (i > 0) tokens.push({ type: "text", value: "\n" });
      const parts = nl[i].split(/(\s+)/);
      for (const p of parts) if (p) tokens.push({ type: "text", value: p });
    }
  }

  const lines: Seg[][] = [[]];
  let lineW = 0;

  for (const tok of tokens) {
    if (tok.value === "\n") { lines.push([]); lineW = 0; continue; }
    const w = tok.type === "emoji" ? EMOJI_SZ + 2 : measure(tok.value);
    if (lineW + w > TEXT_MAX_W && lines[lines.length - 1].length > 0 && !/^\s/.test(tok.value)) {
      lines.push([]); lineW = 0;
    }
    lines[lines.length - 1].push(tok);
    lineW += w;
  }

  return lines;
}

// ─── Core renderer ───────────────────────────────────────────────────────────

async function renderMessage(opts: {
  username: string;
  avatarUrl: string;
  roleColor?: string;
  message: string;
  timestamp?: string;
  replyToName?: string;
  replyToAvatarUrl?: string;
  replyText?: string;
}): Promise<Buffer> {
  const { createCanvas, loadImage } = await import("@napi-rs/canvas");

  const hasReply = !!(opts.replyToName && opts.replyText);
  const REPLY_H = hasReply ? 24 : 0;

  // Measure text to compute line count
  const measureCanvas = createCanvas(W, 50);
  const mctx = measureCanvas.getContext("2d");
  mctx.font = FONT;
  const measure = (s: string) => mctx.measureText(s).width;

  const segs = parseSegs(opts.message);
  const lines = buildLines(segs, measure);

  // Pre-fetch all unique emoji images in parallel
  const uniqueEmoji = new Set(segs.filter(s => s.type === "emoji").map(s => s.value));
  await Promise.all([...uniqueEmoji].map(e => getEmojiImg(e)));

  const MSG_BLOCK_H = Math.max(lines.length * LINE_H + 4, FONT_SIZE + 4);
  const H = PAD_Y + REPLY_H + Math.max(AVATAR, MSG_BLOCK_H + FONT_SIZE + 6) + PAD_Y + 4;

  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = "#313338";
  ctx.fillRect(0, 0, W, H);

  let baseY = PAD_Y;

  // ── Reply bar ──────────────────────────────────────────────────────────────
  if (hasReply) {
    ctx.strokeStyle = "#5c5f66";
    ctx.lineWidth = 2;
    const BAR_X = PAD_X + AVATAR / 2;
    const BAR_Y = baseY + 10;
    ctx.beginPath();
    ctx.moveTo(BAR_X, BAR_Y);
    ctx.arcTo(BAR_X, BAR_Y - 8, BAR_X + 12, BAR_Y - 8, 4);
    ctx.lineTo(TEXT_X, BAR_Y - 8);
    ctx.stroke();

    // Tiny reply avatar
    if (opts.replyToAvatarUrl) {
      const rBuf = await fetchBuf(opts.replyToAvatarUrl + "?size=32", 3000);
      if (rBuf) {
        const rImg = await loadImage(rBuf);
        ctx.save();
        ctx.beginPath();
        ctx.arc(TEXT_X + 9, baseY + 8, 8, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(rImg, TEXT_X + 1, baseY, 16, 16);
        ctx.restore();
      }
    }

    ctx.font = "bold 11px 'DejaVu Sans', sans-serif";
    ctx.fillStyle = "#b5bac1";
    const nameLabel = opts.replyToName ?? "";
    ctx.fillText(nameLabel, TEXT_X + 22, baseY + 13);
    const nameW = ctx.measureText(nameLabel).width;

    ctx.font = "11px 'DejaVu Sans', sans-serif";
    ctx.fillStyle = "#87898c";
    const replyPreview = (opts.replyText ?? "").slice(0, 60);
    ctx.fillText(` ${replyPreview}`, TEXT_X + 22 + nameW, baseY + 13);

    baseY += REPLY_H;
  }

  // ── Avatar ────────────────────────────────────────────────────────────────
  const avatarBuf = await fetchBuf(opts.avatarUrl + "?size=64", 4000);
  if (avatarBuf) {
    const img = await loadImage(avatarBuf);
    ctx.save();
    ctx.beginPath();
    ctx.arc(PAD_X + AVATAR / 2, baseY + AVATAR / 2, AVATAR / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(img, PAD_X, baseY, AVATAR, AVATAR);
    ctx.restore();
  } else {
    ctx.fillStyle = "#5865F2";
    ctx.beginPath();
    ctx.arc(PAD_X + AVATAR / 2, baseY + AVATAR / 2, AVATAR / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
    ctx.font = `bold ${FONT_SIZE}px sans-serif`;
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.fillText(opts.username[0]?.toUpperCase() ?? "?", PAD_X + AVATAR / 2, baseY + AVATAR / 2 + 6);
    ctx.textAlign = "left";
  }

  // ── Username + timestamp ──────────────────────────────────────────────────
  ctx.font = FONT_BOLD;
  ctx.fillStyle = opts.roleColor ?? "#ffffff";
  ctx.fillText(opts.username.slice(0, 32), TEXT_X, baseY + 16);
  const nameWidth = ctx.measureText(opts.username.slice(0, 32)).width;

  ctx.font = FONT_SMALL;
  ctx.fillStyle = "#87898c";
  const ts = opts.timestamp ?? new Date().toLocaleString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  ctx.fillText(`Today at ${ts}`, TEXT_X + nameWidth + 8, baseY + 15);

  // ── Message lines ─────────────────────────────────────────────────────────
  ctx.font = FONT;
  ctx.fillStyle = "#dcddde";
  let lineY = baseY + 16 + LINE_H;

  for (const line of lines) {
    let curX = TEXT_X;
    for (const seg of line) {
      if (seg.type === "text") {
        ctx.fillStyle = "#dcddde";
        ctx.fillText(seg.value, curX, lineY);
        curX += ctx.measureText(seg.value).width;
      } else {
        const emBuf = emojiCache.get(seg.value) ?? null;
        if (emBuf) {
          try {
            const emImg = await loadImage(emBuf);
            ctx.drawImage(emImg, curX, lineY - EMOJI_SZ + 2, EMOJI_SZ, EMOJI_SZ);
          } catch {
            // fall back: draw the raw emoji character if image fails
            ctx.fillStyle = "#dcddde";
            ctx.fillText(seg.value, curX, lineY);
          }
        } else {
          ctx.fillStyle = "#dcddde";
          ctx.fillText(seg.value, curX, lineY);
        }
        curX += EMOJI_SZ + 2;
      }
    }
    lineY += LINE_H;
  }

  return canvas.toBuffer("image/png");
}

// ─── Command handlers ─────────────────────────────────────────────────────────

export const cmdFakeMessage: Handler = async (msg, args) => {
  const target = msg.mentions.users.first();
  const text = args.filter(a => !a.startsWith("<@")).join(" ").trim();
  if (!target || !text) {
    await msg.reply({ embeds: [err("Usage: `mewo fake message @user <message text>`")] });
    return;
  }
  const thinking = await msg.reply({
    embeds: [new EmbedBuilder().setColor(0x313338).setDescription("🖼️ Generating...")]
  });
  try {
    const member = msg.guild?.members.cache.get(target.id);
    const roleColor = member?.displayHexColor && member.displayHexColor !== "#000000"
      ? member.displayHexColor
      : undefined;
    const buf = await renderMessage({
      username: member?.displayName ?? target.displayName,
      avatarUrl: target.displayAvatarURL({ extension: "png" }),
      roleColor,
      message: text.slice(0, 300),
    });
    await thinking.delete().catch(() => {});
    await msg.reply({ files: [{ attachment: buf, name: "message.png" }] });
  } catch (e) {
    console.error("[MEWO FAKE] message error:", e);
    await thinking.edit({ embeds: [err("Failed to generate image.")] });
  }
};

export const cmdFakeReply: Handler = async (msg, args) => {
  const mentions = [...msg.mentions.users.values()];
  if (mentions.length < 2) {
    await msg.reply({ embeds: [err("Usage: `mewo fake reply @replied_to @author <text>`")] });
    return;
  }
  const [replyTo, author] = mentions;
  const text = args.filter(a => !a.startsWith("<@")).join(" ").trim();
  if (!text) {
    await msg.reply({ embeds: [err("Provide the reply text after the mentions.")] });
    return;
  }
  const thinking = await msg.reply({
    embeds: [new EmbedBuilder().setColor(0x313338).setDescription("🖼️ Generating...")]
  });
  try {
    const authorMember = msg.guild?.members.cache.get(author.id);
    const roleColor = authorMember?.displayHexColor && authorMember.displayHexColor !== "#000000"
      ? authorMember.displayHexColor
      : undefined;
    const buf = await renderMessage({
      username: authorMember?.displayName ?? author.displayName,
      avatarUrl: author.displayAvatarURL({ extension: "png" }),
      roleColor,
      message: text.slice(0, 300),
      replyToName: msg.guild?.members.cache.get(replyTo.id)?.displayName ?? replyTo.displayName,
      replyToAvatarUrl: replyTo.displayAvatarURL({ extension: "png" }),
      replyText: `Click to see original message`,
    });
    await thinking.delete().catch(() => {});
    await msg.reply({ files: [{ attachment: buf, name: "message.png" }] });
  } catch (e) {
    console.error("[MEWO FAKE] reply error:", e);
    await thinking.edit({ embeds: [err("Failed to generate image.")] });
  }
};

export const cmdFakeQuote: Handler = async (msg, args) => {
  const target = msg.mentions.users.first();
  const text = args.filter(a => !a.startsWith("<@")).join(" ").trim();
  if (!target || !text) {
    await msg.reply({ embeds: [err("Usage: `mewo fake quote @user <quote text>`")] });
    return;
  }
  const thinking = await msg.reply({
    embeds: [new EmbedBuilder().setColor(0x313338).setDescription("🖼️ Generating...")]
  });
  try {
    const { createCanvas, loadImage } = await import("@napi-rs/canvas");

    const member = msg.guild?.members.cache.get(target.id);
    const roleColor = member?.displayHexColor && member.displayHexColor !== "#000000"
      ? member.displayHexColor
      : "#5865F2";
    const displayName = member?.displayName ?? target.displayName;

    // Word-wrap the quote text
    const QW = 700;
    const QPX = 110;
    const tmpC = createCanvas(QW, 50);
    const tmpCtx = tmpC.getContext("2d");
    tmpCtx.font = `italic 17px 'DejaVu Sans', sans-serif`;
    const words = `"${text}"`.split(" ");
    const qLines: string[] = [];
    let cur = "";
    for (const w of words) {
      const test = cur ? cur + " " + w : w;
      if (tmpCtx.measureText(test).width > QW - QPX - 20 && cur) {
        qLines.push(cur); cur = w;
      } else { cur = test; }
    }
    if (cur) qLines.push(cur);

    const QH = Math.max(160, 50 + qLines.length * 28 + 50);
    const canvas = createCanvas(QW, QH);
    const ctx = canvas.getContext("2d");

    // Background
    ctx.fillStyle = "#1e1f22";
    ctx.fillRect(0, 0, QW, QH);

    // Left accent bar
    ctx.fillStyle = roleColor;
    ctx.fillRect(0, 0, 4, QH);

    // Avatar
    const avatarBuf = await fetchBuf(target.displayAvatarURL({ extension: "png" }) + "?size=128", 4000);
    if (avatarBuf) {
      const img = await loadImage(avatarBuf);
      ctx.save();
      ctx.beginPath();
      ctx.arc(54, QH / 2, 38, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, 16, QH / 2 - 38, 76, 76);
      ctx.restore();
    }

    // Quote text
    ctx.font = `italic 17px 'DejaVu Sans', sans-serif`;
    ctx.fillStyle = "#e3e5e8";
    let qY = 42;
    for (const ql of qLines) {
      ctx.fillText(ql, QPX, qY);
      qY += 28;
    }

    // Author name
    ctx.font = `bold 14px 'DejaVu Sans', sans-serif`;
    ctx.fillStyle = roleColor;
    ctx.fillText(`— ${displayName}`, QPX, QH - 20);

    const buf = canvas.toBuffer("image/png");
    await thinking.delete().catch(() => {});
    await msg.reply({ files: [{ attachment: buf, name: "quote.png" }] });
  } catch (e) {
    console.error("[MEWO FAKE] quote error:", e);
    await thinking.edit({ embeds: [err("Failed to generate image.")] });
  }
};
