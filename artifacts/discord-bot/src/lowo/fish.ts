import type { Message } from "discord.js";
import { getUser, updateUser } from "./storage.js";
import { rollFish, RARITY_COLOR, luckMultiplier } from "./data.js";
import { onHuntCaught } from "./skills.js";

const FISH_COOLDOWN_MS = 15_000;

export async function cmdFish(message: Message): Promise<void> {
  const u = getUser(message.author.id);
  const now = Date.now();
  if (u.fishingRod <= 0) {
    await message.reply("🎣 You need a **Fishing Rod**. Buy one with `lowo buy rod` (3,000 cowoncy).");
    return;
  }
  if (now - u.lastFish < FISH_COOLDOWN_MS) {
    const left = Math.ceil((FISH_COOLDOWN_MS - (now - u.lastFish)) / 1000);
    await message.reply(`⏳ The water needs to settle. Fish again in **${left}s**.`);
    return;
  }
  const luck = luckMultiplier(u.arcuesUnlocked, u.luckUntil);
  const a = rollFish(luck);
  updateUser(message.author.id, (x) => {
    x.lastFish = now;
    x.zoo[a.id] = (x.zoo[a.id] ?? 0) + 1;
    if (!x.dex.includes(a.id)) x.dex.push(a.id);
  });
  onHuntCaught(message.author.id, a.id);
  await message.reply(`🎣 **${message.author.username}** cast a line and reeled in a ${RARITY_COLOR[a.rarity]} **${a.name}** ${a.emoji} *(${a.rarity})*`);
}
