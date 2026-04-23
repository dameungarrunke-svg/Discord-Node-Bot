import type { Message } from "discord.js";
import { isLowoEnabled } from "./toggle.js";
import { cmdCowoncy, cmdDaily, cmdGive, cmdVote } from "./economy.js";
import { cmdHunt, cmdZoo, cmdSell, cmdSacrifice, cmdLowodex } from "./hunt.js";
import { cmdTeam, cmdBattle, cmdCrate, cmdWeapon, cmdEquip } from "./battle.js";
import { cmdSlots, cmdCoinflip, cmdBlackjack, cmdLottery } from "./gambling.js";
import { cmdPiku, cmdPikuReset, cmdPet, cmdFeed } from "./minigames.js";
import { cmdHug, cmdKiss, cmdSlap, cmdPat, cmdCuddle, cmdPoke, cmdPropose, cmdDivorce, cmdLowoify, cmdShip } from "./social.js";
import { cmdShop, cmdBuy } from "./shop.js";

type Handler = (m: Message, args: string[]) => Promise<void>;

const HANDLERS: Record<string, Handler> = {
  // economy
  cowoncy: cmdCowoncy, bal: cmdCowoncy, balance: cmdCowoncy,
  daily: cmdDaily, give: cmdGive, vote: cmdVote,
  // hunt / inventory
  hunt: cmdHunt, h: cmdHunt,
  zoo: cmdZoo, z: cmdZoo,
  sell: cmdSell, sacrifice: cmdSacrifice, sac: cmdSacrifice,
  lowodex: cmdLowodex, dex: cmdLowodex,
  // battle
  team: cmdTeam, battle: cmdBattle, b: cmdBattle,
  crate: cmdCrate, weapon: cmdWeapon, weapons: cmdWeapon, equip: cmdEquip,
  // gambling
  slots: cmdSlots, slot: cmdSlots, coinflip: cmdCoinflip, cf: cmdCoinflip,
  blackjack: cmdBlackjack, bj: cmdBlackjack, lottery: cmdLottery,
  // minigames
  piku: cmdPiku, pikureset: cmdPikuReset, pet: cmdPet, feed: cmdFeed,
  // social
  hug: cmdHug, kiss: cmdKiss, slap: cmdSlap, pat: cmdPat, cuddle: cmdCuddle, poke: cmdPoke,
  propose: cmdPropose, marry: cmdPropose, divorce: cmdDivorce,
  lowoify: cmdLowoify, ship: cmdShip,
  // shop
  shop: cmdShop, buy: cmdBuy,
};

const HELP_TEXT = [
  "🦊 **Lowo Commands** *(prefix: `lowo`)*",
  "",
  "**💰 Economy**",
  "`lowo cowoncy [@user]` • `lowo daily` • `lowo give @user <amt>` • `lowo vote`",
  "",
  "**🎯 Collection**",
  "`lowo hunt` • `lowo zoo [@user]` • `lowo sell <id> [count|all]`",
  "`lowo sacrifice <id> [count|all]` • `lowo lowodex`",
  "",
  "**⚔️ Battle**",
  "`lowo team add|remove|view <id>` • `lowo battle [@user]`",
  "`lowo crate` • `lowo weapon` • `lowo equip <animalId> <weaponIdx>`",
  "",
  "**🎲 Gambling**",
  "`lowo slots <amt>` • `lowo coinflip h|t <amt>`",
  "`lowo blackjack <amt>` • `lowo lottery info|buy <n>`",
  "",
  "**🌱 Pets & Garden**",
  "`lowo piku` • `lowo pikureset` • `lowo pet` • `lowo feed`",
  "",
  "**💕 Social**",
  "`lowo hug|kiss|slap|pat|cuddle|poke @user`",
  "`lowo propose @user` • `lowo divorce` • `lowo ship @a [@b]`",
  "`lowo lowoify <text>`",
  "",
  "**🛒 Shop**",
  "`lowo shop` • `lowo buy <itemId>`",
].join("\n");

export async function handleLowoCommand(message: Message): Promise<boolean> {
  if (message.author.bot) return false;
  const content = message.content.trim();
  const lower = content.toLowerCase();
  if (!lower.startsWith("lowo ") && lower !== "lowo") return false;
  if (!isLowoEnabled()) return false;

  const parts = content.split(/\s+/);
  parts.shift(); // remove "lowo"
  const sub = parts.shift()?.toLowerCase();
  const args = parts;

  if (!sub || sub === "help") {
    await message.reply(HELP_TEXT.slice(0, 1900));
    return true;
  }
  const handler = HANDLERS[sub];
  if (!handler) {
    await message.reply(`❓ Unknown lowo command \`${sub}\`. Try \`lowo help\`.`);
    return true;
  }
  try { await handler(message, args); }
  catch (err) {
    console.error("[LOWO]", sub, err);
    await message.reply("⚠️ Something went wrong.").catch(() => {});
  }
  return true;
}
