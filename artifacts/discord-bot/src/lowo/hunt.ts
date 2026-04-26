import type { Message } from "discord.js";
import { getUser, updateUser } from "./storage.js";
import {
  ANIMALS, ANIMAL_BY_ID, RARITY_COLOR, RARITY_ORDER,
  HUNT_POOL, VOLCANIC_HUNT_POOL, SPACE_HUNT_POOL, HEAVEN_HUNT_POOL, VOID_UNKNOWN_HUNT_POOL,
  rollAnimalInArea, luckMultiplier, essenceArcuesMultiplier, PITY_THRESHOLD,
  AREA_BY_ID, teamAttributeLuck, type Animal, type Rarity, type HuntArea,
} from "./data.js";
import { onHuntCaught, bestHuntCdMultiplier, sellMultiplier, essenceMultiplier } from "./skills.js";
import { eventBonus, activeEvent } from "./events.js";
import { isAutohuntActive } from "./extra.js";
import { refreshAreaUnlocks } from "./areas.js";
import { teamEnchantLuck } from "./enchant.js";
import { maybeRollMutationDuringEvent, mutationLabel } from "./mutations.js";
import { emoji } from "./emojis.js";

const BASE_HUNT_COOLDOWN_MS = 15_000;
const HUNTS_PER_LOWOCASH = 50;

// ─── Tolerant animal lookup (multi-word + case/punct-insensitive) ─────────────
const norm = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const ANIMAL_LOOKUP: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const a of ANIMALS) {
    map[norm(a.id)] = a.id;
    map[norm(a.name)] = a.id;
  }
  return map;
})();
function resolveAnimalId(query: string): string | null {
  if (!query) return null;
  return ANIMAL_LOOKUP[norm(query)] ?? null;
}

function parseAnimalAndCount(args: string[], owned: number | null): { id: string | null; count: number; name: string } {
  if (args.length === 0) return { id: null, count: 1, name: "" };
  const last = args[args.length - 1].toLowerCase();
  let nameTokens = args;
  let count = 1;
  if (last === "all") {
    nameTokens = args.slice(0, -1);
    count = owned ?? 1;
  } else if (/^\d+$/.test(last)) {
    nameTokens = args.slice(0, -1);
    count = Math.max(1, parseInt(last, 10));
  }
  const name = nameTokens.join(" ").trim();
  return { id: resolveAnimalId(name), count, name };
}

function poolForArea(area: HuntArea): Animal[] {
  if (area === "volcanic")     return VOLCANIC_HUNT_POOL;
  if (area === "space")        return SPACE_HUNT_POOL;
  if (area === "heaven")       return HEAVEN_HUNT_POOL;
  if (area === "void_unknown") return VOID_UNKNOWN_HUNT_POOL;
  return HUNT_POOL;
}

function rollWithRareRush(area: HuntArea, luck: number): Animal {
  const boost = eventBonus("rare");
  if (boost <= 1) return rollAnimalInArea(area, luck);
  const rolls: Animal[] = Array.from({ length: boost }, () => rollAnimalInArea(area, luck));
  rolls.sort((a, b) => RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity));
  return rolls[0];
}

export async function cmdHunt(message: Message): Promise<void> {
  const u = getUser(message.author.id);
  const now = Date.now();
  const cdMult = bestHuntCdMultiplier(message.author.id);
  const cooldown = Math.floor(BASE_HUNT_COOLDOWN_MS * cdMult);
  if (now - u.lastHunt < cooldown) {
    const left = Math.ceil((cooldown - (now - u.lastHunt)) / 1000);
    await message.reply(`${emoji("hourglass")} Slow down! Hunt again in **${left}s**.`);
    return;
  }

  // Defensive: stage-hunt bug — snap u.huntArea back to "default" if the user
  // somehow has a huntArea they haven't unlocked (data drift, old saves, etc).
  // Without this, the picker pool is empty and hunts silently fail.
  let area: HuntArea = u.huntArea;
  if (area !== "default" && !u.unlockedAreas.includes(area)) {
    area = "default";
    updateUser(message.author.id, (x) => { x.huntArea = "default"; });
  }
  let drops = eventBonus("hunt") > 1 ? Math.round(eventBonus("hunt")) : 1;
  // Triple Drop gamepass: 25% chance per hunt to roll one bonus animal.
  if (u.gamepasses["gp_triple_drop"] && Math.random() < 0.25) drops += 1;
  const autohuntOn = isAutohuntActive(message.author.id);
  let luck = luckMultiplier(u.arcuesUnlocked, u.luckUntil, u.megaLuckUntil, autohuntOn);
  const lucky = eventBonus("luck"); if (lucky > 1) luck *= lucky;
  // Pet-attribute team luck (above-ethereal pets) + enchantment team luck.
  luck *= teamAttributeLuck(u.team);
  luck *= teamEnchantLuck(message.author.id);
  // OP Dino Summon Stone temporarily boosts Dino Leo chance via overall luck.
  if (Date.now() < u.dinoSummonUntil) luck *= 5;
  const caught: Animal[] = [];
  const caughtMutations: Array<{ id: string; mutation: string | null }> = [];
  let pityTriggered = false;

  for (let i = 0; i < drops; i++) {
    let a = rollWithRareRush(area, luck);
    const currentPity = (u.pity ?? 0) + caught.filter((c) => c.rarity !== "legendary").length;
    // Pity Pro gamepass halves the pity threshold (from 200 → 100).
    const pityCap = u.gamepasses["gp_pity_pro"] ? Math.floor(PITY_THRESHOLD / 2) : PITY_THRESHOLD;
    if (currentPity >= pityCap) {
      const pool = poolForArea(area);
      const legendaries = pool.filter((x) => x.rarity === "legendary");
      if (legendaries.length) { a = legendaries[Math.floor(Math.random() * legendaries.length)]; pityTriggered = true; }
    }
    caught.push(a);
    // Mutation roll — only when one of the 10 mutation events is active.
    const mut = maybeRollMutationDuringEvent();
    caughtMutations.push({ id: a.id, mutation: mut?.id ?? null });
  }

  let cashGained = 0;
  let arcuesJustUnlocked = false;
  updateUser(message.author.id, (x) => {
    x.lastHunt = now;
    x.lastHuntArea = area;
    x.huntsTotal = (x.huntsTotal ?? 0) + caught.length;
    const before = (x.huntsTotal - caught.length);
    const newMilestones = Math.floor(x.huntsTotal / HUNTS_PER_LOWOCASH) - Math.floor(before / HUNTS_PER_LOWOCASH);
    if (newMilestones > 0) { x.lowoCash += newMilestones; cashGained = newMilestones; }
    for (let idx = 0; idx < caught.length; idx++) {
      const a = caught[idx];
      x.zoo[a.id] = (x.zoo[a.id] ?? 0) + 1;
      if (!x.dex.includes(a.id)) x.dex.push(a.id);
      // Per-area dex (additive, helps unlock checks)
      if (area === "volcanic"     && !x.volcanicDex.includes(a.id))    x.volcanicDex.push(a.id);
      if (area === "space"        && !x.spaceDex.includes(a.id))       x.spaceDex.push(a.id);
      if (area === "heaven"       && !x.heavenDex.includes(a.id))      x.heavenDex.push(a.id);
      if (area === "void_unknown" && !x.voidUnknownDex.includes(a.id)) x.voidUnknownDex.push(a.id);
      if (a.rarity === "legendary") x.pity = 0;
      else x.pity = (x.pity ?? 0) + 1;
      if (a.id === "arcues" && !x.arcuesUnlocked) { x.arcuesUnlocked = true; arcuesJustUnlocked = true; }
      // Persist mutation if one rolled this hunt
      const mid = caughtMutations[idx]?.mutation;
      if (mid && !x.mutations[a.id]) x.mutations[a.id] = { mutationId: mid, appliedAt: Date.now() };
    }
  });
  for (const a of caught) onHuntCaught(message.author.id, a.id);

  // After updating dex, check if a new area is now unlocked.
  const { newlyUnlocked } = refreshAreaUnlocks(message.author.id);

  const ev = activeEvent();
  const evNote = ev ? `\n${ev.emoji} *${ev.name} active*` : "";
  const pityNote = pityTriggered ? `\n${emoji("pity")} **PITY!** Guaranteed legendary triggered!` : "";
  const cashNote = cashGained > 0 ? `\n${emoji("cash")} **+${cashGained}** Lowo Cash *(50-hunt milestone!)*` : "";
  const arcuesNote = arcuesJustUnlocked ? `\n${emoji("rocket")} **ARCUES UNLOCKED!** Permanent **+5% Luck** & **+10% Essence** on sacrifices!` : "";
  const unlockNote = newlyUnlocked.length
    ? `\n${emoji("flag")} **AREA UNLOCKED:** ${newlyUnlocked.map((id) => `${AREA_BY_ID[id].emoji} **${AREA_BY_ID[id].name}**`).join(", ")} — switch via \`lowo area\`.`
    : "";
  const areaTag = `*[${AREA_BY_ID[area].emoji} ${AREA_BY_ID[area].name}]*`;

  const fmtCatch = (a: Animal, idx: number): string => {
    const m = caughtMutations[idx]?.mutation;
    const mTag = m ? ` ${mutationLabel(m)}` : "";
    return `${RARITY_COLOR[a.rarity]} ${a.emoji} **${a.name}**${mTag} *(${a.rarity})*`;
  };
  if (caught.length === 1) {
    await message.reply(`${emoji("hunt")} ${areaTag} **${message.author.username}** went hunting and caught a ${fmtCatch(caught[0], 0)}${evNote}${pityNote}${cashNote}${arcuesNote}${unlockNote}`);
  } else {
    const list = caught.map((a, i) => fmtCatch(a, i)).join(" + ");
    await message.reply(`${emoji("hunt")} ${areaTag} **${message.author.username}** went hunting and caught **${caught.length}** animals!\n${list}${evNote}${pityNote}${cashNote}${arcuesNote}${unlockNote}`);
  }
}

export async function cmdZoo(message: Message): Promise<void> {
  const target = message.mentions.users.first() ?? message.author;
  const u = getUser(target.id);
  const entries = Object.entries(u.zoo).filter(([, c]) => c > 0);
  if (entries.length === 0) { await message.reply(`${emoji("empty")} **${target.username}** has no animals yet. Try \`lowo hunt\`!`); return; }

  const grouped: Partial<Record<Rarity, string[]>> = {};
  for (const [id, count] of entries) {
    const a = ANIMAL_BY_ID[id]; if (!a) continue;
    (grouped[a.rarity] ??= []).push(`${a.emoji} ${a.name} ×${count}`);
  }
  const lines: string[] = [`${emoji("zoo")} **${target.username}'s Zoo**`];
  for (const r of RARITY_ORDER) {
    const arr = grouped[r];
    if (arr && arr.length) lines.push(`\n${RARITY_COLOR[r]} **${r.toUpperCase()}**\n${arr.join(", ")}`);
  }
  await message.reply(lines.join("\n").slice(0, 1900));
}

export async function cmdSell(message: Message, args: string[]): Promise<void> {
  const u = getUser(message.author.id);
  const peek = parseAnimalAndCount(args, null);
  const owned = peek.id ? (u.zoo[peek.id] ?? 0) : 0;
  const { id, count: rawCount, name } = parseAnimalAndCount(args, owned);
  if (!id) {
    await message.reply(`Usage: \`lowo sell <name> [count|all]\` — e.g. \`lowo sell Lowo King\` or \`lowo s puppy 5\`. *(Got: \`${name || "(empty)"}\`)*`);
    return;
  }
  const a = ANIMAL_BY_ID[id];
  if (owned <= 0) { await message.reply(`${emoji("fail")} You don't own any ${a.emoji} ${a.name}.`); return; }
  const count = Math.max(1, Math.min(owned, rawCount));
  const sellMult = sellMultiplier(message.author.id, a.id);
  const cowoncyMult = eventBonus("cowoncy");
  const total = Math.floor(count * a.sellPrice * sellMult * cowoncyMult);
  updateUser(message.author.id, (x) => { x.zoo[a.id] -= count; x.cowoncy += total; });
  const tags: string[] = [];
  if (sellMult > 1)     tags.push("Lv 3 perk +25%");
  if (cowoncyMult > 1)  tags.push(`${emoji("cowoncy")} Cowoncy Event ×2`);
  const tag = tags.length ? ` *(${tags.join(", ")})*` : "";
  await message.reply(`${emoji("sell")} Sold ${count}× ${a.emoji} **${a.name}** for **${total.toLocaleString()}** cowoncy${tag}.`);
}

export async function cmdSacrifice(message: Message, args: string[]): Promise<void> {
  const u = getUser(message.author.id);
  const peek = parseAnimalAndCount(args, null);
  const owned = peek.id ? (u.zoo[peek.id] ?? 0) : 0;
  const { id, count: rawCount, name } = parseAnimalAndCount(args, owned);
  if (!id) {
    await message.reply(`Usage: \`lowo sacrifice <name> [count|all]\` — e.g. \`lowo sac Lowo King\`. *(Got: \`${name || "(empty)"}\`)*`);
    return;
  }
  const a = ANIMAL_BY_ID[id];
  if (owned <= 0) { await message.reply(`${emoji("fail")} You don't own any ${a.emoji} ${a.name}.`); return; }
  const count = Math.max(1, Math.min(owned, rawCount));
  const evMult = eventBonus("essence");
  const perkMult = essenceMultiplier(message.author.id, a.id);
  const arcuesMult = essenceArcuesMultiplier(u.arcuesUnlocked);
  const total = Math.floor(count * a.essence * evMult * perkMult * arcuesMult);
  updateUser(message.author.id, (x) => { x.zoo[a.id] -= count; x.essence += total; });
  const tags: string[] = [];
  if (evMult > 1)      tags.push(`${emoji("essence")} Essence Storm ×2`);
  if (perkMult > 1)    tags.push("Lv 10 perk ×2");
  if (arcuesMult > 1)  tags.push(`${emoji("rocket")} Arcues +10%`);
  const tag = tags.length ? ` *(${tags.join(", ")})*` : "";
  await message.reply(`${emoji("essence")} Sacrificed ${count}× ${a.emoji} **${a.name}** → +**${total.toLocaleString()}** essence${tag}.`);
}

export async function cmdLowodex(message: Message): Promise<void> {
  const target = message.mentions.users.first() ?? message.author;
  const u = getUser(target.id);
  const total = ANIMALS.length;
  const owned = u.dex.length;
  const pct = Math.round((owned / total) * 100);
  const lines = [`${emoji("dex")} **${target.username}'s Lowodex** — ${owned}/${total} (${pct}%)`];
  for (const a of ANIMALS) {
    const got = u.dex.includes(a.id);
    const tags: string[] = [];
    if (a.aquatic)   tags.push(emoji("fishCaught"));
    if (a.eventOnly) tags.push(emoji("event"));
    lines.push(`${got ? emoji("dexFound") : emoji("dexMissing")} ${a.emoji} ${a.name} \`${a.id}\` ${RARITY_COLOR[a.rarity]}${tags.length ? ` ${tags.join("")}` : ""}`);
  }
  await message.reply(lines.join("\n").slice(0, 1900));
}
