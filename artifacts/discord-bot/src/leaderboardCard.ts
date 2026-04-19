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

const RANK_COLORS: Record<number, string> = {
  1: "#f0a832",
  2: "#c8c8c8",
  3: "#cd7f32",
};

const BG = "#1e2124";
const ROW_BG_ODD = "#252830";
const ROW_BG_EVEN = "#1e2124";
const TEXT_WHITE = "#ffffff";
const TEXT_MUTED = "#b0b3b9";
const ACCENT = "#5865f2";

const ROW_H = 56;
const AVATAR_SIZE = 38;
const PAD_X = 22;
const TITLE_H = 72;
const FOOTER_H = 28;
const WIDTH = 560;

export async function generateLeaderboardCard(
  title: string,
  entries: LeaderboardEntry[],
): Promise<Buffer> {
  const rowCount = entries.length;
  const H = TITLE_H + rowCount * ROW_H + FOOTER_H;
  const canvas = createCanvas(WIDTH, H);
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, WIDTH, H);

  // Top accent bar
  ctx.fillStyle = ACCENT;
  ctx.fillRect(0, 0, WIDTH, 4);

  // Title
  ctx.fillStyle = TEXT_WHITE;
  ctx.font = "bold 26px sans-serif";
  ctx.fillText(title, PAD_X, TITLE_H - 20);

  // Rows
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const y = TITLE_H + i * ROW_H;

    // Row background (alternating)
    ctx.fillStyle = i % 2 === 0 ? ROW_BG_EVEN : ROW_BG_ODD;
    ctx.fillRect(0, y, WIDTH, ROW_H);

    // Avatar
    const avatarX = PAD_X;
    const avatarY = y + (ROW_H - AVATAR_SIZE) / 2;

    await drawAvatar(ctx, entry.avatarURL, avatarX, avatarY, AVATAR_SIZE);

    // Layout: avatar | rank • @username • col1 col2
    const textX = avatarX + AVATAR_SIZE + 14;
    const textY = y + ROW_H / 2 + 7;

    // Rank number (colored)
    const rankColor = RANK_COLORS[entry.rank] ?? TEXT_WHITE;
    const rankStr = `#${entry.rank}`;
    ctx.font = "bold 18px sans-serif";
    ctx.fillStyle = rankColor;
    ctx.fillText(rankStr, textX, textY);

    const rankW = ctx.measureText(rankStr).width;

    // Separator " • "
    ctx.fillStyle = TEXT_MUTED;
    ctx.font = "16px sans-serif";
    const sep = " • ";
    const sepW = ctx.measureText(sep).width;
    ctx.fillText(sep, textX + rankW, textY);

    // @Username
    ctx.font = "bold 17px sans-serif";
    ctx.fillStyle = TEXT_WHITE;
    const nameStr = `@${entry.username}`;
    const nameW = ctx.measureText(nameStr).width;
    ctx.fillText(nameStr, textX + rankW + sepW, textY);

    // Separator " • "
    ctx.fillStyle = TEXT_MUTED;
    ctx.font = "16px sans-serif";
    const sep2W = ctx.measureText(sep).width;
    ctx.fillText(sep, textX + rankW + sepW + nameW, textY);

    // Stats (col1 and col2)
    const statsX = textX + rankW + sepW + nameW + sep2W;
    ctx.font = "16px sans-serif";
    ctx.fillStyle = TEXT_MUTED;

    const statsStr = `${entry.col1Label}: ${entry.col1Value}  ${entry.col2Label}: ${entry.col2Value}`;
    // Truncate if too long
    const maxStatsW = WIDTH - statsX - PAD_X;
    const truncated = truncateText(ctx, statsStr, maxStatsW);
    ctx.fillText(truncated, statsX, textY);
  }

  // Footer
  const footerY = TITLE_H + rowCount * ROW_H;
  ctx.fillStyle = "#16181b";
  ctx.fillRect(0, footerY, WIDTH, FOOTER_H);
  ctx.fillStyle = TEXT_MUTED;
  ctx.font = "13px sans-serif";
  ctx.fillText(
    `Last Stand Management  ·  ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
    PAD_X,
    footerY + 18,
  );

  return canvas.toBuffer("image/png");
}

async function drawAvatar(
  ctx: ReturnType<ReturnType<typeof createCanvas>["getContext"]>,
  url: string | null,
  x: number,
  y: number,
  size: number,
): Promise<void> {
  const radius = 5;

  ctx.save();
  // Clipping rounded rect
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + size - radius, y);
  ctx.quadraticCurveTo(x + size, y, x + size, y + radius);
  ctx.lineTo(x + size, y + size - radius);
  ctx.quadraticCurveTo(x + size, y + size, x + size - radius, y + size);
  ctx.lineTo(x + radius, y + size);
  ctx.quadraticCurveTo(x, y + size, x, y + size - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.clip();

  if (url) {
    try {
      const img = await loadImage(url.includes("?") ? url : url + "?size=64");
      ctx.drawImage(img, x, y, size, size);
    } catch {
      drawFallbackAvatar(ctx, x, y, size);
    }
  } else {
    drawFallbackAvatar(ctx, x, y, size);
  }

  ctx.restore();
}

function drawFallbackAvatar(
  ctx: ReturnType<ReturnType<typeof createCanvas>["getContext"]>,
  x: number,
  y: number,
  size: number,
): void {
  const grad = ctx.createLinearGradient(x, y, x + size, y + size);
  grad.addColorStop(0, "#4f545c");
  grad.addColorStop(1, "#36393f");
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, size, size);
}

function truncateText(
  ctx: ReturnType<ReturnType<typeof createCanvas>["getContext"]>,
  text: string,
  maxWidth: number,
): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 0 && ctx.measureText(t + "…").width > maxWidth) {
    t = t.slice(0, -1);
  }
  return t + "…";
}
