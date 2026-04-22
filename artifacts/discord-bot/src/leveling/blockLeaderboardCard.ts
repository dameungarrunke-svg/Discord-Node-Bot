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
  cardBg:  "#2b2d31",
  rowBg:   "#1e2124",
  white:   "#ffffff",
  muted:   "#b9bbbe",
  footer:  "#72767d",
  rank1:   "#f0a832",
  rank2:   "#c8ccd0",
  rank3:   "#cd7f32",
  rankDef: "#ffffff",
};

const S = 2;

const CW         = 760;
const CRAD       = 18;
const PAD_X      = 22;
const PAD_TOP    = 30;
const TITLE_FS   = 36;
const TITLE_MB   = 26;

const ROW_H      = 110;
const ROW_GAP    = 14;
const ROW_PADX   = 4;
const ROW_RAD    = 14;

const AV_SIZE    = 78;
const AV_RAD     = 14;
const AV_MX      = 18;
const AV_GAP     = 22;

const RANK_FS    = 26;
const NAME_FS    = 24;
const STAT_FS    = 22;
const LINE_GAP   = 12;

const FOOTER_H   = 44;
const FOOTER_FS  = 14;

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

  // ── Outer card ─────────────────────────────────────────────────────────────
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
    rrect(ctx, p(PAD_X), p(rowY), p(CW - PAD_X * 2), p(ROW_H), p(ROW_RAD));
    ctx.fill();

    // Avatar (vertically centred)
    const avX = PAD_X + ROW_PADX + AV_MX;
    const avY = rowY + (ROW_H - AV_SIZE) / 2;
    await drawAvatar(ctx, e.avatarURL, p(avX), p(avY), p(AV_SIZE), p(AV_RAD));

    const textX = avX + AV_SIZE + AV_GAP;
    const blockH = NAME_FS + LINE_GAP + STAT_FS;
    const topY = rowY + (ROW_H - blockH) / 2 + NAME_FS;

    // Top line: #rank  @username
    const rankColor =
      e.rank === 1 ? C.rank1 :
      e.rank === 2 ? C.rank2 :
      e.rank === 3 ? C.rank3 : C.rankDef;

    ctx.font      = `bold ${p(RANK_FS)}px sans-serif`;
    ctx.fillStyle = rankColor;
    const rankStr = `#${e.rank}`;
    ctx.fillText(rankStr, p(textX), p(topY));
    let curX = p(textX) + ctx.measureText(rankStr).width + p(14);

    ctx.font      = `bold ${p(NAME_FS)}px sans-serif`;
    ctx.fillStyle = C.white;
    const nameStr = `@${e.username}`;
    const nameMaxW = p(CW) - curX - p(PAD_X + ROW_PADX + AV_MX);
    ctx.fillText(ellipsis(ctx, nameStr, nameMaxW), curX, p(topY));

    // Bottom line: LVL: +X    XP: +Y
    const bottomY = topY + LINE_GAP + STAT_FS;
    ctx.font      = `${p(STAT_FS)}px sans-serif`;
    ctx.fillStyle = C.muted;
    const labelLvl = `${e.col1Label}: `;
    const labelXp  = `   ${e.col2Label}: `;

    let bx = p(textX);
    ctx.fillText(labelLvl, bx, p(bottomY));
    bx += ctx.measureText(labelLvl).width;

    ctx.font      = `bold ${p(STAT_FS)}px sans-serif`;
    ctx.fillStyle = C.white;
    ctx.fillText(e.col1Value, bx, p(bottomY));
    bx += ctx.measureText(e.col1Value).width;

    ctx.font      = `${p(STAT_FS)}px sans-serif`;
    ctx.fillStyle = C.muted;
    ctx.fillText(labelXp, bx, p(bottomY));
    bx += ctx.measureText(labelXp).width;

    ctx.font      = `bold ${p(STAT_FS)}px sans-serif`;
    ctx.fillStyle = C.white;
    ctx.fillText(e.col2Value, bx, p(bottomY));
  }

  // ── Footer ─────────────────────────────────────────────────────────────────
  const footerY = titleSection + Math.max(0, rowsSection) + PAD_TOP;
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
