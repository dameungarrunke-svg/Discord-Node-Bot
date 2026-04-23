import type { Message } from "discord.js";
import { SHOP_ITEMS, SHOP_BY_ID } from "./data.js";
import { getUser, updateUser } from "./storage.js";

export async function cmdShop(message: Message): Promise<void> {
  const lines = ["🛒 **Lowo Shop**"];
  for (const it of SHOP_ITEMS) {
    lines.push(`${it.emoji} \`${it.id}\` — **${it.name}** • ${it.price} cowoncy\n  *${it.description}*`);
  }
  lines.push("\nUse `lowo buy <itemId>` to purchase.");
  await message.reply(lines.join("\n"));
}

export async function cmdBuy(message: Message, args: string[]): Promise<void> {
  const id = args[0]?.toLowerCase();
  const item = id ? SHOP_BY_ID[id] : null;
  if (!item) { await message.reply("Usage: `lowo buy <itemId>` — see `lowo shop`"); return; }
  const u = getUser(message.author.id);
  if (u.cowoncy < item.price) { await message.reply(`❌ Need ${item.price} cowoncy.`); return; }
  updateUser(message.author.id, (x) => { x.cowoncy -= item.price; });
  // Item-specific effects
  if (item.id === "petfood") updateUser(message.author.id, (x) => { x.cowoncy += 0; }); // consumable hint
  await message.reply(`🛍️ Bought ${item.emoji} **${item.name}** for ${item.price} cowoncy.`);
}
