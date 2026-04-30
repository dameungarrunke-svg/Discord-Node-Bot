import type { Message } from "discord.js";
import { getUser, updateUser, type UserData } from "./storage.js";
import {
  AREA_DEFS, AREA_BY_ID, AREA_DEX_TOTALS,
  HUNT_POOL, VOLCANIC_HUNT_POOL, SPACE_HUNT_POOL, HEAVEN_HUNT_POOL, VOID_UNKNOWN_HUNT_POOL,
  INFINITE_VOID_HUNT_POOL,
  type HuntArea, type AreaDexCount,
} from "./data.js";
import { emoji, progressBar } from "./emojis.js";
import { AREA_TRAITS } from "./areaTraits.js";

function dexCounts(u: UserData): AreaDexCount {
  const defaultIds = new Set(HUNT_POOL.map((a) => a.id));
  const volcIds    = new Set(VOLCANIC_HUNT_POOL.map((a) => a.id));
  const spaceIds   = new Set(SPACE_HUNT_POOL.map((a) => a.id));
  const heavenIds  = new Set(HEAVEN_HUNT_POOL.map((a) => a.id));
  const voidIds    = new Set(VOID_UNKNOWN_HUNT_POOL.map((a) => a.id));
  const ivIds      = new Set(INFINITE_VOID_HUNT_POOL.map((a) => a.id));
  let d = 0, v = 0, s = 0, h = 0, vu = 0, iv = 0;
  for (const id of u.dex) {
    if (defaultIds.has(id)) d++;
    if (volcIds.has(id))    v++;
    if (spaceIds.has(id))   s++;
    if (heavenIds.has(id))  h++;
    if (voidIds.has(id))    vu++;
    if (ivIds.has(id))      iv++;
  }
  for (const id of u.volcanicDex)        if (volcIds.has(id)   && !u.dex.includes(id)) v++;
  for (const id of u.spaceDex)           if (spaceIds.has(id)  && !u.dex.includes(id)) s++;
  for (const id of u.heavenDex)          if (heavenIds.has(id) && !u.dex.includes(id)) h++;
  for (const id of u.voidUnknownDex)     if (voidIds.has(id)   && !u.dex.includes(id)) vu++;
  for (const id of (u.infiniteVoidDex ?? []))
    if (ivIds.has(id) && !u.dex.includes(id)) iv++;
  return { default: d, volcanic: v, space: s, heaven: h, void_unknown: vu, infinite_void: iv };
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
      // VOID CORRUPTIONS (v6.2) — Area 6 shows its total population explicitly.
      const populationSuffix = def.id === "infinite_void"
        ? ` *(${total} Pets Discovered)*`
        : "";
      lines.push(`${lock} ${def.emoji} **${def.name}**${populationSuffix} — \`${bar}\` ${cur}/${total} dex`);
      lines.push(`  *${def.description}*`);
      const traits = AREA_TRAITS[def.id];
      if (traits && traits.length) for (const t of traits) lines.push(`  ${t}`);
      if (!unlocked) lines.push(`  🔓 *${def.unlockHint}*`);
    }
    lines.push("");
    lines.push("Switch with `lowo area <forest|volcanic|space|heaven|void>`.");
    await message.reply(lines.join("\n"));
    return;
  }

  // Resolve aliases.
  const aliasMap: Record<string, HuntArea> = {
    forest: "default", default: "default", base: "default", normal: "default",
    volcanic: "volcanic", lava: "volcanic", volcano: "volcanic",
    space: "space", cosmic: "space", galaxy: "space",
    heaven: "heaven", sky: "heaven", angel: "heaven", angels: "heaven",
    void: "void_unknown", void_unknown: "void_unknown", unknown: "void_unknown", uv: "void_unknown",
    // VOID CORRUPTIONS — Area 6
    infinite: "infinite_void", infinite_void: "infinite_void", infinitevoid: "infinite_void",
    iv: "infinite_void", "6": "infinite_void", corruption: "infinite_void", corrupted: "infinite_void",
  };
  const target = aliasMap[sub];
  if (!target) { await message.reply("Usage: `lowo area <forest|volcanic|space|heaven|void|infinitevoid>`"); return; }
  if (!u.unlockedAreas.includes(target)) {
    const def = AREA_BY_ID[target];
    await message.reply(`🔒 **${def.name}** is locked.\n*${def.unlockHint}*`);
    return;
  }
  updateUser(message.author.id, (x) => { x.huntArea = target; });
  const def = AREA_BY_ID[target];
  await message.reply(`${emoji("hunt")} Hunting area set to ${def.emoji} **${def.name}**.`);
}
