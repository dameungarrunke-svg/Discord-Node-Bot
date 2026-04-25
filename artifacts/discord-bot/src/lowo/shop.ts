import type { Message } from "discord.js";
import {
  SHOP_ITEMS, SHOP_BY_ID, BOX_DEFS, BACKGROUND_BY_ID, BACKGROUNDS,
  ARMOR_BY_ID, ACCESSORY_BY_ID, ACTIVE_SKILLS, EVENTS, EVENT_BY_ID,
  SHOP_CATEGORIES, type ShopCategory, rollWeapon,
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
  await message.reply(lines.join("\n").slice(0, 1900));
}

function priceForUser(item: typeof SHOP_ITEMS[number]): number {
  const sale = eventBonus("shop_sale");
  if (sale < 1 && item.price > 0) return Math.floor(item.price * sale);
  return item.price;
}

export async function cmdBuy(message: Message, args: string[]): Promise<void> {
  const id = args[0]?.toLowerCase();
  const item = id ? SHOP_BY_ID[id] : null;
  if (!item) { await message.reply("Usage: `lowo buy <itemId>` — see `lowo shop` for categories."); return; }
  const u = getUser(message.author.id);
  const cost = priceForUser(item);

  // Premium item path (Lowo Cash)
  if (item.lowoCashPrice && item.lowoCashPrice > 0) {
    if (u.lowoCash < item.lowoCashPrice) {
      await message.reply(`${emoji("fail")} Need **${item.lowoCashPrice}** ${emoji("lowoCash")} Lowo Cash *(you have ${u.lowoCash})*. Earn 1 every 50 hunts.`);
      return;
    }
    await applyPurchase(message, item, true, cost);
    return;
  }
  if (u.cowoncy < cost) {
    await message.reply(`${emoji("fail")} Need **${cost.toLocaleString()}** ${emoji("cowoncy")} cowoncy.`);
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
