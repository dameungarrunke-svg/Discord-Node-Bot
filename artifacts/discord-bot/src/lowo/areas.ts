import type { Message } from "discord.js";
import { getUser, updateUser, type UserData } from "./storage.js";
import {
  AREA_DEFS, AREA_BY_ID, AREA_DEX_TOTALS,
  HUNT_POOL, VOLCANIC_HUNT_POOL, SPACE_HUNT_POOL,
  type HuntArea,
} from "./data.js";
import { emoji, progressBar } from "./emojis.js";

function dexCounts(u: UserData): { default: number; volcanic: number; space: number } {
  const defaultIds = new Set(HUNT_POOL.map((a) => a.id));
  const volcIds    = new Set(VOLCANIC_HUNT_POOL.map((a) => a.id));
  const spaceIds   = new Set(SPACE_HUNT_POOL.map((a) => a.id));
  let d = 0, v = 0, s = 0;
  for (const id of u.dex) {
    if (defaultIds.has(id)) d++;
    if (volcIds.has(id))    v++;
    if (spaceIds.has(id))   s++;
  }
  // Also union with explicit per-area dex arrays (so volcanic/space dex counts even if not in main dex).
  for (const id of u.volcanicDex) if (volcIds.has(id) && !u.dex.includes(id)) v++;
  for (const id of u.spaceDex)    if (spaceIds.has(id) && !u.dex.includes(id)) s++;
  return { default: d, volcanic: v, space: s };
}

/** Returns true if `area` is now unlocked. Mutates `unlockedAreas` if needed. */
export function checkAreaUnlock(u: UserData, area: HuntArea): boolean {
  if (u.unlockedAreas.includes(area)) return true;
  const def = AREA_BY_ID[area];
  if (!def) return false;
  const d = dexCounts(u);
  if (def.unlock(d, AREA_DEX_TOTALS)) {
    u.unlockedAreas.push(area);
    return true;
  }
  return false;
}

/** Run unlock checks for ALL areas — call after a hunt/fish that adds to dex. */
export function refreshAreaUnlocks(userId: string): { newlyUnlocked: HuntArea[] } {
  const newlyUnlocked: HuntArea[] = [];
  updateUser(userId, (u) => {
    for (const def of AREA_DEFS) {
      if (!u.unlockedAreas.includes(def.id) && def.unlock(dexCounts(u), AREA_DEX_TOTALS)) {
        u.unlockedAreas.push(def.id);
        newlyUnlocked.push(def.id);
      }
    }
  });
  return { newlyUnlocked };
}

export async function cmdArea(message: Message, args: string[]): Promise<void> {
  const u = getUser(message.author.id);
  const sub = args[0]?.toLowerCase();

  if (!sub) {
    const counts = dexCounts(u);
    const lines = [`🗺️ **Hunt Areas** *(your area: ${AREA_BY_ID[u.huntArea].emoji} **${AREA_BY_ID[u.huntArea].name}**)*`];
    for (const def of AREA_DEFS) {
      const unlocked = u.unlockedAreas.includes(def.id);
      const total = AREA_DEX_TOTALS[def.id];
      const cur = counts[def.id];
      const bar = progressBar(cur, total, 12);
      const lock = unlocked ? "✅" : "🔒";
      lines.push(`${lock} ${def.emoji} **${def.name}** — \`${bar}\` ${cur}/${total} dex`);
      lines.push(`  *${def.description}*`);
      if (!unlocked) lines.push(`  🔓 *${def.unlockHint}*`);
    }
    lines.push("");
    lines.push("Switch with `lowo area <forest|volcanic|space>`.");
    await message.reply(lines.join("\n"));
    return;
  }

  // Resolve "forest" → "default" alias
  const aliasMap: Record<string, HuntArea> = {
    forest: "default", default: "default", base: "default", normal: "default",
    volcanic: "volcanic", lava: "volcanic", volcano: "volcanic",
    space: "space", cosmic: "space", galaxy: "space",
  };
  const target = aliasMap[sub];
  if (!target) { await message.reply("Usage: `lowo area <forest|volcanic|space>`"); return; }
  if (!u.unlockedAreas.includes(target)) {
    const def = AREA_BY_ID[target];
    await message.reply(`🔒 **${def.name}** is locked.\n*${def.unlockHint}*`);
    return;
  }
  updateUser(message.author.id, (x) => { x.huntArea = target; });
  const def = AREA_BY_ID[target];
  await message.reply(`${emoji("hunt")} Hunting area set to ${def.emoji} **${def.name}**.`);
}
