import type { Message } from "discord.js";
import {
  SHOP_ITEMS, SHOP_BY_ID, BOX_DEFS, BACKGROUND_BY_ID, BACKGROUNDS,
  ARMOR_BY_ID, EVENTS, EVENT_BY_ID, SHOP_CATEGORIES, type ShopCategory,
  rollWeapon,
} from "./data.js";
import { getUser, updateUser, updateEvent, getEvent } from "./storage.js";

const LUCK_POTION_MS = 30 * 60 * 1000;
const SCROLL_EVENT_MS = 30 * 60 * 1000;

export async function cmdShop(message: Message, args: string[]): Promise<void> {
  const cat = (args[0]?.toLowerCase() ?? "") as ShopCategory | "";
  if (!cat) {
    const lines = ["🛒 **Lowo Shop** — *categories:*"];
    for (const c of SHOP_CATEGORIES) {
      const count = SHOP_ITEMS.filter((i) => i.category === c).length;
      lines.push(`• \`lowo shop ${c}\` — *${count} item${count === 1 ? "" : "s"}*`);
    }
    lines.push("\nBuy with `lowo buy <itemId>` (premium items spend Lowo Cash).");
    await message.reply(lines.join("\n"));
    return;
  }
  if (!(SHOP_CATEGORIES as string[]).includes(cat)) {
    await message.reply(`❌ Unknown category \`${cat}\`. Try: ${SHOP_CATEGORIES.map((c) => `\`${c}\``).join(", ")}`);
    return;
  }
  const items = SHOP_ITEMS.filter((i) => i.category === cat);
  if (items.length === 0) { await message.reply(`📭 No items in **${cat}** yet.`); return; }
  const lines = [`🛒 **Lowo Shop — ${cat.toUpperCase()}**`];
  for (const it of items) {
    const cost = it.lowoCashPrice ? `**${it.lowoCashPrice}** 💎 Lowo Cash` : `**${it.price.toLocaleString()}** cowoncy`;
    lines.push(`${it.emoji} \`${it.id}\` — **${it.name}** • ${cost}\n  *${it.description}*`);
  }
  lines.push("\nBuy with `lowo buy <itemId>`.");
  await message.reply(lines.join("\n").slice(0, 1900));
}

export async function cmdBuy(message: Message, args: string[]): Promise<void> {
  const id = args[0]?.toLowerCase();
  const item = id ? SHOP_BY_ID[id] : null;
  if (!item) { await message.reply("Usage: `lowo buy <itemId>` — see `lowo shop` for categories."); return; }
  const u = getUser(message.author.id);

  // Premium item path (Lowo Cash)
  if (item.lowoCashPrice && item.lowoCashPrice > 0) {
    if (u.lowoCash < item.lowoCashPrice) {
      await message.reply(`❌ Need **${item.lowoCashPrice}** 💎 Lowo Cash *(you have ${u.lowoCash})*. Earn 1 every 50 hunts.`);
      return;
    }
    await applyPurchase(message, item, true);
    return;
  }
  // Cowoncy path
  if (u.cowoncy < item.price) {
    await message.reply(`❌ Need **${item.price.toLocaleString()}** cowoncy.`);
    return;
  }
  await applyPurchase(message, item, false);
}

async function applyPurchase(message: Message, item: typeof SHOP_ITEMS[number], premium: boolean): Promise<void> {
  // Special-case premium event trigger BEFORE deducting (so we can fail cleanly)
  if (item.id === "global_event") {
    const ev = EVENTS[Math.floor(Math.random() * EVENTS.length)];
    updateUser(message.author.id, (x) => { x.lowoCash -= item.lowoCashPrice ?? 0; });
    updateEvent((e) => { e.id = ev.id; e.until = Date.now() + ev.durationMs; });
    await message.reply(`🌍 **Global Event Triggered:** ${ev.emoji} **${ev.name}** — ${ev.description} *(${Math.round(ev.durationMs / 60000)}m)*. *(−${item.lowoCashPrice} 💎)*`);
    return;
  }
  if (item.id === "event_scroll") {
    const ev = EVENT_BY_ID["cowoncy_event"];
    updateUser(message.author.id, (x) => { x.cowoncy -= item.price; });
    updateEvent((e) => { e.id = ev.id; e.until = Date.now() + SCROLL_EVENT_MS; });
    await message.reply(`📜 **Event Scroll consumed!** ${ev.emoji} **${ev.name}** is now active server-wide for **30m** (×2 cowoncy gains).`);
    return;
  }
  if (item.id === "luck_potion") {
    updateUser(message.author.id, (x) => {
      x.cowoncy -= item.price;
      x.luckUntil = Math.max(x.luckUntil, Date.now()) + LUCK_POTION_MS;
    });
    await message.reply(`🧪 Drank a **Luck Potion** — +10% luck on hunts/fishing for the next **30m**.`);
    return;
  }
  if (item.id === "mythic_crate") {
    // Premium crate: guaranteed mythic — reroll until rarity matches
    let w = rollWeapon();
    for (let i = 0; i < 20 && w.rarity !== "mythic"; i++) w = rollWeapon();
    if (w.rarity !== "mythic") w = { ...w, rarity: "mythic" };
    updateUser(message.author.id, (x) => {
      x.lowoCash -= item.lowoCashPrice ?? 0;
      x.weapons.push({ id: w.id, rarity: w.rarity, mods: w.mods });
    });
    await message.reply(`💎📦 **Mythic Crate opened!** ${w.emoji} **${w.name}** *(mythic)* — ATK +${w.mods.atk}, DEF +${w.mods.def}, MAG +${w.mods.mag}`);
    return;
  }
  if (item.id === "perm_border") {
    updateUser(message.author.id, (x) => {
      x.lowoCash -= item.lowoCashPrice ?? 0;
      x.boxes["perm_border"] = 1;
    });
    await message.reply(`🪙 **Permanent Border** equipped — your profile card now flexes premium status.`);
    return;
  }
  if (item.id === "rod") {
    updateUser(message.author.id, (x) => { x.cowoncy -= item.price; x.fishingRod = 1; });
    await message.reply(`🎣 Bought a **Fishing Rod** — try \`lowo fish\` (15s cooldown).`);
    return;
  }
  // Pet armor / charms (any catalog id)
  if (item.id in ARMOR_BY_ID) {
    const def = ARMOR_BY_ID[item.id];
    updateUser(message.author.id, (x) => {
      if (premium) x.lowoCash -= item.lowoCashPrice ?? 0;
      else x.cowoncy -= item.price;
      x.armor.push({ id: `${def.id}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`, defId: def.id, mods: { ...def.mods } });
    });
    await message.reply(`${def.emoji} Bought **${def.name}** — see your armor with \`lowo inv\`. Equip via \`lowo equip <animal> armor <idx>\`.`);
    return;
  }
  // Generic items (rings, crates, food, etc.)
  updateUser(message.author.id, (x) => {
    if (premium) x.lowoCash -= item.lowoCashPrice ?? 0;
    else x.cowoncy -= item.price;
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
  const cost = premium ? `${item.lowoCashPrice} 💎 Lowo Cash` : `${item.price.toLocaleString()} cowoncy`;
  await message.reply(`🛍️ Bought ${item.emoji} **${item.name}** for ${cost}.`);
}

// Apply an owned background to your profile
export async function cmdSetBg(message: Message, args: string[]): Promise<void> {
  const id = args[0]?.toLowerCase();
  if (!id || !BACKGROUND_BY_ID[id]) {
    const owned = BACKGROUNDS.filter((b) => b.price === 0).map((b) => b.id);
    const u = getUser(message.author.id);
    for (const b of BACKGROUNDS) if (u.boxes[`bg:${b.id}`]) owned.push(b.id);
    await message.reply([
      "🖼️ **Backgrounds**",
      ...BACKGROUNDS.map((b) => `${owned.includes(b.id) ? "✅" : "🔒"} \`${b.id}\` — **${b.name}** ${b.price > 0 ? `(${b.price.toLocaleString()} cowoncy)` : "*(default)*"}`),
      "",
      "Apply with: `lowo setbg <id>`. Buy locked ones via `lowo buy <id>`.",
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
