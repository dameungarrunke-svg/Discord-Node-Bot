import type { Message } from "discord.js";
import { getUser, updateUser } from "./storage.js";
import { CRAFT_RECIPES, CRAFT_RECIPE_BY_ID, MINERAL_BY_ID } from "./data.js";
import { emoji } from "./emojis.js";
import { eventBonus } from "./events.js";

export async function cmdCraft(message: Message, args: string[]): Promise<void> {
  const sub = args[0]?.toLowerCase();
  const u = getUser(message.author.id);

  if (!sub || sub === "list") {
    const lines = [`${emoji("craft")} **Crafting Recipes** *(use \`lowo craft <recipeId>\` to forge)*`];
    for (const r of CRAFT_RECIPES) {
      const cost = Object.entries(r.cost)
        .map(([id, n]) => `${MINERAL_BY_ID[id]?.emoji ?? "🪨"}${n}×${MINERAL_BY_ID[id]?.name ?? id}`)
        .join(" + ");
      const can = canCraft(u, r.id) ? "✅" : "❌";
      lines.push(`${can} ${r.emoji} \`${r.id}\` — **${r.name}** *(${r.rarity})*`);
      lines.push(`  Mods: ATK+${r.modsBase.atk} DEF+${r.modsBase.def} MAG+${r.modsBase.mag}`);
      lines.push(`  Cost: ${cost} + ${r.cowoncyCost.toLocaleString()} cowoncy`);
    }
    await message.reply(lines.join("\n").slice(0, 1900));
    return;
  }

  const recipe = CRAFT_RECIPE_BY_ID[sub];
  if (!recipe) { await message.reply(`❌ Unknown recipe \`${sub}\`. Try \`lowo craft list\`.`); return; }
  if (!canCraft(u, recipe.id)) {
    const missing: string[] = [];
    for (const [mid, need] of Object.entries(recipe.cost)) {
      const have = u.minerals[mid] ?? 0;
      if (have < need) missing.push(`${MINERAL_BY_ID[mid]?.emoji ?? "🪨"} ${MINERAL_BY_ID[mid]?.name ?? mid} (${have}/${need})`);
    }
    if (u.cowoncy < recipe.cowoncyCost) missing.push(`💰 cowoncy (${u.cowoncy.toLocaleString()}/${recipe.cowoncyCost.toLocaleString()})`);
    await message.reply(`❌ You can't craft **${recipe.name}** yet. Missing: ${missing.join(", ")}`);
    return;
  }

  // Crafting Surge event yields an extra +1 weapon roll with random mods variance
  const surgeBonus = eventBonus("crafting_surge") > 1;

  const variance = () => 0.85 + Math.random() * 0.30;
  const finalMods = {
    atk: Math.floor(recipe.modsBase.atk * variance()),
    def: Math.floor(recipe.modsBase.def * variance()),
    mag: Math.floor(recipe.modsBase.mag * variance()),
  };

  const id = `${recipe.id}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`;

  updateUser(message.author.id, (x) => {
    for (const [mid, n] of Object.entries(recipe.cost)) {
      x.minerals[mid] = (x.minerals[mid] ?? 0) - n;
      if (x.minerals[mid] <= 0) delete x.minerals[mid];
    }
    x.cowoncy -= recipe.cowoncyCost;
    // Push as a regular weapon (so it's equippable) AND record it in craftedWeapons.
    x.weapons.push({ id, rarity: recipe.rarity, mods: finalMods });
    x.craftedWeapons.push({
      id, recipeId: recipe.id, name: recipe.name,
      rarity: recipe.rarity, mods: finalMods,
    });

    if (surgeBonus) {
      const id2 = `${recipe.id}_bonus_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 4)}`;
      const bonusMods = {
        atk: Math.floor(recipe.modsBase.atk * variance()),
        def: Math.floor(recipe.modsBase.def * variance()),
        mag: Math.floor(recipe.modsBase.mag * variance()),
      };
      x.weapons.push({ id: id2, rarity: recipe.rarity, mods: bonusMods });
      x.craftedWeapons.push({
        id: id2, recipeId: recipe.id, name: `${recipe.name} (Surge Bonus)`,
        rarity: recipe.rarity, mods: bonusMods,
      });
    }
  });

  const idx = (getUser(message.author.id).weapons.length - (surgeBonus ? 2 : 1));
  const tail = surgeBonus ? `\n🛠️ **Crafting Surge** active — bonus copy granted!` : "";
  await message.reply(
    `${emoji("craft")} **Crafted ${recipe.emoji} ${recipe.name}** *(${recipe.rarity})*\n` +
    `Mods: ATK+${finalMods.atk} DEF+${finalMods.def} MAG+${finalMods.mag}\n` +
    `_Equip via \`lowo equip <pet> weapon ${idx}\`._${tail}`,
  );
}

function canCraft(u: ReturnType<typeof getUser>, recipeId: string): boolean {
  const r = CRAFT_RECIPE_BY_ID[recipeId];
  if (!r) return false;
  if (u.cowoncy < r.cowoncyCost) return false;
  for (const [mid, need] of Object.entries(r.cost)) {
    if ((u.minerals[mid] ?? 0) < need) return false;
  }
  return true;
}
