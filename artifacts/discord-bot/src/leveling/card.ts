import { createCanvas, loadImage } from "@napi-rs/canvas";

export async function generateLevelUpCard(
  avatarURL: string,
  oldLevel: number,
  newLevel: number,
): Promise<Buffer> {
  const W = 560;
  const H = 180;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  // Background — dark card
  ctx.fillStyle = "#111214";
  roundRect(ctx, 0, 0, W, H, 18);
  ctx.fill();

  // Subtle inner border for depth
  ctx.strokeStyle = "#2a2d33";
  ctx.lineWidth = 1.5;
  roundRect(ctx, 1, 1, W - 2, H - 2, 17);
  ctx.stroke();

  // Accent line on left side
  ctx.fillStyle = "#5865f2";
  roundRect(ctx, 0, 0, 5, H, 3);
  ctx.fill();

  // Avatar
  const avatarSize = 130;
  const avatarPad = 25;
  const avatarCX = avatarPad + avatarSize / 2;
  const avatarCY = H / 2;

  // Avatar shadow
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = 12;
  ctx.fillStyle = "#2f3136";
  ctx.beginPath();
  ctx.arc(avatarCX, avatarCY, avatarSize / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Draw avatar image (circular clip)
  try {
    const img = await loadImage(avatarURL + "?size=128");
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarCX, avatarCY, avatarSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(img, avatarPad, avatarCY - avatarSize / 2, avatarSize, avatarSize);
    ctx.restore();
  } catch {
    // Fallback gradient circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarCX, avatarCY, avatarSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    const grad = ctx.createRadialGradient(avatarCX, avatarCY, 10, avatarCX, avatarCY, avatarSize / 2);
    grad.addColorStop(0, "#4f545c");
    grad.addColorStop(1, "#2f3136");
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();
  }

  // Avatar ring
  ctx.strokeStyle = "#5865f2";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(avatarCX, avatarCY, avatarSize / 2 + 2, 0, Math.PI * 2);
  ctx.stroke();

  // Text area
  const textX = avatarPad + avatarSize + 28;

  // "Level-up!" title
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 54px sans-serif";
  ctx.fillText("Level-up!", textX, H / 2 - 2);

  // "OLD • NEW" levels
  ctx.fillStyle = "#b5b9bf";
  ctx.font = "bold 38px sans-serif";
  const levelText = `${oldLevel} • ${newLevel}`;
  ctx.fillText(levelText, textX, H / 2 + 44);

  return canvas.toBuffer("image/png");
}

function roundRect(
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
