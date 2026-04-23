import type { Message } from "discord.js";
import { getUser, updateUser } from "./storage.js";

const HARVEST_COOLDOWN_MS = 60 * 60 * 1000; // 1h
const PET_RESET_MS = 48 * 60 * 60 * 1000;
const PET_FEED_COOLDOWN_MS = 20 * 60 * 60 * 1000;

export async function cmdPiku(message: Message): Promise<void> {
  const u = getUser(message.author.id);
  const now = Date.now();
  if (now - u.piku.lastHarvest < HARVEST_COOLDOWN_MS) {
    const left = Math.ceil((HARVEST_COOLDOWN_MS - (now - u.piku.lastHarvest)) / 60000);
    await message.reply(`🥕 Garden is regrowing… try again in **${left}m**.`);
    return;
  }
  const yieldAmount = 50 + u.piku.harvested * 10;
  updateUser(message.author.id, (x) => {
    x.piku.harvested += 1;
    x.piku.lastHarvest = now;
    x.cowoncy += yieldAmount;
  });
  await message.reply(`🌱 Harvested 🥕 carrots! +**${yieldAmount}** cowoncy. Streak: **${u.piku.harvested + 1}**`);
}

export async function cmdPikuReset(message: Message): Promise<void> {
  updateUser(message.author.id, (x) => { x.piku.harvested = 0; });
  await message.reply("🪴 Garden reset. Streak back to 0.");
}

export async function cmdPet(message: Message): Promise<void> {
  const u = getUser(message.author.id);
  const status = u.pet.lastFed === 0 ? "Never fed" : `Last fed <t:${Math.floor(u.pet.lastFed / 1000)}:R>`;
  await message.reply(`🦊 **Lowo Pet** — Streak: **${u.pet.streak}** days\n${status}\nUse \`lowo feed\` daily to keep the streak alive.`);
}

export async function cmdFeed(message: Message): Promise<void> {
  const u = getUser(message.author.id);
  const now = Date.now();
  if (now - u.pet.lastFed < PET_FEED_COOLDOWN_MS && u.pet.lastFed !== 0) {
    const left = Math.ceil((PET_FEED_COOLDOWN_MS - (now - u.pet.lastFed)) / 3600000);
    await message.reply(`🍖 Already fed! Wait **${left}h** before feeding again.`);
    return;
  }
  let newStreak = u.pet.streak + 1;
  let resetMsg = "";
  if (u.pet.lastFed !== 0 && now - u.pet.lastFed > PET_RESET_MS) {
    newStreak = 1; resetMsg = " 💔 *(streak reset — too long!)*";
  }
  const reward = 50 + newStreak * 10;
  updateUser(message.author.id, (x) => { x.pet.lastFed = now; x.pet.streak = newStreak; x.cowoncy += reward; });
  await message.reply(`🍖 Fed your pet! +**${reward}** cowoncy. Streak: **${newStreak}**${resetMsg}`);
}
