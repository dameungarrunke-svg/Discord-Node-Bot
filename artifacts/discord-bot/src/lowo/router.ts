import type { Message } from "discord.js";
import { isLowoEnabled } from "./toggle.js";
import { cmdCowoncy, cmdDaily, cmdGive, cmdVote } from "./economy.js";
import { cmdHunt, cmdZoo, cmdSell, cmdSacrifice, cmdLowodex } from "./hunt.js";
import { cmdTeam, cmdBattle, cmdCrate, cmdWeapon, cmdEquip } from "./battle.js";
import { cmdSlots, cmdCoinflip, cmdBlackjack, cmdLottery } from "./gambling.js";
import { cmdPiku, cmdPikuReset, cmdPet, cmdFeed } from "./minigames.js";
import { cmdHug, cmdKiss, cmdSlap, cmdPat, cmdCuddle, cmdPoke, cmdPropose, cmdDivorce, cmdLowoify, cmdShip } from "./social.js";
import { cmdShop, cmdBuy } from "./shop.js";
import * as Emotes from "./emotes.js";
import * as Actions from "./actions.js";
import * as Memes from "./memes.js";
import * as Util from "./utility.js";
import { cmdQuest, cmdChecklist } from "./quests.js";
import { cmdProfile, cmdLevel, cmdAvatar, cmdWallpaper, cmdEmoji, cmdCookie, cmdPray, cmdCurse, cmdTop, cmdMy } from "./profile.js";
import { cmdAutohunt, cmdLootbox, cmdInv, cmdRename, cmdDismantle, cmdBattlesetting } from "./extra.js";

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
  // quests
  quest: cmdQuest, quests: cmdQuest, checklist: cmdChecklist,
  // profile / rankings
  profile: cmdProfile, p: cmdProfile, my: cmdMy, top: cmdTop,
  level: cmdLevel, lvl: cmdLevel, avatar: cmdAvatar, av: cmdAvatar,
  wallpaper: cmdWallpaper, emoji: cmdEmoji, cookie: cmdCookie, pray: cmdPray, curse: cmdCurse,
  // extra inventory / battle
  autohunt: cmdAutohunt, lootbox: cmdLootbox, inv: cmdInv, inventory: cmdInv,
  rename: cmdRename, dismantle: cmdDismantle, battlesetting: cmdBattlesetting,
  // utility
  "8b": Util.cmd8ball, "8ball": Util.cmd8ball, roll: Util.cmdRoll, choose: Util.cmdChoose,
  define: Util.cmdDefine, gif: Util.cmdGif, pic: Util.cmdPic, translate: Util.cmdTranslate,
  bell: Util.cmdBell, math: Util.cmdMath, color: Util.cmdColor, ping: Util.cmdPing, stats: Util.cmdStats,
  // emotes (self)
  blush: Emotes.cmdBlush, cry: Emotes.cmdCry, dance: Emotes.cmdDance, lewd: Emotes.cmdLewd,
  pout: Emotes.cmdPout, shrug: Emotes.cmdShrug, sleepy: Emotes.cmdSleepy, smile: Emotes.cmdSmile,
  smug: Emotes.cmdSmug, thumbsup: Emotes.cmdThumbsup, thumbs: Emotes.cmdThumbsup, wag: Emotes.cmdWag,
  thinking: Emotes.cmdThinking, triggered: Emotes.cmdTriggered, teehee: Emotes.cmdTeehee,
  deredere: Emotes.cmdDeredere, thonking: Emotes.cmdThonking, scoff: Emotes.cmdScoff,
  happy: Emotes.cmdHappy, grin: Emotes.cmdGrin,
  // actions (target @user)
  lick: Actions.cmdLick, nom: Actions.cmdNom, stare: Actions.cmdStare, highfive: Actions.cmdHighfive,
  bite: Actions.cmdBite, greet: Actions.cmdGreet, punch: Actions.cmdPunch,
  handholding: Actions.cmdHandholding, tickle: Actions.cmdTickle, kill: Actions.cmdKill,
  hold: Actions.cmdHold, pats: Actions.cmdPats, wave: Actions.cmdWave, boop: Actions.cmdBoop,
  snuggle: Actions.cmdSnuggle, bully: Actions.cmdBully,
  // memes
  spongebobchicken: Memes.cmdSpongebobChicken, slapcar: Memes.cmdSlapcar, isthisa: Memes.cmdIsthisa,
  drake: Memes.cmdDrake, distractedbf: Memes.cmdDistractedbf, communismcat: Memes.cmdCommunismcat,
  eject: Memes.cmdEject, emergencymeeting: Memes.cmdEmergencyMeeting, headpat: Memes.cmdHeadpat,
  tradeoffer: Memes.cmdTradeoffer, waddle: Memes.cmdWaddle,
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
  "",
  "**📜 Quests & Profile**",
  "`lowo quest` • `lowo checklist` • `lowo profile [@user]` • `lowo level` • `lowo top [cowoncy|essence|dex|animals]`",
  "`lowo my` • `lowo avatar [@user]` • `lowo wallpaper` • `lowo emoji <e>`",
  "",
  "**🎒 Extras**",
  "`lowo inv [@user]` • `lowo autohunt` • `lowo lootbox` • `lowo rename <wIdx> <name>`",
  "`lowo dismantle <wIdx>` • `lowo battlesetting`",
  "",
  "**🎲 Utility**",
  "`lowo 8b <q>` • `lowo roll [NdM|N]` • `lowo choose a, b, c` • `lowo define <word>`",
  "`lowo gif <q>` • `lowo pic [cat|dog]` • `lowo math <expr>` • `lowo color [hex]`",
  "`lowo ping` • `lowo stats` • `lowo bell` • `lowo translate`",
  "",
  "**😊 Emotes (self)**",
  "`blush cry dance lewd pout shrug sleepy smile smug thumbsup wag`",
  "`thinking triggered teehee deredere thonking scoff happy grin`",
  "",
  "**🤝 Actions (@user)**",
  "`lick nom stare highfive bite greet punch handholding tickle kill`",
  "`hold pats wave boop snuggle bully cookie pray curse`",
  "",
  "**😂 Memes**",
  "`spongebobchicken | slapcar | isthisa | drake | distractedbf`",
  "`communismcat | eject | emergencymeeting | headpat | tradeoffer | waddle`",
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
