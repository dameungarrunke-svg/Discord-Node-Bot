import type { Message } from "discord.js";
import { getUser, updateUser } from "./storage.js";
import {
  ANIMALS, ANIMAL_BY_ID, RARITY_ORDER, RARITY_COLOR,
  HUNT_POOL, VOLCANIC_HUNT_POOL, SPACE_HUNT_POOL, HEAVEN_HUNT_POOL, VOID_UNKNOWN_HUNT_POOL,
  SIGNATURE_SKILLS, type Rarity, type Animal,
} from "./data.js";
import { sellMultiplier } from "./skills.js";
import { eventBonus } from "./events.js";
import { emoji } from "./emojis.js";

const RARITY_SET: Set<string> = new Set(RARITY_ORDER as string[]);

// Normalise a rarity string from user input (case-insensitive, trimmed).
function parseRarity(input: string | undefined): Rarity | null {
  if (!input) return null;
  const r = input.toLowerCase().trim();
  return RARITY_SET.has(r) ? (r as Rarity) : null;
}

/** Returns the user's auto-sell rarity set (lowercased). */
export function getAutoSellRarities(userId: string): Set<string> {
  const u = getUser(userId);
  return new Set((u.autoSell ?? []).map((s) => s.toLowerCase()));
}

/**
 * Sell a single freshly-caught animal at its full sell price (with skill perk
 * + cowoncy event multiplier). Used by the hunt loop when auto-sell matches.
 * Returns the cowoncy gained (already credited to the user).
 */
export function autoSellOne(userId: string, animalId: string): number {
  const a = ANIMAL_BY_ID[animalId];
  if (!a) return 0;
  const sellMult = sellMultiplier(userId, a.id);
  const cowoncyMult = eventBonus("cowoncy");
  const total = Math.floor(a.sellPrice * sellMult * cowoncyMult);
  updateUser(userId, (x) => {
    x.cowoncy += total;
    x.lifetimeCowoncy = (x.lifetimeCowoncy ?? 0) + total;
  });
  return total;
}

/**
 * `lowo autosell <rarity>` — toggles auto-sell for that rarity. The next time
 * you catch an animal of that rarity (manual hunt) it's auto-sold instead of
 * going to your zoo.
 */
export async function cmdAutoSell(message: Message, args: string[]): Promise<void> {
  const sub = (args[0] ?? "").toLowerCase();
  const u = getUser(message.author.id);
  if (sub === "list" || sub === "view" || sub === "" ) {
    const list = u.autoSell ?? [];
    if (list.length === 0) {
      await message.reply([
        `${emoji("info")} **Auto-Sell** — *no rarities armed.*`,
        `Toggle a rarity with \`lowo autosell <rarity>\`.`,
        `Rarities: ${RARITY_ORDER.map((r) => `\`${r}\``).join(", ")}`,
      ].join("\n"));
      return;
    }
    await message.reply(`${emoji("sell")} **Auto-Sell armed for:** ${list.map((r) => `${RARITY_COLOR[r as Rarity] ?? ""} \`${r}\``).join(", ")}\n*Toggle off with \`lowo autosell <rarity>\` again.*`);
    return;
  }
  if (sub === "clear" || sub === "off" || sub === "reset") {
    updateUser(message.author.id, (x) => { x.autoSell = []; });
    await message.reply(`${emoji("ok")} Auto-sell **cleared** — caught animals will go to your zoo as normal.`);
    return;
  }
  const r = parseRarity(sub);
  if (!r) {
    await message.reply([
      `${emoji("fail")} Unknown rarity \`${sub}\`.`,
      `Usage: \`lowo autosell <rarity>\` *(toggles)* — or \`lowo autosell list\` / \`lowo autosell clear\`.`,
      `Rarities: ${RARITY_ORDER.map((rr) => `\`${rr}\``).join(", ")}`,
    ].join("\n"));
    return;
  }
  let on = false;
  updateUser(message.author.id, (x) => {
    const set = new Set(x.autoSell ?? []);
    if (set.has(r)) { set.delete(r); on = false; }
    else            { set.add(r);    on = true;  }
    x.autoSell = Array.from(set);
  });
  await message.reply(`${emoji(on ? "ok" : "info")} Auto-sell for ${RARITY_COLOR[r] ?? ""} **${r}** is now **${on ? "ON" : "OFF"}**.`);
}

/**
 * `lowo bulk sell <rarity>` — sells every animal of that rarity in your zoo
 * at once. Honors the same skill / event multipliers as `lowo sell`.
 */
export async function cmdBulkSell(message: Message, args: string[]): Promise<void> {
  // Allow either `lowo bulk sell <rarity>` (preferred) or `lowo bulksell <rarity>`.
  let sub = (args[0] ?? "").toLowerCase();
  let rarityArg = args[1];
  if (sub !== "sell") {
    rarityArg = args[0];
  }
  const r = parseRarity(rarityArg);
  if (!r) {
    await message.reply([
      `${emoji("fail")} Usage: \`lowo bulk sell <rarity>\` — sells every animal of that rarity in your zoo.`,
      `Rarities: ${RARITY_ORDER.map((rr) => `\`${rr}\``).join(", ")}`,
    ].join("\n"));
    return;
  }
  const u = getUser(message.author.id);
  const cowoncyMult = eventBonus("cowoncy");
  let totalCowoncy = 0;
  let totalSold = 0;
  const breakdown: string[] = [];
  updateUser(message.author.id, (x) => {
    for (const [id, count] of Object.entries(x.zoo)) {
      if (!count || count <= 0) continue;
      const a = ANIMAL_BY_ID[id];
      if (!a || a.rarity !== r) continue;
      const sellMult = sellMultiplier(message.author.id, a.id);
      const gained = Math.floor(count * a.sellPrice * sellMult * cowoncyMult);
      x.cowoncy += gained;
      x.lifetimeCowoncy = (x.lifetimeCowoncy ?? 0) + gained;
      x.zoo[id] = 0;
      totalCowoncy += gained;
      totalSold += count;
      breakdown.push(`${a.emoji} ${a.name} ×${count} → ${gained.toLocaleString()}`);
    }
  });
  if (totalSold === 0) {
    await message.reply(`${emoji("empty")} You don't own any **${r}** animals to bulk-sell.`);
    return;
  }
  const lines = [
    `${emoji("sell")} **Bulk Sold** — ${RARITY_COLOR[r] ?? ""} **${r.toUpperCase()}** ×**${totalSold}** for **${totalCowoncy.toLocaleString()}** ${emoji("cowoncy")} cowoncy.`,
    ...breakdown.slice(0, 18).map((b) => `• ${b}`),
  ];
  if (breakdown.length > 18) lines.push(`*…and ${breakdown.length - 18} more.*`);
  await message.reply(lines.join("\n").slice(0, 1900));
}

/**
 * `lowo animalstat <name>` — show price, damage and unique ability of an animal.
 */
export async function cmdAnimalStat(message: Message, args: string[]): Promise<void> {
  const query = args.join(" ").trim().toLowerCase();
  if (!query) {
    await message.reply(`${emoji("info")} Usage: \`lowo animalstat <name>\` — shows price, stats and unique ability.`);
    return;
  }
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const target = norm(query);
  const a = ANIMALS.find((x) => norm(x.id) === target || norm(x.name) === target);
  if (!a) {
    await message.reply(`${emoji("fail")} No animal matches \`${query}\`. Try the exact name from \`lowo dex\`.`);
    return;
  }
  const sk = a.signatureSkill ? SIGNATURE_SKILLS[a.signatureSkill] : null;
  const dmgRange = `${a.atk}–${a.atk + Math.floor(a.atk * 0.4)}`;
  const lines = [
    `${a.emoji} **${a.name}** — ${RARITY_COLOR[a.rarity] ?? ""} *${a.rarity}*`,
    `${emoji("cowoncy")} Sell Price: **${a.sellPrice.toLocaleString()}** cowoncy`,
    `${emoji("essence")} Essence Value: **${a.essence}**`,
    `${emoji("weapon")} Damage: **${dmgRange}** (atk ${a.atk}) ${emoji("bullet")} HP **${a.hp}** ${emoji("bullet")} DEF **${a.def}** ${emoji("bullet")} MAG **${a.mag}**`,
    sk
      ? `${sk.emoji} Unique Ability — **${sk.name}**: ${sk.description}`
      : `${emoji("dot")} *No signature ability — basic attacker.*`,
    a.aquatic   ? `${emoji("fishCaught")} *Aquatic — caught via \`lowo fish\`.*` : null,
    a.eventOnly ? `${emoji("event")} *Event-only — only spawns during specific events.*` : null,
  ].filter(Boolean);
  await message.reply(lines.join("\n"));
}

// Resolve an `area name | stage number 1-5` to one of the area pool ids.
type AreaKey = "default" | "volcanic" | "space" | "heaven" | "void_unknown";
const AREA_NAME_MAP: Record<string, AreaKey> = {
  "1": "default", "default": "default", "forest": "default", "land": "default",
  "2": "volcanic", "volcanic": "volcanic", "volcano": "volcanic", "fire": "volcanic", "lava": "volcanic",
  "3": "space", "space": "space", "cosmic": "space", "galaxy": "space", "star": "space",
  "4": "heaven", "heaven": "heaven", "sky": "heaven", "divine": "heaven", "cloud": "heaven",
  "5": "void_unknown", "void": "void_unknown", "void_unknown": "void_unknown",
  "unknown": "void_unknown", "abyss": "void_unknown",
};
const AREA_LABEL: Record<AreaKey, string> = {
  default: "🌳 Forest (Stage 1)",
  volcanic: "🌋 Volcanic (Stage 2)",
  space: "🌌 Space (Stage 3)",
  heaven: "☁️ Heaven (Stage 4)",
  void_unknown: "🕳️ Unknown Void (Stage 5)",
};

export function resolveAreaArg(input: string | undefined): { key: AreaKey; label: string; pool: Animal[] } | null {
  if (!input) return null;
  const k = AREA_NAME_MAP[input.toLowerCase().trim()];
  if (!k) return null;
  const pool =
    k === "default"      ? HUNT_POOL :
    k === "volcanic"     ? VOLCANIC_HUNT_POOL :
    k === "space"        ? SPACE_HUNT_POOL :
    k === "heaven"       ? HEAVEN_HUNT_POOL :
                           VOID_UNKNOWN_HUNT_POOL;
  return { key: k, label: AREA_LABEL[k], pool };
}
