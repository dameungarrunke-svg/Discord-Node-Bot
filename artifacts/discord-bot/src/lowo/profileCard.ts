import { createCanvas, loadImage, GlobalFonts, type SKRSContext2D } from "@napi-rs/canvas";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import type { User } from "discord.js";
import { getUser } from "./storage.js";
import { BACKGROUND_BY_ID, type BgPattern } from "./data.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let fontsRegistered = false;
function registerFonts(): void {
  if (fontsRegistered) return;
  fontsRegistered = true;
  try {
    const reg = resolve(__dirname, "../assets/NotoSans-Regular.ttf");
    const bold = resolve(__dirname, "../assets/NotoSans-Bold.ttf");
    if (existsSync(reg))  GlobalFonts.registerFromPath(reg, "NotoSans");
    if (existsSync(bold)) GlobalFonts.registerFromPath(bold, "NotoSansBold");
  } catch { /* fonts optional */ }
}

function roundRect(ctx: SKRSContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ─── Background pattern overlays (deterministic, lightweight) ────────────────
function drawPattern(ctx: SKRSContext2D, W: number, H: number, pat: BgPattern, accent: string): void {
  ctx.save();
  switch (pat) {
    case "stars": {
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      // Pseudo-random but deterministic stars
      for (let i = 0; i < 90; i++) {
        const x = (i * 73 + 17) % W;
        const y = (i * 137 + 29) % H;
        const r = 0.5 + ((i * 41) % 10) / 10 * 1.4;
        ctx.globalAlpha = 0.25 + ((i * 23) % 10) / 10 * 0.6;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }
      break;
    }
    case "hex": {
      ctx.strokeStyle = "rgba(255,255,255,0.07)";
      ctx.lineWidth = 1;
      const s = 22;
      for (let row = -1; row * s * 1.5 < H + s; row++) {
        for (let col = -1; col * s * Math.sqrt(3) < W + s; col++) {
          const cx = col * s * Math.sqrt(3) + (row % 2 ? s * Math.sqrt(3) / 2 : 0);
          const cy = row * s * 1.5;
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const a = (Math.PI / 3) * i + Math.PI / 6;
            const px = cx + s * Math.cos(a);
            const py = cy + s * Math.sin(a);
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
          }
          ctx.closePath(); ctx.stroke();
        }
      }
      break;
    }
    case "waves": {
      ctx.strokeStyle = "rgba(255,255,255,0.10)";
      ctx.lineWidth = 1.5;
      for (let y = 30; y < H; y += 28) {
        ctx.beginPath();
        for (let x = 0; x <= W; x += 6) {
          const yy = y + Math.sin((x + y) * 0.05) * 6;
          if (x === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
        }
        ctx.stroke();
      }
      break;
    }
    case "flames": {
      for (let i = 0; i < 30; i++) {
        const x = (i * 47 + 11) % W;
        const baseY = H - ((i * 31) % 60);
        const h = 30 + ((i * 13) % 50);
        const grad = ctx.createLinearGradient(x, baseY, x, baseY - h);
        grad.addColorStop(0, "rgba(255, 120, 30, 0.55)");
        grad.addColorStop(0.6, "rgba(255, 200, 50, 0.18)");
        grad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(x - 8, baseY);
        ctx.quadraticCurveTo(x, baseY - h * 0.6, x, baseY - h);
        ctx.quadraticCurveTo(x, baseY - h * 0.6, x + 8, baseY);
        ctx.closePath(); ctx.fill();
      }
      break;
    }
    case "sakura": {
      for (let i = 0; i < 60; i++) {
        const x = (i * 89 + 23) % W;
        const y = (i * 53 + 37) % H;
        const r = 2 + ((i * 17) % 5);
        ctx.fillStyle = `rgba(255, 175, 200, ${0.25 + ((i * 11) % 10) / 30})`;
        for (let p = 0; p < 5; p++) {
          const a = (Math.PI * 2 / 5) * p;
          ctx.beginPath();
          ctx.ellipse(x + Math.cos(a) * r, y + Math.sin(a) * r, r, r * 0.55, a, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }
    case "dots": {
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      for (let y = 12; y < H; y += 18) {
        for (let x = 12 + (Math.floor(y / 18) % 2) * 9; x < W; x += 18) {
          ctx.beginPath(); ctx.arc(x, y, 1.5, 0, Math.PI * 2); ctx.fill();
        }
      }
      break;
    }
    case "circuit": {
      ctx.strokeStyle = "rgba(255,255,255,0.10)";
      ctx.fillStyle = accent;
      ctx.lineWidth = 1;
      for (let i = 0; i < 25; i++) {
        const x = (i * 67 + 7) % W;
        const y = (i * 43 + 19) % H;
        const len = 30 + ((i * 13) % 60);
        ctx.beginPath();
        ctx.moveTo(x, y); ctx.lineTo(x + len, y); ctx.lineTo(x + len, y + 20);
        ctx.stroke();
        ctx.globalAlpha = 0.6;
        ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + len, y + 20, 2, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      }
      break;
    }
    case "aurora": {
      for (let band = 0; band < 4; band++) {
        const grad = ctx.createLinearGradient(0, band * 80, W, band * 80 + 100);
        grad.addColorStop(0, "rgba(125, 240, 200, 0)");
        grad.addColorStop(0.5, `rgba(125, 240, 200, ${0.12 + band * 0.04})`);
        grad.addColorStop(1, "rgba(125, 240, 200, 0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(0, band * 80 + 20);
        for (let x = 0; x <= W; x += 8) {
          const yy = band * 80 + 30 + Math.sin((x + band * 50) * 0.02) * 22;
          ctx.lineTo(x, yy);
        }
        ctx.lineTo(W, band * 80 + 100); ctx.lineTo(0, band * 80 + 100);
        ctx.closePath(); ctx.fill();
      }
      break;
    }
    case "none":
    default: break;
  }
  ctx.restore();
}

export async function generateProfileCard(user: User): Promise<Buffer> {
  registerFonts();

  const u = getUser(user.id);
  const bg = BACKGROUND_BY_ID[u.background ?? "bg_dark"] ?? BACKGROUND_BY_ID.bg_dark;

  const W = 700;
  const H = 320;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, bg.gradient[0]);
  grad.addColorStop(1, bg.gradient[1]);
  ctx.fillStyle = grad;
  roundRect(ctx, 0, 0, W, H, 22); ctx.fill();

  // Pattern overlay
  ctx.save();
  roundRect(ctx, 0, 0, W, H, 22); ctx.clip();
  drawPattern(ctx, W, H, bg.pattern, bg.accent);
  ctx.restore();

  // Subtle inner border
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 2;
  roundRect(ctx, 1, 1, W - 2, H - 2, 21); ctx.stroke();

  // Permanent gold border (premium item)
  if (u.boxes && u.boxes["perm_border"]) {
    ctx.strokeStyle = "rgba(255, 215, 0, 0.85)";
    ctx.lineWidth = 3;
    roundRect(ctx, 3, 3, W - 6, H - 6, 19); ctx.stroke();
  }

  // Accent bar (left)
  ctx.fillStyle = bg.accent;
  roundRect(ctx, 0, 0, 6, H, 4); ctx.fill();

  // Avatar
  const avSize = 140;
  const avX = 30, avY = 30;
  const avCX = avX + avSize / 2, avCY = avY + avSize / 2;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 10;
  ctx.fillStyle = bg.accent;
  ctx.beginPath();
  ctx.arc(avCX, avCY, avSize / 2 + 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  try {
    const img = await loadImage(user.displayAvatarURL({ extension: "png", size: 256 }));
    ctx.save();
    ctx.beginPath();
    ctx.arc(avCX, avCY, avSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(img, avX, avY, avSize, avSize);
    ctx.restore();
  } catch {
    ctx.fillStyle = "#2f3136";
    ctx.beginPath(); ctx.arc(avCX, avCY, avSize / 2, 0, Math.PI * 2); ctx.fill();
  }

  // Username + tag
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 32px NotoSansBold, NotoSans, sans-serif";
  ctx.fillText(user.username.slice(0, 18), 200, 70);

  if (u.tag) {
    ctx.fillStyle = bg.accent;
    ctx.font = "italic 18px NotoSans, sans-serif";
    ctx.fillText(`"${u.tag.slice(0, 36)}"`, 200, 96);
  }

  // Lowo level
  const xp = u.cowoncy + u.essence * 10 + Object.values(u.zoo).reduce((a, b) => a + b, 0) * 5;
  const level = Math.floor(Math.sqrt(xp / 100));
  const nextXp = Math.pow(level + 1, 2) * 100;
  const prevXp = Math.pow(level, 2) * 100;
  const levelPct = Math.max(0, Math.min(1, (xp - prevXp) / Math.max(1, nextXp - prevXp)));

  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = "bold 20px NotoSansBold, NotoSans, sans-serif";
  ctx.fillText(`Lowo Level ${level}`, 200, 130);

  // XP bar
  const barX = 200, barY = 145, barW = 460, barH = 18;
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  roundRect(ctx, barX, barY, barW, barH, 10); ctx.fill();
  ctx.fillStyle = bg.accent;
  roundRect(ctx, barX, barY, Math.max(8, barW * levelPct), barH, 10); ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = "12px NotoSans, sans-serif";
  ctx.fillText(`${xp.toLocaleString()} / ${nextXp.toLocaleString()} XP`, barX + 6, barY + 13);

  // Stats grid
  const stats: Array<[string, string]> = [
    ["Cowoncy",  u.cowoncy.toLocaleString()],
    ["Essence",  u.essence.toLocaleString()],
    ["Animals",  String(Object.values(u.zoo).reduce((a, b) => a + b, 0))],
    ["Dex",      String(u.dex.length)],
    ["Weapons",  String(u.weapons.length)],
    ["Rep",      String(u.rep)],
    ["Streak",   `${u.dailyStreak}d`],
    ["Status",   u.marriedTo ? "Married" : "Single"],
  ];

  ctx.font = "16px NotoSans, sans-serif";
  const colW = 220;
  const startY = 200;
  stats.forEach((s, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 30 + col * colW;
    const y = startY + row * 38;
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fillText(s[0], x, y);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px NotoSansBold, NotoSans, sans-serif";
    ctx.fillText(s[1], x, y + 20);
    ctx.font = "16px NotoSans, sans-serif";
  });

  return canvas.toBuffer("image/png");
}
