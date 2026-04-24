import type { Message } from "discord.js";
import { getUser, updateUser } from "./storage.js";

interface Quest { id: string; label: string; reward: number; check: (u: ReturnType<typeof getUser>) => boolean }

const DAILY_QUESTS: Quest[] = [
  { id: "hunt5",   label: "Hunt 5 animals (use `lowo hunt`)", reward: 200, check: (u) => Object.values(u.zoo).reduce((a, b) => a + b, 0) >= 5 },
  { id: "battle",  label: "Have at least 1 cowoncy (be active)", reward: 300, check: (u) => u.cowoncy > 0 },
  { id: "feed",    label: "Feed your pet today", reward: 150, check: (u) => Date.now() - u.pet.lastFed < 24 * 3600 * 1000 },
  { id: "harvest", label: "Harvest your garden", reward: 100, check: (u) => Date.now() - u.piku.lastHarvest < 24 * 3600 * 1000 },
  { id: "dex10",   label: "Have 10 unique animals in your Lowodex", reward: 500, check: (u) => u.dex.length >= 10 },
];

function todayKey(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

export async function cmdQuest(message: Message): Promise<void> {
  const u = getUser(message.author.id);
  const today = todayKey();
  const claimedToday = u.claimedQuests.date === today ? u.claimedQuests.ids : [];
  const lines = ["📜 **Daily Quests** *(reset 00:00 UTC)*"];
  for (const q of DAILY_QUESTS) {
    const done = q.check(u);
    const claimed = claimedToday.includes(q.id);
    const icon = claimed ? "💰" : done ? "✅" : "⬜";
    const suffix = claimed ? " *(claimed)*" : "";
    lines.push(`${icon} ${q.label} — **${q.reward}** cowoncy${suffix}`);
  }
  lines.push("\nUse `lowo checklist` to claim completed rewards.");
  await message.reply(lines.join("\n"));
}

export async function cmdChecklist(message: Message): Promise<void> {
  const u = getUser(message.author.id);
  const today = todayKey();
  const claimedToday = u.claimedQuests.date === today ? new Set(u.claimedQuests.ids) : new Set<string>();

  let claimedCount = 0, total = 0;
  const newlyClaimed: string[] = [];
  for (const q of DAILY_QUESTS) {
    if (claimedToday.has(q.id)) continue;
    if (q.check(u)) { claimedCount++; total += q.reward; newlyClaimed.push(q.id); }
  }
  if (claimedCount === 0) {
    await message.reply("📭 No new quests to claim. Try `lowo quest` to see progress.");
    return;
  }
  updateUser(message.author.id, (x) => {
    x.cowoncy += total;
    x.claimedQuests = {
      date: today,
      ids: [...(x.claimedQuests.date === today ? x.claimedQuests.ids : []), ...newlyClaimed],
    };
  });
  await message.reply(`🎁 Claimed **${claimedCount}** quest${claimedCount === 1 ? "" : "s"} → +**${total.toLocaleString()}** cowoncy!`);
}
