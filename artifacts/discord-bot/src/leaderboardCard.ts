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

// ── Exact colors from Arcane reference ────────────────────────────────────────
const RANK_COLORS: Record<number, string> = {
  1: "#f0a832",
  2: "#c0c0c0",
  3: "#cd7f32",
};
const CARD_BG      = "#2b2d31";
const TEXT_WHITE   = "#ffffff";
const FOOTER_GRAY  = "#72767d";

// ── Layout (logical px — everything rendered at 2× for crispness) ─────────────
const S           = 2;          // scale factor
const L_CARD_W    = 660;        // logical card width
const L_PAD_X     = 22;
const L_TITLE_H   = 88;         // space from top to first row
const L_ROW_H     = 68;
const L_AVATAR    = 58;         // avatar square side
const L_AV_CORNER = 9;          // avatar corner radius
const L_AV_LEFT   = 18;         // avatar left edge x
const L_TEXT_OFF  = L_AV_LEFT + L_AVATAR + 14; // text x start
const L_FOOTER_H  = 34;

// ── Scaled values ─────────────────────────────────────────────────────────────
const CARD_W    = L_CARD_W    * S;
const PAD_X     = L_PAD_X     * S;
const TITLE_H   = L_TITLE_H   * S;
const ROW_H     = L_ROW_H     * S;
const AVATAR    = L_AVATAR    * S;
const AV_CORNER = L_AV_CORNER * S;
const AV_LEFT   = L_AV_LEFT   * S;
const TEXT_OFF  = L_TEXT_OFF  * S;
const FOOTER_H  = L_FOOTER_H  * S;

export async function generateLeaderboardCard(
  title: string,
  entries: LeaderboardEntry[],
): Promise<Buffer> {
  const CARD_H = TITLE_H + entries.length * ROW_H + FOOTER_H;

  const canvas = createCanvas(CARD_W, CARD_H);
  const ctx    = canvas.getContext("2d");

  // ── Background ──────────────────────────────────────────────────────────────
  ctx.fillStyle = CARD_BG;
  roundFill(ctx, 0, 0, CARD_W, CARD_H, 12 * S);

  // ── Title ───────────────────────────────────────────────────────────────────
  ctx.fillStyle = TEXT_WHITE;
  ctx.font      = `bold ${28 * S}px sans-serif`;
  ctx.fillText(title, PAD_X, TITLE_H - 22 * S);

  // ── Rows ────────────────────────────────────────────────────────────────────
  for (let i = 0; i < entries.length; i++) {
    const e    = entries[i];
    const rowY = TITLE_H + i * ROW_H;

    // Avatar (square, rounded corners)
    const avY = rowY + (ROW_H - AVATAR) / 2;
    await drawRoundAvatar(ctx, e.avatarURL, AV_LEFT, avY, AVATAR, AV_CORNER);

    // Text baseline — vertically centred in row
    const textY = rowY + ROW_H / 2 + 7 * S;

    // Rank
    const rankColor = RANK_COLORS[e.rank] ?? TEXT_WHITE;
    const rankStr   = `#${e.rank}`;
    ctx.font      = `bold ${18 * S}px sans-serif`;
    ctx.fillStyle = rankColor;
    ctx.fillText(rankStr, TEXT_OFF, textY);
    let curX = TEXT_OFF + ctx.measureText(rankStr).width;

    // " • " separator
    const sep = " \u2022 ";
    ctx.font      = `${18 * S}px sans-serif`;
    ctx.fillStyle = TEXT_WHITE;
    ctx.fillText(sep, curX, textY);
    curX += ctx.measureText(sep).width;

    // @username
    const nameStr = `@${e.username}`;
    ctx.fillText(nameStr, curX, textY);
    curX += ctx.measureText(nameStr).width;

    // " • " separator
    ctx.fillText(sep, curX, textY);
    curX += ctx.measureText(sep).width;

    // Stats  "LVL: +X XP: +XX,XXX"
    const statsStr = `${e.col1Label}: ${e.col1Value} ${e.col2Label}: ${e.col2Value}`;
    const maxW     = CARD_W - curX - PAD_X;
    ctx.fillText(clip(ctx, statsStr, maxW), curX, textY);
  }

  // ── Footer ──────────────────────────────────────────────────────────────────
  const footerY = TITLE_H + entries.length * ROW_H;
  const dateStr = new Date().toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
  ctx.font      = `${12 * S}px sans-serif`;
  ctx.fillStyle = FOOTER_GRAY;
  ctx.fillText(
    `Last Stand Management  \u00b7  ${dateStr}`,
    PAD_X,
    footerY + 20 * S,
  );

  return canvas.toBuffer("image/png");
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function drawRoundAvatar(
  ctx: ReturnType<ReturnType<typeof createCanvas>["getContext"]>,
  url: string | null,
  x: number,
  y: number,
  size: number,
  r: number,
): Promise<void> {
  ctx.save();
  roundPath(ctx, x, y, size, size, r);
  ctx.clip();

  let drawn = false;
  if (url) {
    try {
      const src = url.includes("?") ? url : `${url}?size=128`;
      const img = await loadImage(src);
      ctx.drawImage(img, x, y, size, size);
      drawn = true;
    } catch { /* fall through */ }
  }
  if (!drawn) {
    const g = ctx.createLinearGradient(x, y, x + size, y + size);
    g.addColorStop(0, "#4f545c");
    g.addColorStop(1, "#36393f");
    ctx.fillStyle = g;
    ctx.fillRect(x, y, size, size);
  }

  ctx.restore();
}

function roundPath(
  ctx: ReturnType<ReturnType<typeof createCanvas>["getContext"]>,
  x: number, y: number, w: number, h: number, r: number,
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

function roundFill(
  ctx: ReturnType<ReturnType<typeof createCanvas>["getContext"]>,
  x: number, y: number, w: number, h: number, r: number,
): void {
  roundPath(ctx, x, y, w, h, r);
  ctx.fill();
}

function clip(
  ctx: ReturnType<ReturnType<typeof createCanvas>["getContext"]>,
  text: string,
  maxW: number,
): string {
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (t.length > 0 && ctx.measureText(`${t}\u2026`).width > maxW) t = t.slice(0, -1);
  return `${t}\u2026`;
}
