import { createCanvas, loadImage, GlobalFonts } from "@napi-rs/canvas";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// ─── Register crisp fonts once ────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSET = join(__dirname, "assets");
GlobalFonts.registerFromPath(join(ASSET, "NotoSans-Regular.ttf"), "NotoSans");
GlobalFonts.registerFromPath(join(ASSET, "NotoSans-Bold.ttf"),    "NotoSans");

export interface LeaderboardEntry {
  rank: number;
  avatarURL: string | null;
  username: string;
  col1Label: string;
  col1Value: string;
  col2Label: string;
  col2Value: string;
}

// ─── Exact Arcane palette ─────────────────────────────────────────────────────
const CLR = {
  cardBg:  "#2b2d31",   // outer card  (matches Discord embed bg)
  rowBg:   "#1e2124",   // row inset   (clearly darker)
  rowBdr:  "#111214",   // row bottom shadow line
  white:   "#ffffff",
  bullet:  "#9a9ca0",   // muted bullet separator
  footer:  "#6a6c72",
  gold:    "#f0a832",
  silver:  "#b8bcc2",
  bronze:  "#cd7f32",
};

// ─── Layout – all values in LOGICAL px (canvas = 2× for retina sharpness) ─────
const S = 2; // retina multiplier

// Card
const CW     = 500;   // logical card width  – matches Arcane embed width
const CRAD   = 14;

// Title section
const T_PAD_TOP  = 24;
const T_PAD_SIDE = 20;
const T_FONT     = 34;   // big bold title
const T_PAD_BOT  = 16;

// Rows
const ROW_H     = 66;   // row box height (logical)
const ROW_GAP   = 6;    // gap between rows
const ROW_PADX  = 14;   // inset from card edge
const ROW_RAD   = 10;
const AV_SIZE   = 54;   // avatar square
const AV_RAD    = 8;
const AV_LPAD   = 8;    // left padding inside row to avatar
const AV_RPAD   = 12;   // gap from avatar to text
const RANK_FONT = 21;   // rank "#N"
const TEXT_FONT = 20;   // rest of row text
const SEP       = "  •  ";
const ROW_PAD_BOT = 14;  // padding after last row, before footer

// Footer
const F_HEIGHT  = 36;
const F_FONT    = 13;

// ─── Convenience: text x = where row text starts (after avatar) ──────────────
const TEXT_X = ROW_PADX + AV_LPAD + AV_SIZE + AV_RPAD;

export async function generateLeaderboardCard(
  title: string,
  entries: LeaderboardEntry[],
): Promise<Buffer> {
  // ── compute card height ────────────────────────────────────────────────────
  const titleH = T_PAD_TOP + T_FONT + T_PAD_BOT;
  const rowsH  = entries.length * ROW_H + Math.max(0, entries.length - 1) * ROW_GAP;
  const CH     = titleH + rowsH + ROW_PAD_BOT + F_HEIGHT;

  const cw = CW * S;
  const ch = CH * S;

  const canvas = createCanvas(cw, ch);
  const ctx    = canvas.getContext("2d");

  const p = (v: number) => Math.round(v * S); // scale helper

  // ── Outer card ─────────────────────────────────────────────────────────────
  ctx.fillStyle = CLR.cardBg;
  rrect(ctx, 0, 0, p(CW), p(CH), p(CRAD));
  ctx.fill();

  // ── Title ──────────────────────────────────────────────────────────────────
  ctx.font      = `bold ${p(T_FONT)}px "NotoSans"`;
  ctx.fillStyle = CLR.white;
  ctx.fillText(title, p(T_PAD_SIDE), p(T_PAD_TOP + T_FONT));

  // ── Rows ───────────────────────────────────────────────────────────────────
  for (let i = 0; i < entries.length; i++) {
    const e    = entries[i];
    const rowY = titleH + i * (ROW_H + ROW_GAP);

    // Row background box
    ctx.fillStyle = CLR.rowBg;
    rrect(ctx, p(ROW_PADX), p(rowY), p(CW - ROW_PADX * 2), p(ROW_H), p(ROW_RAD));
    ctx.fill();

    // Thin bottom-shadow line for depth
    ctx.fillStyle = CLR.rowBdr;
    ctx.fillRect(p(ROW_PADX + 4), p(rowY + ROW_H - 1), p(CW - (ROW_PADX + 4) * 2), p(1));

    // Avatar (square + rounded corners)
    const avX = ROW_PADX + AV_LPAD;
    const avY = rowY + (ROW_H - AV_SIZE) / 2;
    await drawAvatar(ctx, e.avatarURL, p(avX), p(avY), p(AV_SIZE), p(AV_RAD));

    // Vertical text centre baseline
    const tY = p(rowY + ROW_H / 2 + TEXT_FONT * 0.36);

    // -- Rank
    const rankColor =
      e.rank === 1 ? CLR.gold :
      e.rank === 2 ? CLR.silver :
      e.rank === 3 ? CLR.bronze : CLR.white;

    ctx.font      = `bold ${p(RANK_FONT)}px "NotoSans"`;
    ctx.fillStyle = rankColor;
    const rankStr = `#${e.rank}`;
    ctx.fillText(rankStr, p(TEXT_X), tY);
    let cx = p(TEXT_X) + ctx.measureText(rankStr).width;

    // -- Bullet
    ctx.font      = `${p(TEXT_FONT)}px "NotoSans"`;
    ctx.fillStyle = CLR.bullet;
    ctx.fillText(SEP, cx, tY);
    cx += ctx.measureText(SEP).width;

    // -- @username (bold, white)
    ctx.font      = `bold ${p(TEXT_FONT)}px "NotoSans"`;
    ctx.fillStyle = CLR.white;
    const name = `@${e.username}`;
    ctx.fillText(name, cx, tY);
    cx += ctx.measureText(name).width;

    // -- Bullet
    ctx.font      = `${p(TEXT_FONT)}px "NotoSans"`;
    ctx.fillStyle = CLR.bullet;
    ctx.fillText(SEP, cx, tY);
    cx += ctx.measureText(SEP).width;

    // -- Stats (bold white to match Arcane weight)
    ctx.font      = `bold ${p(TEXT_FONT)}px "NotoSans"`;
    ctx.fillStyle = CLR.white;
    const stats = `${e.col1Label}: ${e.col1Value} ${e.col2Label}: ${e.col2Value}`;
    const maxW  = p(CW) - cx - p(ROW_PADX + 4);
    ctx.fillText(clip(ctx, stats, maxW), cx, tY);
  }

  // ── Footer ─────────────────────────────────────────────────────────────────
  const fY = titleH + rowsH + ROW_PAD_BOT;
  const dt = new Date().toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
  ctx.font      = `${p(F_FONT)}px "NotoSans"`;
  ctx.fillStyle = CLR.footer;
  ctx.fillText(
    `Last Stand Management  ·  ${dt}`,
    p(T_PAD_SIDE),
    p(fY + F_HEIGHT * 0.7),
  );

  return canvas.toBuffer("image/png");
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function rrect(
  ctx: ReturnType<ReturnType<typeof createCanvas>["getContext"]>,
  x: number, y: number, w: number, h: number, r: number,
) {
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

async function drawAvatar(
  ctx: ReturnType<ReturnType<typeof createCanvas>["getContext"]>,
  url: string | null,
  x: number, y: number, size: number, r: number,
) {
  ctx.save();
  rrect(ctx, x, y, size, size, r);
  ctx.clip();

  let ok = false;
  if (url) {
    try {
      const src = url.replace(/\?.*$/, "") + "?size=128";
      const img = await loadImage(src);
      ctx.drawImage(img, x, y, size, size);
      ok = true;
    } catch { /* fallback */ }
  }
  if (!ok) {
    const g = ctx.createLinearGradient(x, y, x + size, y + size);
    g.addColorStop(0, "#4f545c");
    g.addColorStop(1, "#36393f");
    ctx.fillStyle = g;
    ctx.fillRect(x, y, size, size);
  }
  ctx.restore();
}

function clip(
  ctx: ReturnType<ReturnType<typeof createCanvas>["getContext"]>,
  text: string, maxW: number,
): string {
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (t.length && ctx.measureText(t + "…").width > maxW) t = t.slice(0, -1);
  return t + "…";
}
