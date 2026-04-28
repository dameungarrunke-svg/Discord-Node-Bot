import type { Message } from "discord.js";
import { getUser, updateUser, getMarket, updateMarket } from "./storage.js";
import { ANIMAL_BY_ID, ANIMALS, RARITY_COLOR, RARITY_ORDER, type Rarity } from "./data.js";
import { emoji } from "./emojis.js";

export const LISTING_TTL_MS = 48 * 60 * 60 * 1000; // 48h
export const MARKET_TAX_PCT = 0.05; // 5% house cut on sales
export const MAX_LISTINGS_PER_USER = 10;
export const MIN_PRICE = 1;
export const MAX_PRICE = 1_000_000_000;

export interface MarketListing {
  id: number;
  sellerId: string;
  sellerTag: string;
  animalId: string;
  price: number;
  postedAt: number;
  expiresAt: number;
}

const norm = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const ANIMAL_LOOKUP: Record<string, string> = (() => {
  const m: Record<string, string> = {};
  for (const a of ANIMALS) { m[norm(a.id)] = a.id; m[norm(a.name)] = a.id; }
  return m;
})();
function resolveAnimalId(q: string): string | null {
  if (!q) return null;
  return ANIMAL_LOOKUP[norm(q)] ?? null;
}

// ─── Expiry sweep — refunds expired listings to their seller's zoo ───────────
export function sweepExpiredListings(): { expired: number } {
  const now = Date.now();
  let expired = 0;
  const market = getMarket();
  const stillActive: MarketListing[] = [];
  for (const l of market.listings) {
    if (l.expiresAt <= now) {
      // Refund animal to seller
      updateUser(l.sellerId, (x) => { x.zoo[l.animalId] = (x.zoo[l.animalId] ?? 0) + 1; });
      expired += 1;
    } else {
      stillActive.push(l);
    }
  }
  if (expired > 0) {
    updateMarket((m) => { m.listings = stillActive; });
  }
  return { expired };
}

function fmtListing(l: MarketListing): string {
  const a = ANIMAL_BY_ID[l.animalId];
  if (!a) return `\`#${l.id}\` *(unknown animal)*`;
  const hours = Math.max(0, Math.ceil((l.expiresAt - Date.now()) / (60 * 60 * 1000)));
  return `\`#${l.id}\` ${RARITY_COLOR[a.rarity]} ${a.emoji} **${a.name}** *(${a.rarity})* — **${l.price.toLocaleString()}** ${emoji("cowoncy")} • ${hours}h left • by **${l.sellerTag}**`;
}

// ─── Main router for `lowo market ...` ───────────────────────────────────────
export async function cmdMarket(message: Message, args: string[]): Promise<void> {
  sweepExpiredListings();
  const sub = (args[0] ?? "").toLowerCase();
  const rest = args.slice(1);

  switch (sub) {
    case "":
    case "list":
    case "browse":
      return showListings(message, null);
    case "search":
      return showListings(message, rest.join(" "));
    case "post":
    case "sell":
    case "list-pet":
      return postListing(message, rest);
    case "buy":
      return buyListing(message, rest);
    case "mine":
    case "my":
      return showMine(message);
    case "cancel":
    case "remove":
    case "withdraw":
      return cancelListing(message, rest);
    case "help":
      return showHelp(message);
    default:
      return showHelp(message);
  }
}

async function showHelp(message: Message): Promise<void> {
  await message.reply([
    "🛒 **Lowo Global Marketplace**",
    "• `lowo market` — browse all listings *(newest first, 20 per page)*",
    "• `lowo market search <rarity>` — filter by rarity (e.g. `epic`, `mythic`, `secret`)",
    "• `lowo market post <pet name> <price>` — list a pet for cowoncy *(48h expiry)*",
    "• `lowo market buy <listingId>` — buy a listing instantly",
    "• `lowo market mine` — view your active listings",
    "• `lowo market cancel <listingId>` — pull a listing back",
    "",
    `_Listings expire in 48h and the pet returns to your zoo. Sales take a ${Math.round(MARKET_TAX_PCT * 100)}% market tax. Cap: ${MAX_LISTINGS_PER_USER} listings per user._`,
  ].join("\n"));
}

async function showListings(message: Message, rarityFilter: string | null): Promise<void> {
  const market = getMarket();
  let pool = [...market.listings].sort((a, b) => b.postedAt - a.postedAt);
  let header = "🛒 **Lowo Global Marketplace** *(newest first)*";
  if (rarityFilter) {
    const r = rarityFilter.toLowerCase().trim() as Rarity;
    if (!RARITY_ORDER.includes(r)) {
      await message.reply(`❌ Unknown rarity \`${rarityFilter}\`. Valid: ${RARITY_ORDER.join(", ")}`);
      return;
    }
    pool = pool.filter((l) => ANIMAL_BY_ID[l.animalId]?.rarity === r);
    header = `🛒 **Marketplace — ${r.toUpperCase()}** *(${pool.length})*`;
  }
  if (!pool.length) { await message.reply(`📭 No active listings${rarityFilter ? ` for **${rarityFilter}**` : ""}. Use \`lowo market post <pet> <price>\` to list one!`); return; }
  const lines = [header];
  for (const l of pool.slice(0, 20)) lines.push(`• ${fmtListing(l)}`);
  if (pool.length > 20) lines.push(`\n_…and ${pool.length - 20} more. Filter with \`lowo market search <rarity>\`._`);
  lines.push(`\n_Buy with \`lowo market buy <id>\`._`);
  await message.reply(lines.join("\n").slice(0, 1900));
}

async function showMine(message: Message): Promise<void> {
  const market = getMarket();
  const mine = market.listings.filter((l) => l.sellerId === message.author.id);
  if (!mine.length) { await message.reply("📭 You have no active listings."); return; }
  const lines = ["📦 **Your Active Listings**"];
  for (const l of mine) lines.push(`• ${fmtListing(l)}`);
  lines.push(`\n_Cancel with \`lowo market cancel <id>\` to pull a pet back._`);
  await message.reply(lines.join("\n").slice(0, 1900));
}

async function postListing(message: Message, args: string[]): Promise<void> {
  // Last arg = price; everything before = pet name (multi-word allowed).
  if (args.length < 2) {
    await message.reply("Usage: `lowo market post <pet name> <price>` *(price is in cowoncy)*");
    return;
  }
  const priceStr = args[args.length - 1];
  if (!/^\d+$/.test(priceStr)) {
    await message.reply("❌ Price must be a whole number of cowoncy. Example: `lowo market post Glitch Fox 750000`");
    return;
  }
  const price = parseInt(priceStr, 10);
  if (price < MIN_PRICE || price > MAX_PRICE) {
    await message.reply(`❌ Price must be between **${MIN_PRICE.toLocaleString()}** and **${MAX_PRICE.toLocaleString()}** cowoncy.`);
    return;
  }
  const name = args.slice(0, -1).join(" ").trim();
  const id = resolveAnimalId(name);
  if (!id) { await message.reply(`❌ I don't know any pet named \`${name}\`.`); return; }
  const a = ANIMAL_BY_ID[id]!;
  const u = getUser(message.author.id);
  if ((u.zoo[id] ?? 0) <= 0) {
    await message.reply(`${emoji("fail")} You don't own any ${a.emoji} **${a.name}** to list.`);
    return;
  }
  const market = getMarket();
  const existingForUser = market.listings.filter((l) => l.sellerId === message.author.id).length;
  if (existingForUser >= MAX_LISTINGS_PER_USER) {
    await message.reply(`❌ You already have **${existingForUser}** active listings (cap: ${MAX_LISTINGS_PER_USER}). Cancel one first.`);
    return;
  }
  // Take the pet out of the zoo and create the listing atomically-ish.
  let listing: MarketListing | null = null;
  updateUser(message.author.id, (x) => { x.zoo[id] = (x.zoo[id] ?? 0) - 1; });
  updateMarket((m) => {
    m.nextId += 1;
    listing = {
      id: m.nextId,
      sellerId: message.author.id,
      sellerTag: message.author.username,
      animalId: id,
      price,
      postedAt: Date.now(),
      expiresAt: Date.now() + LISTING_TTL_MS,
    };
    m.listings.push(listing);
  });
  if (!listing) { await message.reply("⚠️ Failed to create listing — please try again."); return; }
  await message.reply(
    `${emoji("sell")} Listed ${a.emoji} **${a.name}** for **${price.toLocaleString()}** ${emoji("cowoncy")} cowoncy.\n` +
    `Listing ID: \`#${(listing as MarketListing).id}\` • Expires in **48h**.`,
  );
}

async function buyListing(message: Message, args: string[]): Promise<void> {
  const idStr = args[0]?.replace(/^#/, "");
  if (!idStr || !/^\d+$/.test(idStr)) {
    await message.reply("Usage: `lowo market buy <listingId>` — id is the number after `#`.");
    return;
  }
  const id = parseInt(idStr, 10);
  const market = getMarket();
  const listing = market.listings.find((l) => l.id === id);
  if (!listing) { await message.reply(`❌ Listing \`#${id}\` not found or expired.`); return; }
  if (listing.sellerId === message.author.id) { await message.reply("❌ You can't buy your own listing. Use `lowo market cancel` instead."); return; }
  const buyer = getUser(message.author.id);
  if (buyer.cowoncy < listing.price) {
    await message.reply(`${emoji("fail")} You need **${listing.price.toLocaleString()}** cowoncy. You have **${buyer.cowoncy.toLocaleString()}**.`);
    return;
  }
  const a = ANIMAL_BY_ID[listing.animalId];
  if (!a) { await message.reply("⚠️ This listing references an unknown animal — refunding seller."); }

  const tax = Math.floor(listing.price * MARKET_TAX_PCT);
  const sellerCut = listing.price - tax;

  // Apply transaction.
  updateUser(message.author.id, (x) => {
    x.cowoncy -= listing.price;
    if (a) {
      x.zoo[a.id] = (x.zoo[a.id] ?? 0) + 1;
      if (!x.dex.includes(a.id)) x.dex.push(a.id);
    }
  });
  updateUser(listing.sellerId, (x) => {
    x.cowoncy += sellerCut;
    x.lifetimeCowoncy = (x.lifetimeCowoncy ?? 0) + sellerCut;
  });
  updateMarket((m) => { m.listings = m.listings.filter((l) => l.id !== id); });

  const sellerMention = `<@${listing.sellerId}>`;
  await message.reply(
    `${emoji("cowoncy")} Bought ${a?.emoji ?? "🐾"} **${a?.name ?? listing.animalId}** for **${listing.price.toLocaleString()}** cowoncy.\n` +
    `Seller ${sellerMention} received **${sellerCut.toLocaleString()}** *(after ${Math.round(MARKET_TAX_PCT * 100)}% market tax = ${tax.toLocaleString()})*.`,
  );
}

async function cancelListing(message: Message, args: string[]): Promise<void> {
  const idStr = args[0]?.replace(/^#/, "");
  if (!idStr || !/^\d+$/.test(idStr)) {
    await message.reply("Usage: `lowo market cancel <listingId>`");
    return;
  }
  const id = parseInt(idStr, 10);
  const market = getMarket();
  const listing = market.listings.find((l) => l.id === id);
  if (!listing) { await message.reply(`❌ Listing \`#${id}\` not found.`); return; }
  if (listing.sellerId !== message.author.id) { await message.reply("❌ That isn't your listing."); return; }
  updateUser(message.author.id, (x) => { x.zoo[listing.animalId] = (x.zoo[listing.animalId] ?? 0) + 1; });
  updateMarket((m) => { m.listings = m.listings.filter((l) => l.id !== id); });
  const a = ANIMAL_BY_ID[listing.animalId];
  await message.reply(`${emoji("ok")} Cancelled listing \`#${id}\` — ${a?.emoji ?? "🐾"} **${a?.name ?? listing.animalId}** returned to your zoo.`);
}

// ─── Admin helpers (used from admin.ts) ──────────────────────────────────────
export function adminListAll(): MarketListing[] {
  sweepExpiredListings();
  return [...getMarket().listings].sort((a, b) => b.postedAt - a.postedAt);
}
export function adminClearAll(): { cleared: number } {
  const market = getMarket();
  let cleared = 0;
  for (const l of market.listings) {
    updateUser(l.sellerId, (x) => { x.zoo[l.animalId] = (x.zoo[l.animalId] ?? 0) + 1; });
    cleared += 1;
  }
  updateMarket((m) => { m.listings = []; });
  return { cleared };
}
export function fmtListingForAdmin(l: MarketListing): string { return fmtListing(l); }
