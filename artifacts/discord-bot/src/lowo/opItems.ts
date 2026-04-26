import type { Message } from "discord.js";
import { getUser, updateUser } from "./storage.js";
import {
  ANIMAL_BY_ID, ANIMALS, RARITY_COLOR, PET_ATTRIBUTES, getPetAttribute,
  type Animal, type Rarity,
} from "./data.js";

const norm = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const ANIMAL_LOOKUP: Record<string, string> = (() => {
  const m: Record<string, string> = {};
  for (const a of ANIMALS) { m[norm(a.id)] = a.id; m[norm(a.name)] = a.id; }
  return m;
})();
function resolveId(q: string): string | null { return ANIMAL_LOOKUP[norm(q)] ?? null; }

function pickFromPool(pool: Animal[]): Animal {
  return pool[Math.floor(Math.random() * pool.length)];
}

const POOL_PET_CHEST: Set<Rarity> = new Set(["mythic","legendary","ethereal","divine"]);
const POOL_GOD_CHEST: Set<Rarity> = new Set(["legendary","ethereal","divine","omni","glitched"]);
const POOL_VOID_CHEST: Set<Rarity> = new Set(["cosmic","void","inferno","secret","supreme","transcendent"]);

function rollFromChest(chestId: string): Animal {
  const wanted = chestId === "op_pet_chest" ? POOL_PET_CHEST
    : chestId === "op_god_chest" ? POOL_GOD_CHEST
    : POOL_VOID_CHEST;
  const pool = ANIMALS.filter((a) => wanted.has(a.rarity) && !a.eventOnly);
  return pickFromPool(pool.length ? pool : ANIMALS);
}

// `lowo op_open <chestId>` — consumes one OP chest.
export async function cmdOpOpen(message: Message, args: string[]): Promise<void> {
  const id = (args[0] ?? "").toLowerCase();
  const valid = ["op_pet_chest","op_god_chest","op_void_chest"];
  if (!valid.includes(id)) {
    await message.reply(`Usage: \`lowo op_open <op_pet_chest|op_god_chest|op_void_chest>\``);
    return;
  }
  const u = getUser(message.author.id);
  if ((u.opChests[id] ?? 0) <= 0) {
    await message.reply(`❌ You don't own a **${id}**. Buy one with \`lowo buy ${id}\`.`);
    return;
  }
  const a = rollFromChest(id);
  updateUser(message.author.id, (x) => {
    x.opChests[id] = (x.opChests[id] ?? 0) - 1;
    x.zoo[a.id] = (x.zoo[a.id] ?? 0) + 1;
    if (!x.dex.includes(a.id)) x.dex.push(a.id);
  });
  await message.reply(`📦💥 You opened **${id}** and got ${RARITY_COLOR[a.rarity]} ${a.emoji} **${a.name}** *(${a.rarity})*!`);
}

// `lowo reroll <petId>` — consumes 1 OP Attribute Seal to reroll the attribute.
export async function cmdReroll(message: Message, args: string[]): Promise<void> {
  const petId = resolveId(args[0] ?? "");
  if (!petId) { await message.reply("Usage: `lowo reroll <petId>` — needs an OP Attribute Seal."); return; }
  const a = ANIMAL_BY_ID[petId];
  const attr = getPetAttribute(a);
  if (!attr) { await message.reply(`❌ ${a.emoji} **${a.name}** has no attribute slot (must be ethereal+ rarity).`); return; }
  const u = getUser(message.author.id);
  const sealId = "op_attribute_seal";
  if ((u.opChests[sealId] ?? 0) <= 0) {
    await message.reply(`❌ You don't own an **OP Attribute Seal**. Buy one from \`lowo shop op_expensive\`.`);
    return;
  }
  // Pick a NEW random attribute (any from the catalog — flavor-only reroll for the user's flex).
  const next = PET_ATTRIBUTES[Math.floor(Math.random() * PET_ATTRIBUTES.length)];
  updateUser(message.author.id, (x) => { x.opChests[sealId] = (x.opChests[sealId] ?? 0) - 1; });
  await message.reply(`🪶 Rerolled the attribute on ${a.emoji} **${a.name}** — *(flex)* now showcases **${next.emoji} ${next.name}**: *${next.description}*\n_(Note: deterministic in-battle attribute remains the original; this seal serves as a displayable flex stamp.)_`);
}

// `lowo mutation` and `lowo mutation view <petId>`
export async function cmdMutation(message: Message, args: string[]): Promise<void> {
  const sub = args[0]?.toLowerCase();
  const u = getUser(message.author.id);
  if (!sub || sub === "list") {
    const owned = Object.entries(u.mutations);
    if (!owned.length) { await message.reply("🧬 You have no mutated pets. Mutations only roll during the 10 mutation events."); return; }
    const lines = ["🧬 **Your Mutated Pets**"];
    for (const [petId, info] of owned) {
      const a = ANIMAL_BY_ID[petId]; if (!a) continue;
      lines.push(`• ${a.emoji} **${a.name}** — \`${info.mutationId}\``);
    }
    await message.reply(lines.join("\n").slice(0, 1900));
    return;
  }
  if (sub === "view") {
    const petId = resolveId(args[1] ?? "");
    if (!petId) { await message.reply("Usage: `lowo mutation view <petId>`"); return; }
    const info = u.mutations[petId];
    if (!info) { await message.reply(`🧬 ${ANIMAL_BY_ID[petId].name} is not mutated.`); return; }
    await message.reply(`🧬 ${ANIMAL_BY_ID[petId].emoji} **${ANIMAL_BY_ID[petId].name}** — mutation: \`${info.mutationId}\``);
    return;
  }
  await message.reply("Usage: `lowo mutation [list|view <petId>]`");
}
