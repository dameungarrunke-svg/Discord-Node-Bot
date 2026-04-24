import type { Message } from "discord.js";
import { getUser, updateUser } from "./storage.js";
import { ANIMALS, ANIMAL_BY_ID, RARITY_COLOR, rollAnimal, PITY_THRESHOLD, type Rarity } from "./data.js";
import { onHuntCaught, bestHuntCdMultiplier, sellMultiplier, essenceMultiplier } from "./skills.js";
import { eventBonus, activeEvent } from "./events.js";

const BASE_HUNT_COOLDOWN_MS = 15_000;

function rollWithRareRush(): ReturnType<typeof rollAnimal> {
  // If "rare_rush" event is active, multiply rare+ weights ×3 by rolling 3 times
  // and picking the highest-rarity result. Simple, effective, OwO-style.
  const boost = eventBonus("rare");
  if (boost <= 1) return rollAnimal();
  const rolls = Array.from({ length: boost }, () => rollAnimal());
  const order: Rarity[] = ["legendary", "mythic", "epic", "rare", "uncommon", "common"];
  rolls.sort((a, b) => order.indexOf(a.rarity) - order.indexOf(b.rarity));
  return rolls[0];
}

export async function cmdHunt(message: Message): Promise<void> {
  const u = getUser(message.author.id);
  const now = Date.now();
  const cdMult = bestHuntCdMultiplier(message.author.id);
  const cooldown = Math.floor(BASE_HUNT_COOLDOWN_MS * cdMult);
  if (now - u.lastHunt < cooldown) {
    const left = Math.ceil((cooldown - (now - u.lastHunt)) / 1000);
    await message.reply(`⏳ Slow down! Hunt again in **${left}s**.`);
    return;
  }

  // Determine drop count (Double Hunt event = 2)
  const drops = eventBonus("hunt"); // 1 or 2
  const caught: Array<ReturnType<typeof rollAnimal>> = [];
  let pityTriggered = false;

  for (let i = 0; i < drops; i++) {
    let a = rollWithRareRush();
    // Pity: if pity counter is at threshold, force a legendary
    const currentPity = (u.pity ?? 0) + caught.filter((c) => c.rarity !== "legendary").length;
    if (currentPity >= PITY_THRESHOLD) {
      const legendaries = ANIMALS.filter((x) => x.rarity === "legendary");
      if (legendaries.length) { a = legendaries[Math.floor(Math.random() * legendaries.length)]; pityTriggered = true; }
    }
    caught.push(a);
  }

  updateUser(message.author.id, (x) => {
    x.lastHunt = now;
    for (const a of caught) {
      x.zoo[a.id] = (x.zoo[a.id] ?? 0) + 1;
      if (!x.dex.includes(a.id)) x.dex.push(a.id);
      // Update pity
      if (a.rarity === "legendary") x.pity = 0;
      else x.pity = (x.pity ?? 0) + 1;
    }
  });
  for (const a of caught) onHuntCaught(message.author.id, a.id);

  const ev = activeEvent();
  const evNote = ev ? `\n${ev.emoji} *${ev.name} active*` : "";
  const pityNote = pityTriggered ? "\n🌟 **PITY!** Guaranteed legendary triggered!" : "";

  if (caught.length === 1) {
    const a = caught[0];
    await message.reply(`🎯 **${message.author.username}** went hunting and caught a ${RARITY_COLOR[a.rarity]} **${a.name}** ${a.emoji} *(${a.rarity})*${evNote}${pityNote}`);
  } else {
    const list = caught.map(a => `${RARITY_COLOR[a.rarity]} ${a.emoji} **${a.name}** *(${a.rarity})*`).join(" + ");
    await message.reply(`🎯 **${message.author.username}** went hunting and caught **${caught.length}** animals!\n${list}${evNote}${pityNote}`);
  }
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
  const sellMult = sellMultiplier(message.author.id, a.id);
  const total = Math.floor(count * a.sellPrice * sellMult);
  updateUser(message.author.id, (x) => { x.zoo[a.id] -= count; x.cowoncy += total; });
  const perkNote = sellMult > 1 ? ` *(Lv 3 perk +25%)*` : "";
  await message.reply(`💰 Sold ${count}× ${a.emoji} **${a.name}** for **${total.toLocaleString()}** cowoncy${perkNote}.`);
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
  const evMult = eventBonus("essence");
  const perkMult = essenceMultiplier(message.author.id, a.id);
  const total = Math.floor(count * a.essence * evMult * perkMult);
  updateUser(message.author.id, (x) => { x.zoo[a.id] -= count; x.essence += total; });
  const tags: string[] = [];
  if (evMult > 1)   tags.push("✨ Essence Storm ×2");
  if (perkMult > 1) tags.push("Lv 10 perk ×2");
  const tag = tags.length ? ` *(${tags.join(", ")})*` : "";
  await message.reply(`✨ Sacrificed ${count}× ${a.emoji} **${a.name}** → +**${total.toLocaleString()}** essence${tag}.`);
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
