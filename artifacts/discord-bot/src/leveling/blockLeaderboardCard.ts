import { createCanvas, loadImage } from "@napi-rs/canvas";

export interface BlockEntry {
  rank: number;
  avatarURL: string | null;
  username: string;
  col1Label: string;
  col1Value: string;
  col2Label: string;
  col2Value: string;
}

const C = {
  panel:   "#2b2d31",
  white:   "#ffffff",
  text:    "#e6e7e9",
  sep:     "#4f545c",
  footer:  "#72767d",
  rank1:   "#f0a832",
  rank2:   "#c8ccd0",
  rank3:   "#cd7f32",
  rankDef: "#dcddde",
};

const S = 2;

const CW         = 960;
const CRAD       = 18;
const PAD_X      = 36;
const PAD_TOP    = 40;
const TITLE_FS   = 44;
const TITLE_MB   = 44;

const ROW_H      = 96;
const ROW_GAP    = 28;

const AV_SIZE    = 70;
const AV_RAD     = 12;
const AV_GAP     = 26;

const RANK_W     = 80;
const RANK_FS    = 32;
const NAME_FS    = 32;
const STAT_FS    = 26;

const FOOTER_H   = 50;
const FOOTER_FS  = 16;

const SEP        = "   •   ";

export async function generateBlockLeaderboardCard(
  title: string,
  entries: BlockEntry[],
): Promise<Buffer> {
  const titleSection = PAD_TOP + TITLE_FS + TITLE_MB;
  const rowsSection  = entries.length * (ROW_H + ROW_GAP) - ROW_GAP;
  const CH = titleSection + Math.max(0, rowsSection) + PAD_TOP + FOOTER_H;

  const cw = CW * S;
  const ch = CH * S;
  const canvas = createCanvas(cw, ch);
  const ctx    = canvas.getContext("2d");
  const p = (v: number) => v * S;

  // Outer panel only — no row containers
  ctx.fillStyle = C.panel;
  rrect(ctx, 0, 0, p(CW), p(CH), p(CRAD));
  ctx.fill();

  // Title
  ctx.fillStyle = C.white;
  ctx.font      = `900 ${p(TITLE_FS)}px sans-serif`;
  ctx.fillText(title, p(PAD_X), p(PAD_TOP + TITLE_FS));

  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const rowY = titleSection + i * (ROW_H + ROW_GAP);
    const baselineY = p(rowY + ROW_H / 2 + STAT_FS * 0.36);

    // Avatar (first position, like Arcane)
    const avX = PAD_X;
    const avY = rowY + (ROW_H - AV_SIZE) / 2;
    await drawAvatar(ctx, e.avatarURL, p(avX), p(avY), p(AV_SIZE), p(AV_RAD));

    // Rank (after avatar, colored for top 3)
    const rankColor =
      e.rank === 1 ? C.rank1 :
      e.rank === 2 ? C.rank2 :
      e.rank === 3 ? C.rank3 : C.rankDef;

    let curX = p(avX + AV_SIZE + AV_GAP);
    ctx.font      = `bold ${p(RANK_FS)}px sans-serif`;
    ctx.fillStyle = rankColor;
    const rankStr = `#${e.rank}`;
    const rankStart = curX;
    ctx.fillText(rankStr, curX, baselineY);
    curX = rankStart + p(RANK_W);

    // Separator
    ctx.font      = `${p(NAME_FS)}px sans-serif`;
    ctx.fillStyle = C.sep;
    ctx.fillText(SEP, curX, baselineY);
    curX += ctx.measureText(SEP).width;

    // Username (strongest)
    ctx.font      = `bold ${p(NAME_FS)}px sans-serif`;
    ctx.fillStyle = C.white;
    const nameStr = `@${e.username}`;
    ctx.fillText(nameStr, curX, baselineY);
    curX += ctx.measureText(nameStr).width;

    // Separator
    ctx.font      = `${p(STAT_FS)}px sans-serif`;
    ctx.fillStyle = C.sep;
    ctx.fillText(SEP, curX, baselineY);
    curX += ctx.measureText(SEP).width;

    // Stats — readable but secondary
    ctx.font      = `bold ${p(STAT_FS)}px sans-serif`;
    ctx.fillStyle = C.text;
    const statsStr = `${e.col1Label}: ${e.col1Value}${SEP}${e.col2Label}: ${e.col2Value}`;
    const maxW = p(CW) - curX - p(PAD_X);
    ctx.fillText(ellipsis(ctx, statsStr, maxW), curX, baselineY);
  }

  // Footer
  const footerY = titleSection + Math.max(0, rowsSection) + PAD_TOP;
  ctx.font      = `${p(FOOTER_FS)}px sans-serif`;
  ctx.fillStyle = C.footer;
  ctx.fillText(
    `Last Stand Management   •   ${new Date().toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    })}`,
    p(PAD_X),
    p(footerY + FOOTER_H * 0.65),
  );

  return canvas.toBuffer("image/png");
}

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
