// THE NEW ERA — Pet recycling + 100-pet fusion system
//
// `lowo recycle <name> [n|all]` — break down owned pets into Pet Materials.
//   common=1, uncommon=3, rare=8, epic=20, mythic=50, legendary=100, secret=500
//
// `lowo fuse <petA> <petB>` — fuse 2 pets + 50 Pet Materials into a random
//   fusion pet (one of the 100 generated FUSION_PETS). Higher-rarity inputs
//   bias toward higher-rarity fusion outputs.
//
// `lowo materials` / `lowo mats` — show current Pet Materials count.
import type { Message } from "discord.js";
import { getUser, updateUser } from "./storage.js";
import { ANIMAL_BY_ID, ANIMALS, FUSION_PETS, RARITY_COLOR, type Rarity } from "./data.js";
import { emoji } from "./emojis.js";

const RECYCLE_VALUE: Record<Rarity, number> = {
  common: 1, uncommon: 3, rare: 8, epic: 20, mythic: 50, legendary: 100, secret: 500,
} as Record<Rarity, number>;

const FUSE_COST_MATERIALS = 50;

// ─── Tolerant lookup (mirrors hunt.ts behaviour) ─────────────────────────────
const norm = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const ANIMAL_LOOKUP: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const a of ANIMALS) {
    map[norm(a.id)] = a.id;
    map[norm(a.name)] = a.id;
  }
  return map;
})();
function resolveAnimalId(query: string): string | null {
  if (!query) return null;
  return ANIMAL_LOOKUP[norm(query)] ?? null;
}

function parseAnimalAndCount(args: string[], owned: number | null): { id: string | null; count: number; name: string } {
  if (args.length === 0) return { id: null, count: 1, name: "" };
  const last = args[args.length - 1].toLowerCase();
  let nameTokens = args;
  let count = 1;
  if (last === "all") { nameTokens = args.slice(0, -1); count = owned ?? 1; }
  else if (/^\d+$/.test(last)) { nameTokens = args.slice(0, -1); count = Math.max(1, parseInt(last, 10)); }
  return { id: resolveAnimalId(nameTokens.join(" ")), count, name: nameTokens.join(" ") };
}

export async function cmdRecycle(message: Message, args: string[]): Promise<void> {
  const u = getUser(message.author.id);
  const peek = parseAnimalAndCount(args, null);
  const owned = peek.id ? (u.zoo[peek.id] ?? 0) : 0;
  const { id, count: rawCount, name } = parseAnimalAndCount(args, owned);
  if (!id) {
    await message.reply(`Usage: \`lowo recycle <name> [count|all]\` — break down owned pets into 🧬 Pet Materials. *(Got: \`${name || "(empty)"}\`)*`);
    return;
  }
  const a = ANIMAL_BY_ID[id];
  if (owned <= 0) { await message.reply(`${emoji("fail")} You don't own any ${a.emoji} ${a.name}.`); return; }
  const count = Math.max(1, Math.min(owned, rawCount));
  const per = RECYCLE_VALUE[a.rarity] ?? 1;
  const total = count * per;
  updateUser(message.author.id, (x) => { x.zoo[a.id] -= count; x.petMaterials += total; });
  await message.reply(`🧬 Recycled ${count}× ${a.emoji} **${a.name}** *(${a.rarity})* → +**${total.toLocaleString()}** Pet Materials.\n*(You now have ${(u.petMaterials + total).toLocaleString()} 🧬.)*`);
}

export async function cmdMaterials(message: Message): Promise<void> {
  const u = getUser(message.author.id);
  await message.reply([
    `🧬 **${message.author.username}'s Pet Materials**`,
    `You have **${u.petMaterials.toLocaleString()}** 🧬.`,
    `Earn more with \`lowo recycle <petName> [n|all]\`.`,
    `Each fusion costs **${FUSE_COST_MATERIALS}** 🧬 + 2 base pets via \`lowo fuse <petA> <petB>\`.`,
    `Owned fusion pets count toward the **100-pet fusion roster**.`,
  ].join("\n"));
}

export async function cmdFuse(message: Message, args: string[]): Promise<void> {
  // Args parsed as two pet names separated by `+` or whitespace pairs.
  // Easiest interface: `lowo fuse <petA> + <petB>`. We split on the literal `+`
  // first; otherwise we assume the args split into halves.
  const u = getUser(message.author.id);
  if (u.petMaterials < FUSE_COST_MATERIALS) {
    await message.reply(`${emoji("fail")} Need **${FUSE_COST_MATERIALS}** 🧬 Pet Materials *(you have ${u.petMaterials})*. Recycle pets via \`lowo recycle\`.`);
    return;
  }
  const joined = args.join(" ");
  const parts = joined.includes("+")
    ? joined.split("+").map((s) => s.trim()).filter(Boolean)
    : (() => {
        // Fallback: split args in half
        const mid = Math.floor(args.length / 2);
        return [args.slice(0, mid).join(" ").trim(), args.slice(mid).join(" ").trim()].filter(Boolean);
      })();
  if (parts.length < 2 || !parts[0] || !parts[1]) {
    await message.reply(`Usage: \`lowo fuse <petA> + <petB>\` — costs ${FUSE_COST_MATERIALS} 🧬 Pet Materials and 1 of each pet.`);
    return;
  }
  const idA = resolveAnimalId(parts[0]);
  const idB = resolveAnimalId(parts[1]);
  if (!idA || !idB) {
    await message.reply(`${emoji("fail")} Couldn't find one of the pets: \`${parts[0]}\` / \`${parts[1]}\`.`);
    return;
  }
  const aOwned = u.zoo[idA] ?? 0;
  const bOwned = u.zoo[idB] ?? 0;
  const sameId = idA === idB;
  if (sameId ? aOwned < 2 : (aOwned < 1 || bOwned < 1)) {
    await message.reply(`${emoji("fail")} You need at least one of each pet (or 2 of the same pet if you pick the same).`);
    return;
  }
  const a = ANIMAL_BY_ID[idA];
  const b = ANIMAL_BY_ID[idB];
  // Cannot fuse fusion pets themselves (only base pets feed the system).
  if (a.id.startsWith("fusion_") || b.id.startsWith("fusion_")) {
    await message.reply(`${emoji("fail")} Fusion pets cannot be re-fused. Pick two base pets.`);
    return;
  }
  // Bias the output rarity by the average rarity tier of the inputs.
  const RANK: Record<Rarity, number> = {
    common: 0, uncommon: 1, rare: 2, epic: 3, mythic: 4, legendary: 5, secret: 6,
  } as Record<Rarity, number>;
  const avg = ((RANK[a.rarity] ?? 0) + (RANK[b.rarity] ?? 0)) / 2;
  // Map avg → output pool: <=1 epic only, <=2.5 epic+mythic, >2.5 include legendary
  let pool: typeof FUSION_PETS;
  if (avg <= 1) pool = FUSION_PETS.filter((p) => p.rarity === "epic");
  else if (avg <= 2.5) pool = FUSION_PETS.filter((p) => p.rarity === "epic" || p.rarity === "mythic");
  else pool = FUSION_PETS;
  if (pool.length === 0) pool = FUSION_PETS;
  const result = pool[Math.floor(Math.random() * pool.length)];

  updateUser(message.author.id, (x) => {
    x.petMaterials -= FUSE_COST_MATERIALS;
    x.zoo[idA] = (x.zoo[idA] ?? 0) - 1;
    if (sameId) x.zoo[idA] = (x.zoo[idA] ?? 0) - 1;
    else x.zoo[idB] = (x.zoo[idB] ?? 0) - 1;
    x.zoo[result.id] = (x.zoo[result.id] ?? 0) + 1;
    if (!x.dex.includes(result.id)) x.dex.push(result.id);
    x.fusionPetCount = (x.fusionPetCount ?? 0) + 1;
  });

  await message.reply([
    `🧬 **FUSION SUCCESSFUL!** 🧬`,
    `Combined ${a.emoji} **${a.name}** + ${b.emoji} **${b.name}** *(−${FUSE_COST_MATERIALS} 🧬)*`,
    `→ ${RARITY_COLOR[result.rarity]} ${result.emoji} **${result.name}** *(${result.rarity} fusion)* added to your zoo!`,
    `Total fusions performed: **${(u.fusionPetCount + 1)}** / 100 unique`,
  ].join("\n"));
}
