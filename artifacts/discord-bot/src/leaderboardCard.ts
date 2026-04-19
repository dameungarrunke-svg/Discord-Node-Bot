import { createCanvas, loadImage } from "@napi-rs/canvas";

export interface LeaderboardEntry {
  rank: number;
  avatarURL: string | null;
  username: string;
  col1Label: string;
  col1Value: string;
  col2Label: string;
  col2Value: string;
}

// Exact rank colors from Arcane reference
const RANK_COLORS: Record<number, string> = {
  1: "#f0a832",  // gold
  2: "#c0c0c0",  // silver
  3: "#cd7f32",  // bronze
};

// Arcane card colors
const CARD_BG = "#2b2d31";
const TITLE_COLOR = "#ffffff";
const RANK_DEFAULT = "#ffffff";
const TEXT_COLOR = "#ffffff";
const SEP_COLOR = "#ffffff";
const FOOTER_COLOR = "#72767d";

// Layout constants matching Arcane reference
const CARD_W = 500;
const CORNER_R = 12;
const PAD_X = 16;
const TITLE_H = 70;    // space before first row
const ROW_H = 58;
const AVATAR_D = 48;   // avatar diameter (circular)
const AVATAR_PAD = 16; // left pad to avatar center
const TEXT_START = AVATAR_PAD + AVATAR_D + 14; // text x after avatar
const FOOTER_H = 30;

export async function generateLeaderboardCard(
  title: string,
  entries: LeaderboardEntry[],
): Promise<Buffer> {
  const rowCount = entries.length;
  const CARD_H = TITLE_H + rowCount * ROW_H + FOOTER_H;

  const canvas = createCanvas(CARD_W, CARD_H);
  const ctx = canvas.getContext("2d");

  // Draw rounded-corner background card
  ctx.fillStyle = CARD_BG;
  drawRoundRect(ctx, 0, 0, CARD_W, CARD_H, CORNER_R);
  ctx.fill();

  // Title
  ctx.fillStyle = TITLE_COLOR;
  ctx.font = "bold 24px sans-serif";
  ctx.fillText(title, PAD_X, TITLE_H - 18);

  // Rows
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const rowY = TITLE_H + i * ROW_H;

    // No alternating backgrounds — Arcane has uniform card color
    // Avatar (circular)
    const avatarCX = AVATAR_PAD + AVATAR_D / 2;
    const avatarCY = rowY + ROW_H / 2;

    await drawCircleAvatar(ctx, e.avatarURL, avatarCX, avatarCY, AVATAR_D / 2);

    // All text on one baseline, vertically centered
    const textY = rowY + ROW_H / 2 + 7;

    // Rank — colored for top 3
    const rankColor = RANK_COLORS[e.rank] ?? RANK_DEFAULT;
    const rankStr = `#${e.rank}`;
    ctx.font = "bold 17px sans-serif";
    ctx.fillStyle = rankColor;
    ctx.fillText(rankStr, TEXT_START, textY);
    const rankW = ctx.measureText(rankStr).width;

    // " • " separator
    const sep = " \u2022 ";
    ctx.font = "17px sans-serif";
    ctx.fillStyle = SEP_COLOR;
    ctx.fillText(sep, TEXT_START + rankW, textY);
    const sep1W = ctx.measureText(sep).width;

    // @username
    const nameStr = `@${e.username}`;
    ctx.font = "17px sans-serif";
    ctx.fillStyle = TEXT_COLOR;
    ctx.fillText(nameStr, TEXT_START + rankW + sep1W, textY);
    const nameW = ctx.measureText(nameStr).width;

    // " • " separator
    ctx.fillStyle = SEP_COLOR;
    ctx.fillText(sep, TEXT_START + rankW + sep1W + nameW, textY);
    const sep2W = ctx.measureText(sep).width;

    // Stats: "LVL: +X XP: +XX,XXX"
    const statsStr = `${e.col1Label}: ${e.col1Value} ${e.col2Label}: ${e.col2Value}`;
    const statsX = TEXT_START + rankW + sep1W + nameW + sep2W;
    const maxW = CARD_W - statsX - PAD_X;
    ctx.font = "17px sans-serif";
    ctx.fillStyle = TEXT_COLOR;
    ctx.fillText(truncateText(ctx, statsStr, maxW), statsX, textY);
  }

  // Footer — "Last Stand Management  ·  Apr 19, 2026"
  const footerY = TITLE_H + rowCount * ROW_H;
  const dateStr = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  ctx.font = "12px sans-serif";
  ctx.fillStyle = FOOTER_COLOR;
  ctx.fillText(`Last Stand Management  \u00b7  ${dateStr}`, PAD_X, footerY + 19);

  return canvas.toBuffer("image/png");
}

async function drawCircleAvatar(
  ctx: ReturnType<ReturnType<typeof createCanvas>["getContext"]>,
  url: string | null,
  cx: number,
  cy: number,
  r: number,
): Promise<void> {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  if (url) {
    try {
      const imgUrl = url.includes("?") ? url : `${url}?size=64`;
      const img = await loadImage(imgUrl);
      ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2);
    } catch {
      drawAvatarFallback(ctx, cx, cy, r);
    }
  } else {
    drawAvatarFallback(ctx, cx, cy, r);
  }

  ctx.restore();
}

function drawAvatarFallback(
  ctx: ReturnType<ReturnType<typeof createCanvas>["getContext"]>,
  cx: number,
  cy: number,
  r: number,
): void {
  const g = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
  g.addColorStop(0, "#4f545c");
  g.addColorStop(1, "#36393f");
  ctx.fillStyle = g;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
}

function drawRoundRect(
  ctx: ReturnType<ReturnType<typeof createCanvas>["getContext"]>,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function truncateText(
  ctx: ReturnType<ReturnType<typeof createCanvas>["getContext"]>,
  text: string,
  maxWidth: number,
): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 0 && ctx.measureText(t + "\u2026").width > maxWidth) {
    t = t.slice(0, -1);
  }
  return t + "\u2026";
}
