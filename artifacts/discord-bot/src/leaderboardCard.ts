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

// ─── Colors (exact Arcane palette) ───────────────────────────────────────────
const C = {
  cardBg:   "#2b2d31",   // outer card
  rowBg:    "#1e2124",   // each row container (darker inset)
  white:    "#ffffff",
  sep:      "#b0b3b8",   // bullet separator – slightly muted
  footer:   "#72767d",
  rank1:    "#f0a832",   // gold
  rank2:    "#c8ccd0",   // silver
  rank3:    "#cd7f32",   // bronze
  rankDef:  "#ffffff",
};

// ─── Layout grid (all in LOGICAL px; canvas rendered at 2× for crispness) ─────
const S = 2; // retina scale

// logical dimensions
const CW       = 660;   // card width
const CRAD     = 14;    // card corner radius
const PAD_X    = 14;    // card horizontal padding
const PAD_TOP  = 22;    // padding above title
const TITLE_FS = 32;    // title font size
const TITLE_MB = 18;    // margin below title

const ROW_H    = 64;    // row height (inner box)
const ROW_GAP  = 5;     // gap between rows
const ROW_PADX = 12;    // row horizontal inset from card edge
const ROW_PADY = 0;     // row vertical padding (centred inside)
const ROW_RAD  = 10;    // row corner radius

const AV_SIZE  = 52;    // avatar square side
const AV_RAD   = 9;     // avatar corner radius
const AV_MX    = 10;    // avatar margin inside row (left)
const AV_GAP   = 12;    // gap from avatar right edge to text

const RANK_FS  = 20;    // rank number font size (bold)
const TEXT_FS  = 19;    // text font size
const SEP      = "  •  ";

const FOOTER_H = 34;    // footer section height
const FOOTER_FS= 13;

// ─── Derived ─────────────────────────────────────────────────────────────────
// text x inside card = row left inset + avatar margin + avatar width + gap
const TEXT_X = PAD_X + ROW_PADX + AV_MX + AV_SIZE + AV_GAP;

export async function generateLeaderboardCard(
  title: string,
  entries: LeaderboardEntry[],
): Promise<Buffer> {
  // total logical height
  const titleSection = PAD_TOP + TITLE_FS + TITLE_MB;
  const rowsSection  = entries.length * (ROW_H + ROW_GAP) - ROW_GAP;
  const CH = titleSection + rowsSection + PAD_TOP + FOOTER_H;

  // create canvas at 2× resolution
  const cw = CW * S;
  const ch = CH * S;
  const canvas = createCanvas(cw, ch);
  const ctx    = canvas.getContext("2d");

  // helper: scale a value
  const p = (v: number) => v * S;

  // ── Outer card background ──────────────────────────────────────────────────
  ctx.fillStyle = C.cardBg;
  rrect(ctx, 0, 0, p(CW), p(CH), p(CRAD));
  ctx.fill();

  // ── Title ──────────────────────────────────────────────────────────────────
  ctx.fillStyle = C.white;
  ctx.font      = `bold ${p(TITLE_FS)}px sans-serif`;
  ctx.fillText(title, p(PAD_X + ROW_PADX), p(PAD_TOP + TITLE_FS));

  // ── Rows ───────────────────────────────────────────────────────────────────
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const rowY = titleSection + i * (ROW_H + ROW_GAP);

    // Row container
    ctx.fillStyle = C.rowBg;
    rrect(
      ctx,
      p(PAD_X),
      p(rowY),
      p(CW - PAD_X * 2),
      p(ROW_H),
      p(ROW_RAD),
    );
    ctx.fill();

    // Avatar
    const avX = PAD_X + ROW_PADX + AV_MX;
    const avY = rowY + (ROW_H - AV_SIZE) / 2;
    await drawAvatar(ctx, e.avatarURL, p(avX), p(avY), p(AV_SIZE), p(AV_RAD));

    // Text baseline (vertically centred in row)
    const textY = p(rowY + ROW_H / 2 + TEXT_FS * 0.36);

    // Rank
    const rankColor =
      e.rank === 1 ? C.rank1 :
      e.rank === 2 ? C.rank2 :
      e.rank === 3 ? C.rank3 : C.rankDef;

    ctx.font      = `bold ${p(RANK_FS)}px sans-serif`;
    ctx.fillStyle = rankColor;
    const rankStr = `#${e.rank}`;
    ctx.fillText(rankStr, p(TEXT_X), textY);
    let curX = p(TEXT_X) + ctx.measureText(rankStr).width;

    // separator
    ctx.font      = `${p(TEXT_FS)}px sans-serif`;
    ctx.fillStyle = C.sep;
    ctx.fillText(SEP, curX, textY);
    curX += ctx.measureText(SEP).width;

    // @username  (bold so it matches Arcane visual weight)
    ctx.font      = `bold ${p(TEXT_FS)}px sans-serif`;
    ctx.fillStyle = C.white;
    const nameStr = `@${e.username}`;
    ctx.fillText(nameStr, curX, textY);
    curX += ctx.measureText(nameStr).width;

    // separator
    ctx.font      = `${p(TEXT_FS)}px sans-serif`;
    ctx.fillStyle = C.sep;
    ctx.fillText(SEP, curX, textY);
    curX += ctx.measureText(SEP).width;

    // Stats — bold+white like Arcane
    ctx.font      = `bold ${p(TEXT_FS)}px sans-serif`;
    ctx.fillStyle = C.white;
    const statsStr = `${e.col1Label}: ${e.col1Value} ${e.col2Label}: ${e.col2Value}`;
    const maxW     = p(CW) - curX - p(PAD_X + ROW_PADX);
    ctx.fillText(ellipsis(ctx, statsStr, maxW), curX, textY);
  }

  // ── Footer ─────────────────────────────────────────────────────────────────
  const footerY = titleSection + rowsSection + PAD_TOP;
  const dateStr = new Date().toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
  ctx.font      = `${p(FOOTER_FS)}px sans-serif`;
  ctx.fillStyle = C.footer;
  ctx.fillText(
    `Last Stand Management  ·  ${dateStr}`,
    p(PAD_X + ROW_PADX),
    p(footerY + FOOTER_H * 0.65),
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
  x: number, y: number,
  size: number, radius: number,
) {
  ctx.save();
  rrect(ctx, x, y, size, size, radius);
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
    // neutral fallback gradient
    const g = ctx.createLinearGradient(x, y, x + size, y + size);
    g.addColorStop(0, "#4f545c");
    g.addColorStop(1, "#36393f");
    ctx.fillStyle = g;
    ctx.fillRect(x, y, size, size);
  }
  ctx.restore();
}

function ellipsis(
  ctx: ReturnType<ReturnType<typeof createCanvas>["getContext"]>,
  text: string, maxW: number,
): string {
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (t.length && ctx.measureText(t + "…").width > maxW) t = t.slice(0, -1);
  return t + "…";
}
