import type { Message } from "discord.js";
import { SHOP_ITEMS, SHOP_BY_ID, BOX_DEFS, BACKGROUND_BY_ID, BACKGROUNDS } from "./data.js";
import { getUser, updateUser } from "./storage.js";

export async function cmdShop(message: Message): Promise<void> {
  const lines = ["🛒 **Lowo Shop**"];
  for (const it of SHOP_ITEMS) {
    lines.push(`${it.emoji} \`${it.id}\` — **${it.name}** • ${it.price.toLocaleString()} cowoncy\n  *${it.description}*`);
  }
  lines.push("\nUse `lowo buy <itemId>` to purchase.");
  await message.reply(lines.join("\n").slice(0, 1900));
}

export async function cmdBuy(message: Message, args: string[]): Promise<void> {
  const id = args[0]?.toLowerCase();
  const item = id ? SHOP_BY_ID[id] : null;
  if (!item) { await message.reply("Usage: `lowo buy <itemId>` — see `lowo shop`"); return; }
  const u = getUser(message.author.id);
  if (u.cowoncy < item.price) { await message.reply(`❌ Need ${item.price.toLocaleString()} cowoncy.`); return; }

  // Apply purchase + side-effects
  updateUser(message.author.id, (x) => {
    x.cowoncy -= item.price;
    if (item.id === "ring")    x.rings += 1;
    if (item.id === "carrot")  x.carrots += 1;
    if (item.id === "petfood") x.petfood += 1;
    if (item.id === "lottery") x.lotteryTickets += 1;
    if (item.id === "crate")   x.boxes["crate"] = (x.boxes["crate"] ?? 0) + 1;
    if (item.id in BOX_DEFS)   x.boxes[item.id] = (x.boxes[item.id] ?? 0) + 1;
    if (item.id in BACKGROUND_BY_ID) {
      // Mark this background as available; stash in a key on background-list (use boxes-style flag)
      x.boxes[`bg:${item.id}`] = 1;
    }
  });
  await message.reply(`🛍️ Bought ${item.emoji} **${item.name}** for ${item.price.toLocaleString()} cowoncy.`);
}

// Apply an owned background to your profile
export async function cmdSetBg(message: Message, args: string[]): Promise<void> {
  const id = args[0]?.toLowerCase();
  if (!id || !BACKGROUND_BY_ID[id]) {
    const owned = BACKGROUNDS.filter(b => b.price === 0).map(b => b.id);
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
