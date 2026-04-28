import { createCanvas, GlobalFonts, type SKRSContext2D } from "@napi-rs/canvas";
import { AttachmentBuilder } from "discord.js";
import { type Animal, getPetAttribute, RARITY_COLOR } from "./data.js";
import path from "node:path";
import fs from "node:fs";

const W = 760;
const H = 360;

// ─── v6.1 — Optional gamer font load ─────────────────────────────────────────
// Drop an Orbitron .ttf/.otf into `data/fonts/` (any filename) to use it.
// Falls back to bold sans-serif if no font is found.
let GAMER_FONT_FAMILY = "sans-serif";
let _gamerFontTried = false;
function tryLoadGamerFont(): void {
  if (_gamerFontTried) return;
  _gamerFontTried = true;
  try {
    const dir = path.resolve("data/fonts");
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir).filter((f) => /\.(ttf|otf)$/i.test(f));
    for (const f of files) {
      const family = f.replace(/\.(ttf|otf)$/i, "");
      try {
        GlobalFonts.registerFromPath(path.join(dir, f), family);
        if (/orbitron|gamer|press|audiowide|russo/i.test(family)) GAMER_FONT_FAMILY = family;
        else if (GAMER_FONT_FAMILY === "sans-serif") GAMER_FONT_FAMILY = family;
      } catch { /* ignore individual font failures */ }
    }
  } catch { /* ignore */ }
}

function rarityColors(r: Animal["rarity"]): { bg: string; border: string; text: string } {
  const map: Record<string, { bg: string; border: string; text: string }> = {
    common:       { bg: "#3a3a3a", border: "#a0a0a0", text: "#ffffff" },
    uncommon:     { bg: "#1f3a25", border: "#5fd17a", text: "#ffffff" },
    rare:         { bg: "#1c2a55", border: "#5990ff", text: "#ffffff" },
    epic:         { bg: "#3a1f55", border: "#b76af0", text: "#ffffff" },
    mythic:       { bg: "#5a4a10", border: "#f0c64a", text: "#ffffff" },
    legendary:    { bg: "#5a3010", border: "#ff9a3c", text: "#ffffff" },
    ethereal:     { bg: "#103a4a", border: "#7af0ff", text: "#ffffff" },
    divine:       { bg: "#503a00", border: "#ffe05f", text: "#ffffff" },
    omni:         { bg: "#22244a", border: "#9aa6ff", text: "#ffffff" },
    glitched:     { bg: "#5a1010", border: "#ff5f6f", text: "#ffffff" },
    inferno:      { bg: "#5a1500", border: "#ff7a2a", text: "#ffffff" },
    cosmic:       { bg: "#22104a", border: "#a070ff", text: "#ffffff" },
    void:         { bg: "#0a0a14", border: "#5a3aff", text: "#ffffff" },
    secret:       { bg: "#3a0a3a", border: "#ff77ff", text: "#ffffff" },
    supreme:      { bg: "#502a00", border: "#ffb84a", text: "#ffffff" },
    transcendent: { bg: "#1a3a55", border: "#90e0ff", text: "#ffffff" },
  };
  return map[r] ?? map.common;
}

export function shouldRenderImage(animal: Animal): boolean {
  return ["legendary","ethereal","divine","omni","glitched","inferno","cosmic","void","secret","supreme","transcendent"].includes(animal.rarity);
}

/** v6.1 — divine / omni / secret / transcendent get a shimmering holo overlay. */
function isHolographic(r: Animal["rarity"]): boolean {
  return r === "divine" || r === "omni" || r === "secret" || r === "transcendent";
}

/** Paint a diagonal rainbow shimmer over the entire card with low opacity. */
function drawHolographicOverlay(ctx: SKRSContext2D): void {
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = 0.18;

  // Primary diagonal rainbow band
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0.00, "#ff5da2");   // pink
  grad.addColorStop(0.20, "#ffd96a");   // gold
  grad.addColorStop(0.40, "#90ffb1");   // mint
  grad.addColorStop(0.60, "#5cd3ff");   // cyan
  grad.addColorStop(0.80, "#a984ff");   // violet
  grad.addColorStop(1.00, "#ff5da2");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Diagonal lighter stripes for the "foil" feel
  ctx.globalAlpha = 0.10;
  ctx.fillStyle = "#ffffff";
  const STRIPE_W = 14;
  const STEP = 36;
  for (let x = -H; x < W + H; x += STEP) {
    ctx.beginPath();
    ctx.moveTo(x,            0);
    ctx.lineTo(x + STRIPE_W, 0);
    ctx.lineTo(x + STRIPE_W + H, H);
    ctx.lineTo(x + H,        H);
    ctx.closePath();
    ctx.fill();
  }

  // Soft vignette so the center pops
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 0.35;
  const r = ctx.createRadialGradient(W / 2, H / 2, H / 4, W / 2, H / 2, W / 1.2);
  r.addColorStop(0, "rgba(0,0,0,0)");
  r.addColorStop(1, "rgba(0,0,0,0.55)");
  ctx.fillStyle = r;
  ctx.fillRect(0, 0, W, H);

  ctx.restore();
}

export async function renderPetCard(animal: Animal): Promise<AttachmentBuilder> {
  tryLoadGamerFont();

  const c = createCanvas(W, H);
  const ctx = c.getContext("2d");
  const colors = rarityColors(animal.rarity);
  const holo = isHolographic(animal.rarity);

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, colors.bg);
  grad.addColorStop(1, "#0a0a0a");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Border
  ctx.strokeStyle = colors.border;
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, W - 8, H - 8);

  // Inner shimmer panel
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  ctx.fillRect(20, 20, W - 40, H - 40);

  // ── Holographic overlay (sits BEHIND text so text stays readable) ────────
  if (holo) drawHolographicOverlay(ctx);

  // Big emoji on left
  ctx.font = `bold 180px ${GAMER_FONT_FAMILY}, sans-serif`;
  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = "middle";
  ctx.fillText(animal.emoji, 40, H / 2);

  // Right column — text
  const colX = 290;
  ctx.fillStyle = colors.text;

  // Pet name — gamer font when available, holographic glow on top tiers
  if (holo) {
    ctx.shadowColor = colors.border;
    ctx.shadowBlur = 18;
  }
  ctx.font = `bold 44px ${GAMER_FONT_FAMILY}, sans-serif`;
  ctx.textBaseline = "top";
  ctx.fillText(animal.name, colX, 40);
  ctx.shadowBlur = 0;

  ctx.font = `bold 22px ${GAMER_FONT_FAMILY}, sans-serif`;
  ctx.fillStyle = colors.border;
  ctx.fillText(`${RARITY_COLOR[animal.rarity]} ${animal.rarity.toUpperCase()}${holo ? "  ✨ HOLO" : ""}`, colX, 96);

  ctx.font = "20px sans-serif";
  ctx.fillStyle = "#e6e6e6";
  ctx.fillText(`HP ${animal.hp}   ATK ${animal.atk}   DEF ${animal.def}   MAG ${animal.mag}`, colX, 140);
  ctx.fillText(`Sells for ${animal.sellPrice.toLocaleString()} cowoncy`, colX, 170);
  ctx.fillText(`Essence on sacrifice: ${animal.essence.toLocaleString()} ✨`, colX, 200);

  // Attribute (high-rarity)
  const attr = getPetAttribute(animal);
  if (attr) {
    ctx.font = "bold 22px sans-serif";
    ctx.fillStyle = colors.border;
    ctx.fillText(`${attr.emoji} ${attr.name}`, colX, 240);
    ctx.font = "18px sans-serif";
    ctx.fillStyle = "#dcdcdc";
    const words = attr.description.split(" ");
    let line = "";
    let y = 268;
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      const tw = ctx.measureText(test).width;
      if (tw > (W - colX - 30)) {
        ctx.fillText(line, colX, y);
        line = w;
        y += 22;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, colX, y);
  }

  const buf = c.toBuffer("image/png");
  return new AttachmentBuilder(buf, { name: `pet_${animal.id}.png` });
}
