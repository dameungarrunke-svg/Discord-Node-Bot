import type { Message } from "discord.js";
import { getUser, updateUser } from "./storage.js";

interface Quest { id: string; label: string; reward: number; check: (u: ReturnType<typeof getUser>) => boolean }

const DAILY_QUESTS: Quest[] = [
  { id: "hunt5", label: "Hunt 5 animals (use `lowo hunt`)", reward: 200, check: (u) => Object.values(u.zoo).reduce((a, b) => a + b, 0) >= 5 },
  { id: "battle", label: "Win a battle", reward: 300, check: (u) => u.cowoncy > 0 }, // approx
  { id: "feed", label: "Feed your pet today", reward: 150, check: (u) => Date.now() - u.pet.lastFed < 24 * 3600 * 1000 },
  { id: "harvest", label: "Harvest your garden", reward: 100, check: (u) => Date.now() - u.piku.lastHarvest < 24 * 3600 * 1000 },
  { id: "dex10", label: "Have 10 unique animals in your Lowodex", reward: 500, check: (u) => u.dex.length >= 10 },
];

export async function cmdQuest(message: Message): Promise<void> {
  const u = getUser(message.author.id);
  const lines = ["📜 **Daily Quests**"];
  for (const q of DAILY_QUESTS) {
    const done = q.check(u);
    lines.push(`${done ? "✅" : "⬜"} ${q.label} — **${q.reward}** cowoncy`);
  }
  lines.push("\nUse `lowo checklist` to claim completed rewards.");
  await message.reply(lines.join("\n"));
}

export async function cmdChecklist(message: Message): Promise<void> {
  const u = getUser(message.author.id);
  let claimed = 0, total = 0;
  for (const q of DAILY_QUESTS) if (q.check(u)) { claimed++; total += q.reward; }
  if (claimed === 0) { await message.reply("📭 No completed quests to claim."); return; }
  updateUser(message.author.id, (x) => { x.cowoncy += total; });
  await message.reply(`🎁 Claimed **${claimed}** quests → +**${total}** cowoncy!`);
}
