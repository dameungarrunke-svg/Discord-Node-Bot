import type { Message } from "discord.js";
import { getUser } from "./storage.js";
import { ANIMAL_BY_ID, FISH_POOL, RARITY_ORDER } from "./data.js";
import { emoji } from "./emojis.js";

export async function cmdAquarium(message: Message): Promise<void> {
  const target = message.mentions.users.first() ?? message.author;
  const u = getUser(target.id);
  const owned = Object.entries(u.aquarium).filter(([, n]) => (n ?? 0) > 0);
  if (owned.length === 0) {
    await message.reply(`${emoji("fish")} **${target.username}'s Aquarium is empty.** Cast a line with \`lowo fish\`!`);
    return;
  }
  // Group by rarity for nicer display
  const byRarity: Record<string, Array<[string, number]>> = {};
  for (const [id, n] of owned) {
    const a = ANIMAL_BY_ID[id]; if (!a) continue;
    (byRarity[a.rarity] ??= []).push([id, n]);
  }
  const lines = [`${emoji("fish")} **${target.username}'s Aquarium** *(${owned.length}/${FISH_POOL.length} unique)*`];
  for (const r of RARITY_ORDER) {
    if (!byRarity[r]) continue;
    lines.push(`__**${r.toUpperCase()}**__`);
    const cells = byRarity[r].map(([id, n]) => {
      const a = ANIMAL_BY_ID[id];
      return `${a.emoji} ${a.name} ×${n}`;
    });
    lines.push(cells.join(" • "));
  }
  await message.reply(lines.join("\n").slice(0, 1950));
}

export async function cmdFishDex(message: Message): Promise<void> {
  const target = message.mentions.users.first() ?? message.author;
  const u = getUser(target.id);
  const known = new Set(u.fishDex);
  const lines = [`${emoji("fish")} **${target.username}'s Fish Dex** — ${known.size}/${FISH_POOL.length}`];
  for (const r of RARITY_ORDER) {
    const tier = FISH_POOL.filter((a) => a.rarity === r);
    if (tier.length === 0) continue;
    const list = tier.map((a) => known.has(a.id) ? `${a.emoji} ${a.name}` : `🔒 ???`);
    lines.push(`__**${r.toUpperCase()}**__ — ${list.join(" • ")}`);
  }
  await message.reply(lines.join("\n").slice(0, 1950));
}
