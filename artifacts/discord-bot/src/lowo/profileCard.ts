import { createCanvas, loadImage, GlobalFonts } from "@napi-rs/canvas";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import type { User } from "discord.js";
import { getUser } from "./storage.js";
import { BACKGROUND_BY_ID } from "./data.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Register fonts once (safe — same fonts already used by leveling/card.ts)
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

function roundRect(ctx: any, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
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

  // Subtle inner border
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 2;
  roundRect(ctx, 1, 1, W - 2, H - 2, 21); ctx.stroke();

  // Accent bar (left)
  ctx.fillStyle = bg.accent;
  roundRect(ctx, 0, 0, 6, H, 4); ctx.fill();

  // Avatar
  const avSize = 140;
  const avX = 30, avY = 30;
  const avCX = avX + avSize / 2, avCY = avY + avSize / 2;
  // Avatar shadow / ring
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
    ["💰 Cowoncy",  u.cowoncy.toLocaleString()],
    ["✨ Essence",  u.essence.toLocaleString()],
    ["🐾 Animals",  String(Object.values(u.zoo).reduce((a, b) => a + b, 0))],
    ["📕 Dex",      String(u.dex.length)],
    ["🗡️ Weapons", String(u.weapons.length)],
    ["⭐ Rep",      String(u.rep)],
    ["🔥 Streak",   `${u.dailyStreak}d`],
    ["💍 Status",   u.marriedTo ? "💕 Married" : "Single"],
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
