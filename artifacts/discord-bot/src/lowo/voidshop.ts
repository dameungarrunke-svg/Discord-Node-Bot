// ─── VOID SHOP (v6.2) ────────────────────────────────────────────────────────
// A shard-only kiosk that turns 💎 Void Shards into useful one-shot items.
// Items live in `u.voidShopItems` (string -> count); their effects are wired
// into the relevant command modules (hunt.ts for `lure`, corrupt.ts for
// `insurance`). Pure currency conversions (essence / cowoncy) credit the
// account immediately and never leave inventory.
//
// All designs deliberately stop short of relics: relics are *permanent* global
// passives, shop items are *consumed* one-time boosts.

import type { Message } from "discord.js";
import { getUser, updateUser } from "./storage.js";
import { baseEmbed, replyEmbed, errorEmbed, warnEmbed, COLOR } from "./embeds.js";

export type VoidShopItemId =
  | "lure"        // next Infinite-Void hunt drops 2 extra animals
  | "insurance"   // saves the next failed corruption from deletion
  | "essence"     // instant convert: 40 💎 → 1,000 ✨
  | "cowoncy";    // instant convert: 25 💎 → 5,000 💰

interface VoidShopItem {
  id: VoidShopItemId;
  name: string;
  emoji: string;
  cost: number;          // in 💎 Void Shards
  desc: string;
  /** True for items that are credited immediately and not stored as inventory. */
  instant?: boolean;
  /** Per-buy reward applied when `instant` is true. */
  reward?: { essence?: number; cowoncy?: number };
}

export const VOID_SHOP_ITEMS: VoidShopItem[] = [
  {
    id: "lure", name: "Void Lure", emoji: "🎣",
    cost: 80,
    desc: "Your next hunt in **The Infinite Void** rolls **+2 extra** animals. Consumed automatically when you next `lowo hunt` while in Area 6.",
  },
  {
    id: "insurance", name: "Void Insurance", emoji: "🛡️",
    cost: 200,
    desc: "If your next `lowo corrupt` rolls a deletion failure, this token is consumed instead and the pet stack is saved. Stacks freely — only one is consumed per save.",
  },
  {
    id: "essence", name: "Essence Crystal", emoji: "✨",
    cost: 40,
    desc: "Instantly converts **40 💎 → 1,000 ✨ essence**. Buy `n` to multiply.",
    instant: true,
    reward: { essence: 1000 },
  },
  {
    id: "cowoncy", name: "Cowoncy Coin", emoji: "💰",
    cost: 25,
    desc: "Instantly converts **25 💎 → 5,000 💰 cowoncy**. Buy `n` to multiply.",
    instant: true,
    reward: { cowoncy: 5000 },
  },
];
export const VOID_SHOP_BY_ID: Record<string, VoidShopItem> =
  Object.fromEntries(VOID_SHOP_ITEMS.map((i) => [i.id, i]));

// ─── Helpers used by hunt.ts / corrupt.ts ────────────────────────────────────
/** Returns true if a Void-Lure was consumed (and `drops` should grow by 2). */
export function consumeVoidLureIfPresent(userId: string): boolean {
  let used = false;
  updateUser(userId, (x) => {
    const inv = x.voidShopItems ?? {};
    if ((inv.lure ?? 0) > 0) {
      inv.lure -= 1;
      x.voidShopItems = inv;
      used = true;
    }
  });
  return used;
}

/** Returns true if Void-Insurance was consumed (and the corruption fail should be cancelled). */
export function consumeVoidInsuranceIfPresent(userId: string): boolean {
  let used = false;
  updateUser(userId, (x) => {
    const inv = x.voidShopItems ?? {};
    if ((inv.insurance ?? 0) > 0) {
      inv.insurance -= 1;
      x.voidShopItems = inv;
      used = true;
    }
  });
  return used;
}

// ─── Command: lowo voidshop ──────────────────────────────────────────────────
export async function cmdVoidShop(message: Message, args: string[]): Promise<void> {
  const sub = (args[0] ?? "").toLowerCase();
  const u = getUser(message.author.id);
  const inv = u.voidShopItems ?? {};
  const shards = u.voidShards ?? 0;

  if (!sub || sub === "list" || sub === "help") {
    const lines: string[] = [
      `🜏 **The Void Shop** — *spend 💎 Void Shards on one-shot relics of the deep void.*`,
      `*Wallet:* 💎 \`${shards.toLocaleString()}\` Shards`,
      ``,
    ];
    for (const it of VOID_SHOP_ITEMS) {
      const owned = it.instant ? "" : ` *(owned: ${inv[it.id] ?? 0})*`;
      lines.push(`${it.emoji} **${it.name}** — \`${it.cost} 💎\`${owned}`);
      lines.push(`  ${it.desc}`);
    }
    lines.push(``);
    lines.push(`Buy with \`lowo voidshop buy <id> [qty]\`.`);
    lines.push(`Items: ${VOID_SHOP_ITEMS.map((i) => `\`${i.id}\``).join(" • ")}`);

    const e = baseEmbed(message, COLOR.void ?? 0x1a0033)
      .setTitle("🜏 The Void Shop")
      .setDescription(lines.join("\n"));
    await replyEmbed(message, e);
    return;
  }

  if (sub === "buy") {
    const itemId = (args[1] ?? "").toLowerCase();
    const qty = Math.max(1, Math.floor(Number(args[2] ?? "1")) || 1);
    const item = VOID_SHOP_BY_ID[itemId];
    if (!item) {
      await replyEmbed(message, warnEmbed(message, "Unknown Item",
        `No void-shop item with id \`${itemId}\`. Try \`lowo voidshop list\`.`));
      return;
    }
    const total = item.cost * qty;
    if (shards < total) {
      await replyEmbed(message, errorEmbed(message, "Not Enough Shards",
        `Need 💎 \`${total.toLocaleString()}\` Shards *(you have \`${shards.toLocaleString()}\`)*. Smelt pets with \`lowo forge smelt <pet>\`.`));
      return;
    }

    let reward = "";
    updateUser(message.author.id, (x) => {
      x.voidShards = (x.voidShards ?? 0) - total;
      if (item.instant && item.reward) {
        if (item.reward.essence) {
          const gain = item.reward.essence * qty;
          x.essence += gain;
          reward = `+✨ \`${gain.toLocaleString()}\` essence`;
        }
        if (item.reward.cowoncy) {
          const gain = item.reward.cowoncy * qty;
          x.cowoncy += gain;
          reward = `+💰 \`${gain.toLocaleString()}\` cowoncy`;
        }
      } else {
        x.voidShopItems = x.voidShopItems ?? {};
        x.voidShopItems[item.id] = (x.voidShopItems[item.id] ?? 0) + qty;
        reward = `+\`${qty}\` × ${item.emoji} **${item.name}** *(now \`${x.voidShopItems[item.id]}\` owned)*`;
      }
    });

    const e = baseEmbed(message, COLOR.void ?? 0x1a0033)
      .setTitle(`${item.emoji} Purchased — ${item.name}`)
      .setDescription([
        `**Spent:** 💎 \`${total.toLocaleString()}\` Shards`,
        `**Gained:** ${reward}`,
      ].join("\n"));
    await replyEmbed(message, e);
    return;
  }

  await replyEmbed(message, warnEmbed(message, "Void Shop",
    "Try `lowo voidshop` to view items or `lowo voidshop buy <id> [qty]` to purchase."));
}
