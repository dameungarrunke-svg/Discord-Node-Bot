import type { Message } from "discord.js";
import { getUser, updateUser } from "./storage.js";
import { ANIMAL_BY_ID, rollWeapon, BOX_DEFS, rollWeaponFromBox, type BoxTier } from "./data.js";
import {
  baseEmbed, replyEmbed, sendLowoEmbed, COLOR, val,
} from "./embeds.js";
import { emoji } from "./emojis.js";

// Auto-hunt nerf: defaults to 2 minutes per tick. Owners of the
// `gp_autohunt_2` gamepass run on the upgraded 1-minute schedule.
// Luck is halved while active (see luckMultiplier(...,autohuntActive=true) callers).
const AUTOHUNT_INTERVAL_DEFAULT_MS = 2 * 60 * 1000;
const AUTOHUNT_INTERVAL_UPGRADED_MS = 1 * 60 * 1000;
const AUTOHUNT_DURATION_MS = 30 * 60 * 1000; // 30 min auto-hunt
const autoHunters = new Map<string, NodeJS.Timeout>();
function autohuntIntervalFor(userId: string): number {
  return getUser(userId).gamepasses["gp_autohunt_2"] ? AUTOHUNT_INTERVAL_UPGRADED_MS : AUTOHUNT_INTERVAL_DEFAULT_MS;
}

/** Whether the given user currently has an autohunt loop running. */
export function isAutohuntActive(userId: string): boolean {
  return autoHunters.has(userId);
}

export async function cmdAutohunt(message: Message): Promise<void> {
  if (autoHunters.has(message.author.id)) {
    const t = autoHunters.get(message.author.id)!;
    clearInterval(t);
    autoHunters.delete(message.author.id);
    await message.reply("🛑 Auto-hunt **disabled**.");
    return;
  }
  const interval = autohuntIntervalFor(message.author.id);
  const minutesPerTick = Math.round(interval / 60000);
  const upgraded = interval === AUTOHUNT_INTERVAL_UPGRADED_MS;
  await message.reply(`🤖 Auto-hunt **enabled** for 30 minutes (every ${minutesPerTick} minute${minutesPerTick === 1 ? "" : "s"}, ½ luck).${upgraded ? " *(Auto-Hunt Upgrade gamepass active!)*" : ""} Run again to stop.`);
  const ch = message.channel;
  const start = Date.now();
  const id = setInterval(() => {
    if (Date.now() - start > AUTOHUNT_DURATION_MS) {
      clearInterval(id); autoHunters.delete(message.author.id);
      if ("send" in ch) ch.send(`<@${message.author.id}> ⏰ Auto-hunt ended.`).catch(() => {});
      return;
    }
    const ids = Object.keys(ANIMAL_BY_ID);
    const a = ANIMAL_BY_ID[ids[Math.floor(Math.random() * ids.length)]];
    updateUser(message.author.id, (x) => {
      x.zoo[a.id] = (x.zoo[a.id] ?? 0) + 1;
      if (!x.dex.includes(a.id)) x.dex.push(a.id);
    });
  }, interval);
  autoHunters.set(message.author.id, id);
}

export async function cmdLootbox(message: Message): Promise<void> {
  const u = getUser(message.author.id);
  if (u.cowoncy < 1500) { await message.reply("❌ Lootbox costs **1500** cowoncy."); return; }
  const cash = 500 + Math.floor(Math.random() * 2000);
  const w = rollWeapon();
  updateUser(message.author.id, (x) => {
    x.cowoncy = x.cowoncy - 1500 + cash;
    x.weapons.push({ id: w.id, rarity: w.rarity, mods: w.mods });
  });
  await message.reply(`🎁 **Lootbox opened!**\n💰 +${cash} cowoncy\n${w.emoji} **${w.name}** *(${w.rarity})*`);
}

// Open a stored loot crate (bronze/silver/gold) from inventory.
export async function cmdBox(message: Message, args: string[]): Promise<void> {
  const tier = (args[0]?.toLowerCase() as BoxTier);
  if (!tier || !(tier in BOX_DEFS)) {
    const u = getUser(message.author.id);
    const owned = (Object.keys(BOX_DEFS) as BoxTier[]).map((t) => `${BOX_DEFS[t].emoji} ${BOX_DEFS[t].name}: **${u.boxes[t] ?? 0}**`).join(" • ");
    await message.reply(`📦 Usage: \`lowo box <bronze|silver|gold>\`\nYour crates: ${owned}\n_Buy via_ \`lowo buy bronze|silver|gold\`.`);
    return;
  }
  const u = getUser(message.author.id);
  const have = u.boxes[tier] ?? 0;
  if (have <= 0) { await message.reply(`❌ You have no ${BOX_DEFS[tier].emoji} ${BOX_DEFS[tier].name}. Buy via \`lowo buy ${tier}\`.`); return; }
  const def = BOX_DEFS[tier];
  const rolls = Array.from({ length: def.rolls }, () => rollWeaponFromBox(tier));
  updateUser(message.author.id, (x) => {
    x.boxes[tier] = (x.boxes[tier] ?? 0) - 1;
    for (const w of rolls) x.weapons.push({ id: w.id, rarity: w.rarity, mods: w.mods });
  });
  const lines = [`${def.emoji} **${def.name}** opened! (${def.rolls} roll${def.rolls === 1 ? "" : "s"})`];
  for (const w of rolls) {
    lines.push(`${w.emoji} **${w.name}** *(${w.rarity})* — ATK+${w.mods.atk} DEF+${w.mods.def} MAG+${w.mods.mag}`);
  }
  await message.reply(lines.join("\n"));
}

/**
 * v6.2 — `lowo inv` now uses the same grid-style embed as `lowo hunt`.
 * Each row groups related items with high-quality fallback emojis when the
 * `data/lowo_emojis.json` map doesn't override them.
 */
export async function cmdInv(message: Message): Promise<void> {
  const target = message.mentions.users.first() ?? message.author;
  const u = getUser(target.id);
  const animals     = Object.values(u.zoo).reduce((a, b) => a + b, 0);
  const fishCount   = Object.values(u.aquarium ?? {}).reduce((a, b) => a + b, 0);
  const mineralCnt  = Object.values(u.minerals ?? {}).reduce((a, b) => a + b, 0);
  const accCount    = u.accessories?.length ?? 0;
  const craftedCnt  = u.craftedWeapons?.length ?? 0;
  const fmt = (n: number, label: string): string => `${val(n)} ${label}`;

  // Box / consumables — only show non-empty.
  const boxLines = (Object.keys(BOX_DEFS) as BoxTier[])
    .filter((t) => (u.boxes[t] ?? 0) > 0)
    .map((t) => `${BOX_DEFS[t].emoji} **${BOX_DEFS[t].name}** ×${u.boxes[t]}`);
  const consum: string[] = [];
  if (u.rings   > 0) consum.push(`💍 Rings ×${u.rings}`);
  if (u.carrots > 0) consum.push(`🥕 Carrots ×${u.carrots}`);
  if (u.petfood > 0) consum.push(`🍖 Pet food ×${u.petfood}`);

  const e = baseEmbed(message, COLOR.profile)
    .setAuthor({ name: `${target.username}'s Inventory`, iconURL: target.displayAvatarURL({ size: 128 }) })
    .setThumbnail(target.displayAvatarURL({ size: 256 }))
    .setTitle("🎒 Inventory")
    .setDescription("─────────────────────")
    .addFields(
      // Economy row
      { name: "💰 Cowoncy",  value: val(u.cowoncy),  inline: true },
      { name: "🪙 Cash",     value: val(u.lowoCash), inline: true },
      { name: "✨ Essence",  value: val(u.essence),  inline: true },
      // Collection row
      { name: `${emoji("zoo")} Animals`, value: `${fmt(animals, "*total*")}\n*${u.dex.length} unique* — \`lowo zoo\``, inline: true },
      { name: "🐟 Aquarium",  value: fishCount > 0 ? `${val(fishCount)} fish\n\`lowo aq\``    : "*empty*", inline: true },
      { name: "⛏️ Minerals",  value: mineralCnt > 0 ? `${val(mineralCnt)} ores\n\`lowo ore\`` : "*none*",  inline: true },
      // Combat / gear row
      { name: "⚔️ Weapons",   value: `${val(u.weapons.length)} *(crafted: ${craftedCnt})*\n\`lowo w\``, inline: true },
      { name: "🛡️ Armor",     value: u.armor.length > 0 ? `${val(u.armor.length)} pieces` : "*none*",   inline: true },
      { name: "🧿 Accessories", value: accCount > 0 ? val(accCount) : "*none*", inline: true },
      // Tickets / pickaxe row
      { name: "🎟️ Tickets",  value: val(u.lotteryTickets), inline: true },
      { name: "⛏️ Pickaxe",  value: u.hasPickaxe ? `Tier ${val(u.pickaxeTier)}` : "*none*", inline: true },
      { name: "🐕 Pet Streak", value: val(u.pet.streak), inline: true },
    );

  if (boxLines.length) e.addFields({ name: "📦 Crates", value: boxLines.join("  •  "), inline: false });
  if (consum.length)   e.addFields({ name: "🎁 Consumables", value: consum.join("  •  "), inline: false });

  await replyEmbed(message, e);
}
// Unused-but-exported type-suppression: sendLowoEmbed is exported for callers.
void sendLowoEmbed;

export async function cmdRename(message: Message, args: string[]): Promise<void> {
  const idx = parseInt(args[0] ?? "", 10);
  const newName = args.slice(1).join(" ").trim().slice(0, 30);
  if (isNaN(idx) || !newName) { await message.reply("Usage: `lowo rename <weaponIdx> <newName>`"); return; }
  const u = getUser(message.author.id);
  if (!u.weapons[idx]) { await message.reply("❌ Invalid weapon index."); return; }
  updateUser(message.author.id, (x) => {
    x.weapons[idx].id = `${newName.toLowerCase().replace(/\s+/g, "_")}_${idx}`;
  });
  await message.reply(`🏷️ Weapon \`${idx}\` renamed to **${newName}**.`);
}

export async function cmdDismantle(message: Message, args: string[]): Promise<void> {
  const idx = parseInt(args[0] ?? "", 10);
  if (isNaN(idx)) { await message.reply("Usage: `lowo dismantle <weaponIdx>`"); return; }
  const u = getUser(message.author.id);
  const w = u.weapons[idx];
  if (!w) { await message.reply("❌ Invalid weapon index."); return; }
  const essenceGain = ({ common: 2, uncommon: 5, rare: 12, epic: 30, mythic: 80 } as const)[w.rarity as "common"] ?? 1;
  updateUser(message.author.id, (x) => {
    x.weapons.splice(idx, 1);
    x.essence += essenceGain;
    for (const k of Object.keys(x.equipped)) {
      const v = parseInt(x.equipped[k], 10);
      if (v === idx) delete x.equipped[k];
      else if (v > idx) x.equipped[k] = String(v - 1);
    }
  });
  await message.reply(`🔨 Dismantled weapon \`${idx}\` → +**${essenceGain}** ✨ essence.`);
}

export async function cmdBattlesetting(message: Message, args: string[]): Promise<void> {
  const sub = args[0]?.toLowerCase();
  const u = getUser(message.author.id);
  if (sub === "instant" || sub === "fast") {
    updateUser(message.author.id, (x) => { x.instantBattle = !x.instantBattle; });
    const after = !u.instantBattle;
    await message.reply(`⚙️ Instant battle is now **${after ? "ON" : "OFF"}**${after ? " — battle log hidden." : " — battle log shown."}`);
    return;
  }
  await message.reply([
    "⚙️ **Battle Settings**",
    `Team size: 3 (fixed)`,
    `Your team: ${u.team.length === 0 ? "*empty*" : u.team.map(id => ANIMAL_BY_ID[id]?.name ?? id).join(", ")}`,
    `Instant mode: **${u.instantBattle ? "ON" : "OFF"}** *(toggle: \`lowo battlesetting instant\`)*`,
    `Modify team with \`lowo team add/remove <animalId>\``,
  ].join("\n"));
}
