import type { Message } from "discord.js";
import {
  SHOP_ITEMS, SHOP_BY_ID, BOX_DEFS, BACKGROUND_BY_ID, BACKGROUNDS,
  ARMOR_BY_ID, ACCESSORY_BY_ID, ACTIVE_SKILLS, EVENTS, EVENT_BY_ID,
  SHOP_CATEGORIES, type ShopCategory, rollWeapon, GAMEPASS_BY_ID, ESSENCE_ITEM_BY_ID,
  ANIMALS, ANIMAL_BY_ID, FUSION_PETS,
} from "./data.js";
import { getUser, updateUser, updateEvent, getEvent } from "./storage.js";
import { eventBonus } from "./events.js";
import { emoji } from "./emojis.js";

const LUCK_POTION_MS = 30 * 60 * 1000;
const MEGA_LUCK_POTION_MS = 30 * 60 * 1000;
const SCROLL_EVENT_MS = 30 * 60 * 1000;

export async function cmdShop(message: Message, args: string[]): Promise<void> {
  const cat = (args[0]?.toLowerCase() ?? "") as ShopCategory | "";
  if (!cat) {
    const lines = [`${emoji("shop")} **Lowo Shop** — *categories:*`];
    for (const c of SHOP_CATEGORIES) {
      const count = SHOP_ITEMS.filter((i) => i.category === c).length;
      lines.push(`${emoji("bullet")} \`lowo shop ${c}\` — *${count} item${count === 1 ? "" : "s"}*`);
    }
    lines.push(`\nBuy with \`lowo buy <itemId>\` *(premium items spend ${emoji("cash")} Lowo Cash)*.`);
    await message.reply(lines.join("\n"));
    return;
  }
  if (!(SHOP_CATEGORIES as string[]).includes(cat)) {
    await message.reply(`${emoji("fail")} Unknown category \`${cat}\`. Try: ${SHOP_CATEGORIES.map((c) => `\`${c}\``).join(", ")}`);
    return;
  }
  const items = SHOP_ITEMS.filter((i) => i.category === cat);
  if (items.length === 0) { await message.reply(`${emoji("empty")} No items in **${cat}** yet.`); return; }
  const sale = eventBonus("shop_sale"); // 0.8 if active else 1
  const lines = [`${emoji("shop")} **Lowo Shop — ${cat.toUpperCase()}**${sale < 1 ? ` *(${emoji("sale")} SHOP SALE −20% active!)*` : ""}`];
  for (const it of items) {
    const cowoncyEffective = sale < 1 && it.price > 0 ? Math.floor(it.price * sale) : it.price;
    const cost = it.lowoCashPrice
      ? `**${it.lowoCashPrice}** ${emoji("cash")} Lowo Cash`
      : (sale < 1 ? `~~${it.price.toLocaleString()}~~ **${cowoncyEffective.toLocaleString()}** cowoncy` : `**${it.price.toLocaleString()}** cowoncy`);
    lines.push(`${it.emoji} \`${it.id}\` — **${it.name}** ${emoji("bullet")} ${cost}\n  *${it.description}*`);
  }
  lines.push(`\nBuy with \`lowo buy <itemId>\`.`);
  // HOTFIX: chunk into multiple replies so all items show (was truncating at 20/27).
  const chunks: string[] = [];
  let buf = "";
  for (const line of lines) {
    if (buf.length + line.length + 1 > 1900) { chunks.push(buf); buf = ""; }
    buf += (buf ? "\n" : "") + line;
  }
  if (buf) chunks.push(buf);
  await message.reply(chunks[0]);
  const ch = message.channel;
  if ("send" in ch) {
    for (let i = 1; i < chunks.length; i++) await ch.send(chunks[i]).catch(() => {});
  }
}

function priceForUser(item: typeof SHOP_ITEMS[number]): number {
  const sale = eventBonus("shop_sale");
  if (sale < 1 && item.price > 0) return Math.floor(item.price * sale);
  return item.price;
}

export async function cmdBuy(message: Message, args: string[]): Promise<void> {
  const id = args[0]?.toLowerCase();
  const wantsCash = (args[1] ?? "").toLowerCase() === "cash";
  const item = id ? SHOP_BY_ID[id] : null;
  if (!item) { await message.reply("Usage: `lowo buy <itemId> [cash]` — see `lowo shop` for categories. Add `cash` to spend Lowo Cash on dual-currency items (e.g. gamepasses)."); return; }
  const u = getUser(message.author.id);
  const cost = priceForUser(item);

  // Essence shop items (id starts with `ess_`) — pay with essence (✨)
  if (item.category === "essence") {
    if (u.essence < item.price) {
      await message.reply(`${emoji("fail")} Need **${item.price.toLocaleString()}** ✨ essence *(you have ${u.essence.toLocaleString()})*. Sacrifice animals via \`lowo sacrifice\`.`);
      return;
    }
    await applyPurchase(message, item, false, item.price);
    return;
  }

  // Dual-currency items (gamepasses, premium backgrounds): cowoncy by default,
  // user can append `cash` to pay with Lowo Cash instead.
  const hasDual = item.price > 0 && (item.lowoCashPrice ?? 0) > 0;
  if (hasDual && wantsCash) {
    if (u.lowoCash < (item.lowoCashPrice ?? 0)) {
      await message.reply(`${emoji("fail")} Need **${item.lowoCashPrice}** ${emoji("lowoCash")} Lowo Cash *(you have ${u.lowoCash})*.`);
      return;
    }
    await applyPurchase(message, item, true, cost);
    return;
  }

  // Pure-premium item path (Lowo Cash only — price = 0)
  if (item.price === 0 && (item.lowoCashPrice ?? 0) > 0) {
    if (u.lowoCash < (item.lowoCashPrice ?? 0)) {
      await message.reply(`${emoji("fail")} Need **${item.lowoCashPrice}** ${emoji("lowoCash")} Lowo Cash *(you have ${u.lowoCash})*. Earn 1 every 50 hunts.`);
      return;
    }
    await applyPurchase(message, item, true, cost);
    return;
  }
  if (u.cowoncy < cost) {
    await message.reply(`${emoji("fail")} Need **${cost.toLocaleString()}** ${emoji("cowoncy")} cowoncy.${hasDual ? ` *(or try \`lowo buy ${item.id} cash\` to pay ${item.lowoCashPrice} Lowo Cash)*` : ""}`);
    return;
  }
  await applyPurchase(message, item, false, cost);
}

async function applyPurchase(message: Message, item: typeof SHOP_ITEMS[number], premium: boolean, cost: number): Promise<void> {
  // Special-case premium event trigger BEFORE deducting (so we can fail cleanly)
  if (item.id === "global_event") {
    const ev = EVENTS[Math.floor(Math.random() * EVENTS.length)];
    updateUser(message.author.id, (x) => { x.lowoCash -= item.lowoCashPrice ?? 0; });
    updateEvent((e) => { e.id = ev.id; e.until = Date.now() + ev.durationMs; });
    await message.reply(`${emoji("globe")} **Global Event Triggered:** ${ev.emoji} **${ev.name}** — ${ev.description} *(${Math.round(ev.durationMs / 60000)}m)*. *(−${item.lowoCashPrice} ${emoji("lowoCash")})*`);
    return;
  }
  if (item.id === "event_scroll") {
    const ev = EVENT_BY_ID["cowoncy_event"];
    updateUser(message.author.id, (x) => { x.cowoncy -= cost; });
    updateEvent((e) => { e.id = ev.id; e.until = Date.now() + SCROLL_EVENT_MS; });
    await message.reply(`📜 **Event Scroll consumed!** ${ev.emoji} **${ev.name}** is now active server-wide for **30m** (×2 cowoncy gains).`);
    return;
  }
  // Generic event-scroll mapping (THE NEW ERA expanded events)
  // Maps each event_* shop item to an EVENT id + duration. Falls back gracefully
  // to a default-30m random event if the event id isn't registered.
  const SCROLL_MAP: Record<string, { eventId: string; durationMin: number }> = {
    event_doublehunt: { eventId: "double_hunt",   durationMin: 60 },
    event_rarerush:   { eventId: "rare_rush",     durationMin: 60 },
    event_essence:    { eventId: "essence_storm", durationMin: 90 },
    event_battle:     { eventId: "battle_frenzy", durationMin: 60 },
    event_mineral:    { eventId: "mineral_rush",  durationMin: 60 },
    event_lucky:      { eventId: "lucky_skies",   durationMin: 45 },
    event_blood:      { eventId: "blood_moon",    durationMin: 60 },
    event_skillstorm: { eventId: "skill_storm",   durationMin: 60 },
    event_shopsale:   { eventId: "shop_sale",     durationMin: 60 },
    event_xpbonanza:  { eventId: "xp_bonanza",    durationMin: 60 },
    event_void:       { eventId: "void_breach",   durationMin: 30 },
    event_secret:     { eventId: "secret_whisper",durationMin: 15 },
  };
  if (SCROLL_MAP[item.id]) {
    const map = SCROLL_MAP[item.id];
    const ev = EVENT_BY_ID[map.eventId] ?? EVENTS[Math.floor(Math.random() * EVENTS.length)];
    updateUser(message.author.id, (x) => { x.cowoncy -= cost; });
    updateEvent((e) => { e.id = ev.id; e.until = Date.now() + map.durationMin * 60_000; });
    await message.reply(`${item.emoji} **${item.name} consumed!** ${ev.emoji} **${ev.name}** is now active server-wide for **${map.durationMin}m**.`);
    return;
  }
  // ── GAMEPASSES ── permanent perk unlock (cowoncy or Lowo Cash)
  if (item.id in GAMEPASS_BY_ID) {
    const gp = GAMEPASS_BY_ID[item.id];
    const u = getUser(message.author.id);
    if (u.gamepasses[gp.id]) { await message.reply(`${emoji("ok")} You already own **${gp.name}**.`); return; }
    updateUser(message.author.id, (x) => {
      if (premium) x.lowoCash -= gp.lowoCashPrice ?? 0;
      else x.cowoncy -= cost;
      x.gamepasses[gp.id] = true;
      x.ownedGamepassesPurchased += 1;
    });
    const paid = premium ? `${gp.lowoCashPrice} ${emoji("lowoCash")} Lowo Cash` : `${cost.toLocaleString()} ${emoji("cowoncy")} cowoncy`;
    await message.reply(`${gp.emoji} **GAMEPASS UNLOCKED — ${gp.name}!**\n${gp.description}\n*Paid ${paid}.*`);
    return;
  }
  // ── ESSENCE ITEMS ── pay essence, apply OP perk
  if (item.id in ESSENCE_ITEM_BY_ID) {
    const e = ESSENCE_ITEM_BY_ID[item.id];
    const u = getUser(message.author.id);
    let resultMsg = `${e.emoji} Spent **${e.essenceCost.toLocaleString()}** ✨ — **${e.name}**.`;
    updateUser(message.author.id, (x) => { x.essence -= e.essenceCost; });
    if (item.id === "ess_legendary_crate") {
      let w = rollWeapon();
      for (let i = 0; i < 30 && w.rarity !== "mythic" && w.rarity !== "epic"; i++) w = rollWeapon();
      // Force at least epic; treat as legendary tier mod boost
      const legendary = { ...w, rarity: "mythic" as const, mods: { atk: w.mods.atk + 8, def: w.mods.def + 8, mag: w.mods.mag + 8 } };
      updateUser(message.author.id, (x) => { x.weapons.push({ id: legendary.id, rarity: legendary.rarity, mods: legendary.mods }); });
      resultMsg += `\n${legendary.emoji} **${legendary.name}** *(legendary-tier)* — ATK +${legendary.mods.atk}, DEF +${legendary.mods.def}, MAG +${legendary.mods.mag}.`;
    } else if (item.id === "ess_full_pity") {
      // Set pity counter to PITY_THRESHOLD-1 (199 by default) so the next hunt
      // crosses the cap and triggers the guaranteed-legendary path.
      updateUser(message.author.id, (x) => { x.pity = Math.max(x.pity ?? 0, 199); });
      resultMsg += `\n🎁 Pity bar maxed — your **next hunt is a guaranteed legendary!**`;
    } else if (item.id === "ess_random_legend") {
      const legendaries = ANIMALS.filter((a) => a.rarity === "legendary" && a.huntable !== false);
      const pick = legendaries[Math.floor(Math.random() * legendaries.length)];
      if (pick) {
        updateUser(message.author.id, (x) => { x.zoo[pick.id] = (x.zoo[pick.id] ?? 0) + 1; });
        resultMsg += `\n${pick.emoji} **${pick.name}** *(legendary)* added to your zoo!`;
      }
    } else if (item.id === "ess_secret_chance") {
      updateEvent((ev) => { ev.id = "secret_whisper"; ev.until = Date.now() + 30 * 60_000; });
      resultMsg += `\n🤫 **Secret Whisper** active for **30m** (secret-pet chance ×100).`;
    } else if (item.id === "ess_megaluck_2h") {
      updateUser(message.author.id, (x) => { x.megaLuckUntil = Math.max(x.megaLuckUntil, Date.now()) + 2 * 60 * 60 * 1000; });
      resultMsg += `\n🍀🍀 +25% luck for **2 hours**.`;
    } else if (item.id === "ess_battletokens") {
      updateUser(message.author.id, (x) => { x.battleTokens += 500; });
      resultMsg += `\n🪙 **+500 Battle Tokens** added.`;
    } else if (item.id === "ess_lowocash") {
      updateUser(message.author.id, (x) => { x.lowoCash += 5; });
      resultMsg += `\n${emoji("lowoCash")} **+5 Lowo Cash** added.`;
    } else if (item.id === "ess_pet_materials") {
      updateUser(message.author.id, (x) => { x.petMaterials += 200; });
      resultMsg += `\n🧬 **+200 Pet Materials** added (use \`lowo fuse\`).`;
    } else if (item.id === "ess_random_fusion") {
      const epicFusions = FUSION_PETS.filter((p) => p.rarity === "epic" || p.rarity === "mythic");
      const pick = epicFusions[Math.floor(Math.random() * epicFusions.length)];
      if (pick) {
        updateUser(message.author.id, (x) => { x.zoo[pick.id] = (x.zoo[pick.id] ?? 0) + 1; });
        resultMsg += `\n${pick.emoji} **${pick.name}** *(${pick.rarity} fusion)* added to your zoo!`;
      }
    } else if (item.id === "ess_skill_legend") {
      const legendarySkills = Object.values(ACTIVE_SKILLS).filter((s) => s.rarity === "legendary");
      const pick = legendarySkills[Math.floor(Math.random() * legendarySkills.length)];
      if (pick) {
        updateUser(message.author.id, (x) => { x.ownedSkills[pick.id] = (x.ownedSkills[pick.id] ?? 0) + 1; });
        resultMsg += `\n${pick.emoji} Learned legendary skill **${pick.name}** — ${pick.description}`;
      }
    } else if (item.id === "ess_godsave") {
      updateUser(message.author.id, (x) => { x.gamepasses["godsave"] = true; });
      resultMsg += `\n🛡️✨ **Godsave Insurance** permanently active.`;
    }
    await message.reply(resultMsg);
    return;
  }
  if (item.id === "luck_potion") {
    updateUser(message.author.id, (x) => {
      x.cowoncy -= cost;
      x.luckUntil = Math.max(x.luckUntil, Date.now()) + LUCK_POTION_MS;
    });
    await message.reply(`🧪 Drank a **Luck Potion** — +10% luck on hunts/fishing for the next **30m**.`);
    return;
  }
  if (item.id === "mega_luck") {
    updateUser(message.author.id, (x) => {
      x.cowoncy -= cost;
      x.megaLuckUntil = Math.max(x.megaLuckUntil, Date.now()) + MEGA_LUCK_POTION_MS;
    });
    await message.reply(`🍀 Drank a **Mega Luck Potion** — +25% luck on hunts/fishing for the next **30m**.`);
    return;
  }
  if (item.id === "haste_potion") {
    updateUser(message.author.id, (x) => {
      x.cowoncy -= cost;
      x.hasteUntil = Math.max(x.hasteUntil ?? 0, Date.now()) + 20 * 60 * 1000;
    });
    await message.reply(`💨 Drank a **Haste Potion** — hunt cooldown −30% for **20m**.`);
    return;
  }
  if (item.id === "shield_potion") {
    updateUser(message.author.id, (x) => {
      x.cowoncy -= cost;
      x.shieldUntil = Math.max(x.shieldUntil ?? 0, Date.now()) + 20 * 60 * 1000;
    });
    await message.reply(`${emoji("shield")} Drank a **Shield Potion** — pet DEF +20% for **20m** in battle.`);
    return;
  }
  if (item.id === "mythic_crate") {
    let w = rollWeapon();
    for (let i = 0; i < 20 && w.rarity !== "mythic"; i++) w = rollWeapon();
    if (w.rarity !== "mythic") w = { ...w, rarity: "mythic" };
    updateUser(message.author.id, (x) => {
      x.lowoCash -= item.lowoCashPrice ?? 0;
      x.weapons.push({ id: w.id, rarity: w.rarity, mods: w.mods });
    });
    await message.reply(`${emoji("lowoCash")}${emoji("crate")} **Mythic Crate opened!** ${w.emoji} **${w.name}** *(mythic)* — ATK +${w.mods.atk}, DEF +${w.mods.def}, MAG +${w.mods.mag}`);
    return;
  }
  if (item.id === "perm_border") {
    updateUser(message.author.id, (x) => {
      x.lowoCash -= item.lowoCashPrice ?? 0;
      x.boxes["perm_border"] = 1;
    });
    await message.reply(`${emoji("border")} **Permanent Border** equipped — your profile card now flexes premium status.`);
    return;
  }
  if (item.id === "rod") {
    updateUser(message.author.id, (x) => { x.cowoncy -= cost; x.fishingRod = 1; });
    await message.reply(`🎣 Bought a **Fishing Rod** — try \`lowo fish\` (15s cooldown).`);
    return;
  }
  // Pickaxes (basic + tiered)
  if (item.id === "pickaxe" || item.id === "pickaxe_iron" || item.id === "pickaxe_gold" || item.id === "pickaxe_diamond") {
    const tier = item.id === "pickaxe" ? 0 : item.id === "pickaxe_iron" ? 1 : item.id === "pickaxe_gold" ? 2 : 3;
    updateUser(message.author.id, (x) => {
      if (premium) x.lowoCash -= item.lowoCashPrice ?? 0;
      else x.cowoncy -= cost;
      x.hasPickaxe = true;
      if (tier > x.pickaxeTier) x.pickaxeTier = tier;
    });
    await message.reply(`⛏️ Bought **${item.name}** (tier ${tier}) — try \`lowo mine\`.`);
    return;
  }
  // Skill purchases (`skill_<id>` + premium `skill_legendary` → arcues_judgment)
  if (item.id.startsWith("skill_")) {
    const skillId = item.id === "skill_legendary" ? "arcues_judgment" : item.id.slice("skill_".length);
    if (!ACTIVE_SKILLS[skillId]) { await message.reply(`${emoji("fail")} Unknown skill \`${skillId}\`.`); return; }
    updateUser(message.author.id, (x) => {
      if (premium) x.lowoCash -= item.lowoCashPrice ?? 0;
      else x.cowoncy -= cost;
      x.ownedSkills[skillId] = (x.ownedSkills[skillId] ?? 0) + 1;
    });
    await message.reply(`${ACTIVE_SKILLS[skillId].emoji} Learned **${ACTIVE_SKILLS[skillId].name}** — equip via \`lowo equipskill <pet> <slot> ${skillId}\`.`);
    return;
  }
  // Pet accessories (3rd equip slot)
  if (item.id in ACCESSORY_BY_ID) {
    const def = ACCESSORY_BY_ID[item.id];
    updateUser(message.author.id, (x) => {
      if (premium) x.lowoCash -= item.lowoCashPrice ?? 0;
      else x.cowoncy -= cost;
      x.accessories.push({
        id: `${def.id}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`,
        defId: def.id,
        mods: { ...def.mods },
      });
    });
    await message.reply(`${def.emoji} Bought **${def.name}** — equip via \`lowo equip <pet> accessory <idx>\` (see \`lowo inv\`).`);
    return;
  }
  // Pet armor / charms
  if (item.id in ARMOR_BY_ID) {
    const def = ARMOR_BY_ID[item.id];
    updateUser(message.author.id, (x) => {
      if (premium) x.lowoCash -= item.lowoCashPrice ?? 0;
      else x.cowoncy -= cost;
      x.armor.push({ id: `${def.id}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`, defId: def.id, mods: { ...def.mods } });
    });
    await message.reply(`${def.emoji} Bought **${def.name}** — see your armor with \`lowo inv\`. Equip via \`lowo equip <animal> armor <idx>\`.`);
    return;
  }
  // ── HOTFIX: Team slot expansions (4th/5th/6th slot) ───────────────────────
  // Was falling into the generic block which only added `boxes`. Now correctly
  // increments `extraTeamSlots` (capped 0..3 → max team size of 6).
  if (item.id === "team_slot_1" || item.id === "team_slot_2" || item.id === "team_slot_3") {
    const u2 = getUser(message.author.id);
    if (u2.extraTeamSlots >= 3) {
      await message.reply(`${emoji("ok")} You already own all 3 extra team slots — your team cap is **6**.`);
      return;
    }
    updateUser(message.author.id, (x) => {
      if (premium) x.lowoCash -= item.lowoCashPrice ?? 0;
      else x.cowoncy -= cost;
      x.extraTeamSlots = Math.min(3, (x.extraTeamSlots ?? 0) + 1);
    });
    const newCap = 3 + Math.min(3, (u2.extraTeamSlots ?? 0) + 1);
    await message.reply(`${emoji("success")} **${item.name}** purchased — your team cap is now **${newCap}/6**.`);
    return;
  }
  // ── HOTFIX: OP chests/seals — add to opChests inventory so `op_open` works.
  if (item.id === "op_pet_chest" || item.id === "op_god_chest" || item.id === "op_void_chest" || item.id === "op_attribute_seal") {
    updateUser(message.author.id, (x) => {
      if (premium) x.lowoCash -= item.lowoCashPrice ?? 0;
      else x.cowoncy -= cost;
      x.opChests[item.id] = (x.opChests[item.id] ?? 0) + 1;
    });
    const opener = item.id === "op_attribute_seal" ? "lowo reroll <petId>" : `lowo op_open ${item.id}`;
    await message.reply(`${item.emoji} **${item.name}** purchased! Open with \`${opener}\`.`);
    return;
  }
  // ── HOTFIX: OP Dino Summon Stone — single-use 1h luck buff for Dino Leo.
  if (item.id === "op_dino_summon") {
    updateUser(message.author.id, (x) => {
      if (premium) x.lowoCash -= item.lowoCashPrice ?? 0;
      else x.cowoncy -= cost;
      const base = Math.max(Date.now(), x.dinoSummonUntil ?? 0);
      x.dinoSummonUntil = base + 60 * 60 * 1000;
    });
    await message.reply(`🦖✨ **OP Dino Summon Stone** activated — Dino Leo drop chance dramatically boosted for **1 hour**!`);
    return;
  }
  // ── HOTFIX: OP Essence Brick — converts cowoncy → 50,000 essence.
  if (item.id === "op_essence_brick") {
    updateUser(message.author.id, (x) => {
      if (premium) x.lowoCash -= item.lowoCashPrice ?? 0;
      else x.cowoncy -= cost;
      x.essence += 50_000;
    });
    await message.reply(`✨🧱 **OP Essence Brick** consumed — **+50,000** ✨ essence.`);
    return;
  }
  // ── HOTFIX: Enchant tomes — add to enchantTomes inventory for `lowo enchant`.
  if (item.id.startsWith("enchant_")) {
    updateUser(message.author.id, (x) => {
      if (premium) x.lowoCash -= item.lowoCashPrice ?? 0;
      else x.cowoncy -= cost;
      x.enchantTomes[item.id] = (x.enchantTomes[item.id] ?? 0) + 1;
    });
    const enchantId = item.id.slice("enchant_".length);
    await message.reply(`${item.emoji} **${item.name}** purchased! Apply with \`lowo enchant <petId> ${enchantId}\` *(also costs essence)*.`);
    return;
  }

  // Generic items (rings, crates, food, etc.)
  updateUser(message.author.id, (x) => {
    if (premium) x.lowoCash -= item.lowoCashPrice ?? 0;
    else x.cowoncy -= cost;
    if (item.id === "ring")    x.rings += 1;
    if (item.id === "carrot")  x.carrots += 1;
    if (item.id === "petfood") x.petfood += 1;
    if (item.id === "lottery") x.lotteryTickets += 1;
    if (item.id === "crate")   x.boxes["crate"] = (x.boxes["crate"] ?? 0) + 1;
    if (item.id in BOX_DEFS)   x.boxes[item.id] = (x.boxes[item.id] ?? 0) + 1;
    if (item.id in BACKGROUND_BY_ID) {
      x.boxes[`bg:${item.id}`] = 1;
    }
  });
  const costStr = premium ? `${item.lowoCashPrice} ${emoji("lowoCash")} Lowo Cash` : `${cost.toLocaleString()} ${emoji("cowoncy")} cowoncy`;
  await message.reply(`${emoji("shop")} Bought ${item.emoji} **${item.name}** for ${costStr}.`);
}

// Apply an owned background to your profile
export async function cmdSetBg(message: Message, args: string[]): Promise<void> {
  const id = args[0]?.toLowerCase();
  if (!id || !BACKGROUND_BY_ID[id]) {
    const owned = BACKGROUNDS.filter((b) => b.price === 0).map((b) => b.id);
    const u = getUser(message.author.id);
    for (const b of BACKGROUNDS) if (u.boxes[`bg:${b.id}`]) owned.push(b.id);
    await message.reply([
      `${emoji("frame")} **Backgrounds**`,
      ...BACKGROUNDS.map((b) => `${owned.includes(b.id) ? emoji("ok") : emoji("locked")} \`${b.id}\` — **${b.name}** ${b.price > 0 ? `(${b.price.toLocaleString()} ${emoji("cowoncy")} cowoncy)` : "*(default)*"}`),
      "",
      `${emoji("info")} Apply with: \`lowo setbg <id>\`. Buy locked ones via \`lowo buy <id>\`.`,
    ].join("\n"));
    return;
  }
  const bg = BACKGROUND_BY_ID[id];
  const u = getUser(message.author.id);
  const owned = bg.price === 0 || u.boxes[`bg:${id}`];
  if (!owned) { await message.reply(`❌ You don't own **${bg.name}**. Buy via \`lowo buy ${id}\`.`); return; }
  updateUser(message.author.id, (x) => { x.background = id; });
  await message.reply(`🖼️ Background set to **${bg.name}**. Try \`lowo card\` to flex.`);
}

// Surface for router check (active scroll event)
export function _activeScroll() { return getEvent(); }
