import type { Message } from "discord.js";
import { getUser, updateUser } from "./storage.js";
import { ENCHANTMENTS, ENCHANT_BY_ID, ANIMAL_BY_ID } from "./data.js";

function resolveAnimalIdLike(q: string): string | null {
  if (!q) return null;
  const lc = q.toLowerCase().trim();
  if (ANIMAL_BY_ID[lc]) return lc;
  // try to match by name or by emoji prefix
  const all = Object.values(ANIMAL_BY_ID);
  const byName = all.find((a) => a.name.toLowerCase() === lc);
  if (byName) return byName.id;
  return null;
}

export async function cmdEnchant(message: Message, args: string[]): Promise<void> {
  const sub = args[0]?.toLowerCase();
  const u = getUser(message.author.id);

  if (!sub || sub === "list") {
    const lines = ["📕 **Enchantments** — apply with `lowo enchant <petId> <enchantId>`."];
    for (const e of ENCHANTMENTS) {
      const owned = u.enchantTomes[e.tomeShopId] ?? 0;
      lines.push(`${e.emoji} \`${e.id}\` — **${e.name}** *(${e.description})* • ✨ ${e.essenceCost.toLocaleString()} essence • Tomes owned: **${owned}**`);
    }
    lines.push(`\n_Buy tomes from \`lowo shop enchant\` first._`);
    await message.reply(lines.join("\n"));
    return;
  }

  // `lowo enchant view <petId>`
  if (sub === "view") {
    const petId = resolveAnimalIdLike(args[1] ?? "");
    if (!petId) { await message.reply("Usage: `lowo enchant view <petId>`"); return; }
    const cur = u.enchantments[petId];
    if (!cur) { await message.reply(`📕 **${ANIMAL_BY_ID[petId].name}** has no enchant.`); return; }
    const e = ENCHANT_BY_ID[cur.enchantId];
    await message.reply(`${e?.emoji ?? "📕"} **${ANIMAL_BY_ID[petId].name}** is enchanted with **${e?.name ?? cur.enchantId}** *(${e?.description ?? ""})*.`);
    return;
  }

  // `lowo enchant <petId> <enchantId>`
  const petId = resolveAnimalIdLike(sub);
  const enchantId = (args[1] ?? "").toLowerCase();
  if (!petId) { await message.reply("Usage: `lowo enchant <petId> <enchantId>` *(use `lowo enchant list` to see options)*"); return; }
  if (!ENCHANT_BY_ID[enchantId]) { await message.reply(`❌ Unknown enchant \`${enchantId}\`. Try \`lowo enchant list\`.`); return; }
  if ((u.zoo[petId] ?? 0) <= 0) { await message.reply(`❌ You don't own ${ANIMAL_BY_ID[petId].emoji} **${ANIMAL_BY_ID[petId].name}**.`); return; }
  const def = ENCHANT_BY_ID[enchantId];
  if ((u.enchantTomes[def.tomeShopId] ?? 0) <= 0) {
    await message.reply(`❌ You need a **${def.name}** tome — buy from \`lowo shop enchant\`.`);
    return;
  }
  if (u.essence < def.essenceCost) {
    await message.reply(`❌ Need **${def.essenceCost.toLocaleString()}** ✨ essence (you have ${u.essence.toLocaleString()}).`);
    return;
  }
  const old = u.enchantments[petId];
  updateUser(message.author.id, (x) => {
    x.essence -= def.essenceCost;
    x.enchantTomes[def.tomeShopId] = (x.enchantTomes[def.tomeShopId] ?? 0) - 1;
    x.enchantments[petId] = { enchantId: def.id, appliedAt: Date.now() };
  });
  const replaced = old ? ` *(replaced ${ENCHANT_BY_ID[old.enchantId]?.name ?? old.enchantId})*` : "";
  await message.reply(`${def.emoji} **${ANIMAL_BY_ID[petId].name}** is now enchanted with **${def.name}**!${replaced}`);
}

// Helpers for battle/skills/hunt to compute enchant boosts on a single pet.
export function petEnchantStats(petId: string, userId: string): { hpPct: number; atkPct: number; defPct: number; magPct: number; teamLuck: number; teamCritPct: number } {
  const u = getUser(userId);
  const e = u.enchantments[petId];
  const out = { hpPct: 0, atkPct: 0, defPct: 0, magPct: 0, teamLuck: 0, teamCritPct: 0 };
  if (!e) return out;
  const def = ENCHANT_BY_ID[e.enchantId];
  if (!def) return out;
  out.hpPct  = (def.hpPct  ?? 0) + (def.allPct ?? 0);
  out.atkPct = (def.atkPct ?? 0) + (def.allPct ?? 0);
  out.defPct = (def.defPct ?? 0) + (def.allPct ?? 0);
  out.magPct = (def.magPct ?? 0) + (def.allPct ?? 0);
  out.teamLuck    = def.teamLuck ?? 0;
  out.teamCritPct = def.teamCritPct ?? 0;
  return out;
}

// Sum team luck across enchanted team pets (added to multiplicative path).
export function teamEnchantLuck(userId: string): number {
  const u = getUser(userId);
  let m = 1;
  for (const id of u.team) {
    const s = petEnchantStats(id, userId);
    if (s.teamLuck > 0) m *= 1 + s.teamLuck;
  }
  return m;
}
