import type { Message } from "discord.js";
import { getUser, updateUser, type UserData } from "./storage.js";
import { ANIMAL_BY_ID, ANIMALS, type Rarity } from "./data.js";
import {
  baseEmbed, replyEmbed, errorEmbed, warnEmbed, successEmbed, val, COLOR,
} from "./embeds.js";

// ─── VOID CORRUPTIONS — The Forge ────────────────────────────────────────────
// Smelt unwanted pets into 💎 Void Shards. Spend Shards + ✨ Essence to craft
// 🜏 Relics — equippable items that give global, persistent buffs.
// Only ONE relic can be equipped at a time.

export interface RelicDef {
  id: string;
  emoji: string;
  name: string;
  description: string;
  shardCost: number;
  essenceCost: number;
}

export const RELICS: RelicDef[] = [
  {
    id: "cursed_compass",
    emoji: "🧭",
    name: "The Cursed Compass",
    description: "Adds a hidden **+0.05% chance per hunt** to discover a 🤫 SECRET pet.",
    shardCost: 250,
    essenceCost: 75_000,
  },
  {
    id: "void_eye",
    emoji: "👁️",
    name: "The Void Eye",
    description: "Hunts gain a permanent **+10% Luck** multiplier (stacks with potions / Arcues).",
    shardCost: 180,
    essenceCost: 45_000,
  },
  {
    id: "null_charm",
    emoji: "🌑",
    name: "Null Charm",
    description: "All pet sales return **+15% cowoncy**.",
    shardCost: 120,
    essenceCost: 25_000,
  },
  {
    id: "glitch_token",
    emoji: "🪙",
    name: "Glitch Token",
    description: "Sacrifices yield **+25% essence**.",
    shardCost: 140,
    essenceCost: 30_000,
  },
  {
    id: "chaos_shard",
    emoji: "💠",
    name: "Chaos Shard",
    description: "Each hunt has a **+10% chance** to drop one bonus animal.",
    shardCost: 200,
    essenceCost: 60_000,
  },
  {
    id: "singularity_core",
    emoji: "⚫",
    name: "Singularity Core",
    description: "Lowers the corruption deletion risk from **5% → 2%**.",
    shardCost: 320,
    essenceCost: 100_000,
  },
  {
    id: "void_anchor",
    emoji: "⚓",
    name: "Void Anchor",
    description: "Catches in **The Infinite Void** grant **+25% bonus essence** automatically.",
    shardCost: 160,
    essenceCost: 50_000,
  },
];
export const RELIC_BY_ID: Record<string, RelicDef> = Object.fromEntries(RELICS.map((r) => [r.id, r]));

// ─── Smelt rewards by rarity ─────────────────────────────────────────────────
const SMELT_VALUES: Record<Rarity, number> = {
  common: 1, uncommon: 2, rare: 4, epic: 8, mythic: 16, legendary: 30,
  ethereal: 80, divine: 120, omni: 180,
  glitched: 220, inferno: 240, cosmic: 280, void: 340,
  supreme: 420, transcendent: 520, secret: 999,
};
function shardValue(r: Rarity): number { return SMELT_VALUES[r] ?? 1; }

// ─── Public helpers used by hunt / sell / sacrifice / corrupt ────────────────
export function equippedRelicId(userId: string): string | null {
  return getUser(userId).equippedRelic ?? null;
}
export function hasRelic(userId: string, relicId: string): boolean {
  return equippedRelicId(userId) === relicId;
}

// ─── Lookup helpers ──────────────────────────────────────────────────────────
const norm = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const ANIMAL_LOOKUP: Record<string, string> = (() => {
  const m: Record<string, string> = {};
  for (const a of ANIMALS) { m[norm(a.id)] = a.id; m[norm(a.name)] = a.id; }
  return m;
})();
function resolveAnimalId(q: string): string | null {
  if (!q) return null;
  return ANIMAL_LOOKUP[norm(q)] ?? null;
}
const RELIC_LOOKUP: Record<string, string> = (() => {
  const m: Record<string, string> = {};
  for (const r of RELICS) { m[norm(r.id)] = r.id; m[norm(r.name)] = r.id; }
  return m;
})();
function resolveRelicId(q: string): string | null {
  if (!q) return null;
  return RELIC_LOOKUP[norm(q)] ?? null;
}

function parsePetAndCount(args: string[], owned: number | null): { id: string | null; count: number; raw: string } {
  if (args.length === 0) return { id: null, count: 1, raw: "" };
  const last = args[args.length - 1].toLowerCase();
  let nameTokens = args, count = 1;
  if (last === "all") { nameTokens = args.slice(0, -1); count = owned ?? 1; }
  else if (/^\d+$/.test(last)) { nameTokens = args.slice(0, -1); count = Math.max(1, parseInt(last, 10)); }
  const raw = nameTokens.join(" ").trim();
  return { id: resolveAnimalId(raw), count, raw };
}

// ─── Render: forge home ──────────────────────────────────────────────────────
function homeEmbed(message: Message, u: UserData) {
  const equipped = u.equippedRelic ? RELIC_BY_ID[u.equippedRelic] : null;
  const e = baseEmbed(message, COLOR.void ?? 0x1a0033)
    .setTitle("🜏 The Void Forge")
    .setDescription([
      "*A black anvil hums in the dark. Pets fed in here come back as raw* **💎 Void Shards** *— spend them on* **🜏 Relics** *that bend the world to your will.*",
      "",
      `**💎 Void Shards:** \`${val(u.voidShards ?? 0)}\``,
      `**🜏 Equipped Relic:** ${equipped ? `${equipped.emoji} **${equipped.name}**` : "*none*"}`,
    ].join("\n"))
    .addFields(
      { name: "🔥 Smelt", value: "`lowo forge smelt <pet> [count|all]`\nTurn pets into 💎 Shards.", inline: false },
      { name: "🛠️ Craft", value: "`lowo forge craft <relic id>`\nSpend 💎 + ✨ to forge a relic.", inline: false },
      { name: "🜏 Equip", value: "`lowo forge equip <relic id>` • `lowo forge unequip`\nOnly **ONE** relic active at a time.", inline: false },
      { name: "📜 Catalog", value: "`lowo forge list` — all relics & costs\n`lowo forge owned` — your collection", inline: false },
    );
  return e;
}

function listEmbed(message: Message, u: UserData) {
  const e = baseEmbed(message, COLOR.void ?? 0x1a0033)
    .setTitle("📜 Relic Catalog")
    .setDescription(`*Spend* **💎 Shards** *+* **✨ Essence** *to craft. One relic equipped at a time.*\n\n**💎 Shards:** \`${val(u.voidShards ?? 0)}\` • **✨ Essence:** \`${val(u.essence)}\``);
  for (const r of RELICS) {
    const owned = u.relics?.[r.id] ?? 0;
    const eq = u.equippedRelic === r.id ? " *(equipped)*" : "";
    e.addFields({
      name: `${r.emoji} ${r.name} \`${r.id}\`${owned ? ` ×${owned}` : ""}${eq}`,
      value: `${r.description}\n💎 \`${val(r.shardCost)}\` • ✨ \`${val(r.essenceCost)}\``,
      inline: false,
    });
  }
  return e;
}

function ownedEmbed(message: Message, u: UserData) {
  const owned = Object.entries(u.relics ?? {}).filter(([, n]) => (n ?? 0) > 0);
  const e = baseEmbed(message, COLOR.void ?? 0x1a0033)
    .setTitle("🜏 Your Relics")
    .setDescription(owned.length ? `**💎 Shards:** \`${val(u.voidShards ?? 0)}\`` : "*You don't own any relics yet. Try `lowo forge list`.*");
  for (const [id, n] of owned) {
    const r = RELIC_BY_ID[id]; if (!r) continue;
    const eq = u.equippedRelic === id ? " *(equipped)*" : "";
    e.addFields({ name: `${r.emoji} ${r.name}${eq}`, value: `Owned: **${n}** • \`${id}\`\n${r.description}`, inline: false });
  }
  return e;
}

// ─── Smelt ───────────────────────────────────────────────────────────────────
async function doSmelt(message: Message, args: string[]): Promise<void> {
  const u = getUser(message.author.id);
  const peek = parsePetAndCount(args, null);
  const owned = peek.id ? (u.zoo[peek.id] ?? 0) : 0;
  const { id, count: rawCount, raw } = parsePetAndCount(args, owned);
  if (!id) {
    await replyEmbed(message, errorEmbed(message, "Usage", `\`lowo forge smelt <pet> [count|all]\` — e.g. \`lowo forge smelt Hamster all\`. *(Got: \`${raw || "(empty)"}\`)*`));
    return;
  }
  const a = ANIMAL_BY_ID[id];
  if (!a) { await replyEmbed(message, errorEmbed(message, "Unknown Pet", `\`${raw}\` doesn't exist.`)); return; }
  if (owned <= 0) { await replyEmbed(message, errorEmbed(message, "Don't Own", `You don't own any ${a.emoji} **${a.name}**.`)); return; }
  const count = Math.max(1, Math.min(owned, rawCount));
  const shardsEach = shardValue(a.rarity);
  const totalShards = shardsEach * count;
  updateUser(message.author.id, (x) => {
    x.zoo[a.id] -= count;
    x.voidShards = (x.voidShards ?? 0) + totalShards;
  });
  const e = successEmbed(message, "🔥 Smelted!", `${count}× ${a.emoji} **${a.name}** dissolved into the forge.`)
    .setColor(COLOR.void ?? 0x1a0033)
    .addFields(
      { name: "💎 Shards Gained", value: `\`+${val(totalShards)}\` *(${shardsEach} ea)*`, inline: true },
      { name: "💎 Total",         value: `\`${val(getUser(message.author.id).voidShards ?? 0)}\``, inline: true },
      { name: "📦 Remaining",     value: `\`${val(owned - count)}\``, inline: true },
    );
  await replyEmbed(message, e);
}

// ─── Craft ───────────────────────────────────────────────────────────────────
async function doCraft(message: Message, args: string[]): Promise<void> {
  const id = resolveRelicId(args.join(" ").trim());
  if (!id) { await replyEmbed(message, errorEmbed(message, "Usage", "`lowo forge craft <relic id>` — see `lowo forge list`.")); return; }
  const r = RELIC_BY_ID[id];
  const u = getUser(message.author.id);
  const shards = u.voidShards ?? 0;
  if (shards < r.shardCost) {
    await replyEmbed(message, errorEmbed(message, "Not Enough Shards", `Need 💎 \`${val(r.shardCost)}\` *(you have \`${val(shards)}\`)*.`));
    return;
  }
  if (u.essence < r.essenceCost) {
    await replyEmbed(message, errorEmbed(message, "Not Enough Essence", `Need ✨ \`${val(r.essenceCost)}\` *(you have \`${val(u.essence)}\`)*.`));
    return;
  }
  updateUser(message.author.id, (x) => {
    x.voidShards = (x.voidShards ?? 0) - r.shardCost;
    x.essence -= r.essenceCost;
    x.relics = x.relics ?? {};
    x.relics[r.id] = (x.relics[r.id] ?? 0) + 1;
  });
  const e = successEmbed(message, "🛠️ Forged!", `The forge spits out a glowing ${r.emoji} **${r.name}**.`)
    .setColor(COLOR.void ?? 0x1a0033)
    .addFields(
      { name: "Effect",   value: r.description,                   inline: false },
      { name: "💎 Spent", value: `\`${val(r.shardCost)}\``,       inline: true },
      { name: "✨ Spent", value: `\`${val(r.essenceCost)}\``,     inline: true },
      { name: "Equip",    value: `\`lowo forge equip ${r.id}\``,  inline: true },
    );
  await replyEmbed(message, e);
}

// ─── Equip / Unequip ─────────────────────────────────────────────────────────
async function doEquip(message: Message, args: string[]): Promise<void> {
  const id = resolveRelicId(args.join(" ").trim());
  if (!id) { await replyEmbed(message, errorEmbed(message, "Usage", "`lowo forge equip <relic id>`.")); return; }
  const r = RELIC_BY_ID[id];
  const u = getUser(message.author.id);
  if ((u.relics?.[id] ?? 0) <= 0) {
    await replyEmbed(message, errorEmbed(message, "Don't Own", `You don't own a ${r.emoji} **${r.name}** yet — craft one first.`));
    return;
  }
  updateUser(message.author.id, (x) => { x.equippedRelic = id; });
  const e = successEmbed(message, "🜏 Relic Equipped", `${r.emoji} **${r.name}** is now bound to you.`)
    .setColor(COLOR.void ?? 0x1a0033)
    .addFields({ name: "Effect", value: r.description, inline: false });
  await replyEmbed(message, e);
}
async function doUnequip(message: Message): Promise<void> {
  const u = getUser(message.author.id);
  if (!u.equippedRelic) { await replyEmbed(message, warnEmbed(message, "Nothing Equipped", "You don't have a relic equipped.")); return; }
  const r = RELIC_BY_ID[u.equippedRelic];
  updateUser(message.author.id, (x) => { x.equippedRelic = null; });
  await replyEmbed(message, successEmbed(message, "🜏 Relic Removed", `${r ? `${r.emoji} **${r.name}**` : "Relic"} unequipped.`).setColor(COLOR.void ?? 0x1a0033));
}

// ─── Router ──────────────────────────────────────────────────────────────────
export async function cmdForge(message: Message, args: string[]): Promise<void> {
  const sub = args[0]?.toLowerCase();
  const rest = args.slice(1);
  if (!sub)             { await replyEmbed(message, homeEmbed(message, getUser(message.author.id))); return; }
  if (sub === "list" || sub === "catalog" || sub === "shop") { await replyEmbed(message, listEmbed(message, getUser(message.author.id))); return; }
  if (sub === "owned" || sub === "inv" || sub === "mine")    { await replyEmbed(message, ownedEmbed(message, getUser(message.author.id))); return; }
  if (sub === "smelt" || sub === "burn" || sub === "melt")   { await doSmelt(message, rest); return; }
  if (sub === "craft" || sub === "make" || sub === "forge")  { await doCraft(message, rest); return; }
  if (sub === "equip" || sub === "wear")                     { await doEquip(message, rest); return; }
  if (sub === "unequip" || sub === "remove" || sub === "off"){ await doUnequip(message); return; }
  await replyEmbed(message, warnEmbed(message, "Unknown Sub-command", "Try `lowo forge` for the menu."));
}
