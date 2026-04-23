import type { Message } from "discord.js";
import { getUser, updateUser } from "./storage.js";
import { ANIMALS, ANIMAL_BY_ID, RARITY_COLOR, rollAnimal, type Rarity } from "./data.js";

const HUNT_COOLDOWN_MS = 15_000;

export async function cmdHunt(message: Message): Promise<void> {
  const u = getUser(message.author.id);
  const now = Date.now();
  if (now - u.lastHunt < HUNT_COOLDOWN_MS) {
    const left = Math.ceil((HUNT_COOLDOWN_MS - (now - u.lastHunt)) / 1000);
    await message.reply(`⏳ Slow down! Hunt again in **${left}s**.`);
    return;
  }
  const a = rollAnimal();
  updateUser(message.author.id, (x) => {
    x.lastHunt = now;
    x.zoo[a.id] = (x.zoo[a.id] ?? 0) + 1;
    if (!x.dex.includes(a.id)) x.dex.push(a.id);
  });
  await message.reply(`🎯 **${message.author.username}** went hunting and caught a ${RARITY_COLOR[a.rarity]} **${a.name}** ${a.emoji} *(${a.rarity})*`);
}

export async function cmdZoo(message: Message): Promise<void> {
  const target = message.mentions.users.first() ?? message.author;
  const u = getUser(target.id);
  const entries = Object.entries(u.zoo).filter(([, c]) => c > 0);
  if (entries.length === 0) { await message.reply(`📭 **${target.username}** has no animals yet. Try \`lowo hunt\`!`); return; }

  const grouped: Record<Rarity, string[]> = { common: [], uncommon: [], rare: [], epic: [], mythic: [], legendary: [] };
  for (const [id, count] of entries) {
    const a = ANIMAL_BY_ID[id]; if (!a) continue;
    grouped[a.rarity].push(`${a.emoji} ${a.name} ×${count}`);
  }
  const lines: string[] = [`🦊 **${target.username}'s Zoo**`];
  for (const r of ["legendary", "mythic", "epic", "rare", "uncommon", "common"] as Rarity[]) {
    if (grouped[r].length) lines.push(`\n${RARITY_COLOR[r]} **${r.toUpperCase()}**\n${grouped[r].join(", ")}`);
  }
  await message.reply(lines.join("\n").slice(0, 1900));
}

export async function cmdSell(message: Message, args: string[]): Promise<void> {
  const id = args[0]?.toLowerCase();
  const a = id ? ANIMAL_BY_ID[id] : null;
  if (!a) { await message.reply("Usage: `lowo sell <animalId> [count|all]` — e.g. `lowo sell puppy 5`"); return; }
  const u = getUser(message.author.id);
  const owned = u.zoo[a.id] ?? 0;
  if (owned <= 0) { await message.reply(`❌ You don't own any ${a.emoji} ${a.name}.`); return; }
  const arg2 = args[1]?.toLowerCase();
  const count = !arg2 ? 1 : arg2 === "all" ? owned : Math.max(1, Math.min(owned, parseInt(arg2, 10) || 1));
  const total = count * a.sellPrice;
  updateUser(message.author.id, (x) => { x.zoo[a.id] -= count; x.cowoncy += total; });
  await message.reply(`💰 Sold ${count}× ${a.emoji} **${a.name}** for **${total}** cowoncy.`);
}

export async function cmdSacrifice(message: Message, args: string[]): Promise<void> {
  const id = args[0]?.toLowerCase();
  const a = id ? ANIMAL_BY_ID[id] : null;
  if (!a) { await message.reply("Usage: `lowo sacrifice <animalId> [count|all]`"); return; }
  const u = getUser(message.author.id);
  const owned = u.zoo[a.id] ?? 0;
  if (owned <= 0) { await message.reply(`❌ You don't own any ${a.emoji} ${a.name}.`); return; }
  const arg2 = args[1]?.toLowerCase();
  const count = !arg2 ? 1 : arg2 === "all" ? owned : Math.max(1, Math.min(owned, parseInt(arg2, 10) || 1));
  const total = count * a.essence;
  updateUser(message.author.id, (x) => { x.zoo[a.id] -= count; x.essence += total; });
  await message.reply(`✨ Sacrificed ${count}× ${a.emoji} **${a.name}** → +**${total}** essence.`);
}

export async function cmdLowodex(message: Message): Promise<void> {
  const target = message.mentions.users.first() ?? message.author;
  const u = getUser(target.id);
  const total = ANIMALS.length;
  const owned = u.dex.length;
  const pct = Math.round((owned / total) * 100);
  const lines = [`📕 **${target.username}'s Lowodex** — ${owned}/${total} (${pct}%)`];
  for (const a of ANIMALS) {
    const got = u.dex.includes(a.id);
    lines.push(`${got ? "✅" : "⬜"} ${a.emoji} ${a.name} \`${a.id}\` ${RARITY_COLOR[a.rarity]}`);
  }
  await message.reply(lines.join("\n").slice(0, 1900));
}
