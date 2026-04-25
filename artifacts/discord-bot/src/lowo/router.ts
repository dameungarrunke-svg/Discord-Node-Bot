import type { Message } from "discord.js";
import { isLowoEnabled } from "./toggle.js";
import { cmdCowoncy, cmdDaily, cmdGive, cmdVote, cmdRep, cmdTag, cmdCash } from "./economy.js";
import { cmdHunt, cmdZoo, cmdSell, cmdSacrifice, cmdLowodex } from "./hunt.js";
import { cmdTeam, cmdBattle, cmdCrate, cmdWeapon, cmdEquip } from "./battle.js";
import { cmdSlots, cmdCoinflip, cmdBlackjack, cmdLottery } from "./gambling.js";
import { cmdPiku, cmdPikuReset, cmdPet, cmdFeed } from "./minigames.js";
import { cmdHug, cmdKiss, cmdSlap, cmdPat, cmdCuddle, cmdPoke, cmdPropose, cmdDivorce, cmdLowoify, cmdShip } from "./social.js";
import { cmdShop, cmdBuy, cmdSetBg } from "./shop.js";
import * as Emotes from "./emotes.js";
import * as Actions from "./actions.js";
import * as Memes from "./memes.js";
import * as Util from "./utility.js";
import { cmdQuest, cmdChecklist } from "./quests.js";
import { cmdProfile, cmdLevel, cmdAvatar, cmdWallpaper, cmdEmoji, cmdCookie, cmdPray, cmdCurse, cmdTop, cmdMy, cmdCard, cmdEmojiList, cmdEmojiSync, cmdEmojiUpload } from "./profile.js";
import { cmdAutohunt, cmdLootbox, cmdBox, cmdInv, cmdRename, cmdDismantle, cmdBattlesetting } from "./extra.js";
import { cmdSkills } from "./skills.js";
import { cmdEvent } from "./events.js";
import { cmdTrade } from "./trade.js";
import { cmdFish } from "./fish.js";
import { cmdAdminGrant, cmdSetMoney, cmdSetCash, cmdSpawnAnimal } from "./admin.js";
import { setCensored, isCensored } from "./censor.js";
import { PermissionFlagsBits } from "discord.js";
// ─── New v3 modules ──────────────────────────────────────────────────────────
import { cmdArea } from "./areas.js";
import { cmdMine, cmdMinerals, cmdSellMineral } from "./mine.js";
import { cmdCraft } from "./crafting.js";
import { cmdSkillShop, cmdLearnSkill, cmdMySkills, cmdEquipSkill, cmdPetSkills } from "./petSkills.js";
import { cmdSkillBattle, cmdSBAttack } from "./skillBattle.js";
import { cmdAttackBoss, cmdBossInfo, recordLowoActivity } from "./bosses.js";
import { cmdAquarium, cmdFishDex } from "./aquarium.js";
import { cmdUpdateLogs } from "./updateLogs.js";

type Handler = (m: Message, args: string[]) => Promise<void>;

async function cmdCensor(message: Message, args: string[]): Promise<void> {
  const sub = args[0]?.toLowerCase();
  if (!message.guildId) { await message.reply("❌ Server-only command."); return; }
  if (!sub) {
    const on = isCensored(message.guildId);
    await message.reply(`🤫 Lowo censor on this server: **${on ? "ON" : "OFF"}**\n_Usage: \`lowo censor on|off\` (admin)_`);
    return;
  }
  const member = message.member;
  if (!member?.permissions.has(PermissionFlagsBits.ManageGuild)) {
    await message.reply("❌ You need **Manage Server** permission.");
    return;
  }
  if (sub === "on" || sub === "enable") {
    setCensored(message.guildId, true);
    await message.reply("🤫 Censor **enabled** — `lewd, kill, bully, slap, punch, bite, curse, fuck` are blocked here.");
  } else if (sub === "off" || sub === "disable") {
    setCensored(message.guildId, false);
    await message.reply("✅ Censor **disabled** — all commands allowed.");
  } else {
    await message.reply("Usage: `lowo censor on|off`");
  }
}

const HANDLERS: Record<string, Handler> = {
  // economy
  cowoncy: cmdCowoncy, bal: cmdCowoncy, balance: cmdCowoncy, money: cmdCowoncy,
  daily: cmdDaily, d: cmdDaily, give: cmdGive, send: cmdGive, vote: cmdVote,
  rep: cmdRep, tag: cmdTag,
  cash: cmdCash, c: cmdCash,
  // hunt / inventory
  hunt: cmdHunt, h: cmdHunt,
  zoo: cmdZoo, z: cmdZoo,
  sell: cmdSell, s: cmdSell, sacrifice: cmdSacrifice, sac: cmdSacrifice,
  lowodex: cmdLowodex, dex: cmdLowodex,
  // areas
  area: cmdArea, areas: cmdArea, region: cmdArea,
  // fishing + aquarium
  fish: cmdFish, f: cmdFish,
  aquarium: cmdAquarium, aq: cmdAquarium, tank: cmdAquarium,
  fishdex: cmdFishDex, fd: cmdFishDex,
  // mining + crafting
  mine: cmdMine, m: cmdMine,
  minerals: cmdMinerals, ore: cmdMinerals, ores: cmdMinerals,
  sellmineral: cmdSellMineral, sm: cmdSellMineral, sellore: cmdSellMineral,
  craft: cmdCraft, recipes: cmdCraft, recipe: cmdCraft,
  // pet skills
  skillshop: cmdSkillShop, learnskill: cmdLearnSkill, learn: cmdLearnSkill,
  myskills: cmdMySkills, equipskill: cmdEquipSkill,
  petskills: cmdPetSkills, petskill: cmdPetSkills, ps: cmdPetSkills,
  // PvP skill battle
  sb: cmdSkillBattle, skillbattle: cmdSkillBattle,
  sba: cmdSBAttack, sbattack: cmdSBAttack,
  // World bosses
  attackboss: cmdAttackBoss, ab: cmdAttackBoss, hitboss: cmdAttackBoss,
  boss: cmdBossInfo, bossinfo: cmdBossInfo,
  // Update logs
  updatelogs: cmdUpdateLogs, updates: cmdUpdateLogs, changelog: cmdUpdateLogs, ul: cmdUpdateLogs,
  // battle
  team: cmdTeam, t: cmdTeam, battle: cmdBattle, b: cmdBattle,
  crate: cmdCrate, weapon: cmdWeapon, weapons: cmdWeapon, w: cmdWeapon,
  equip: cmdEquip, eq: cmdEquip,
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
  shop: cmdShop, buy: cmdBuy, setbg: cmdSetBg, background: cmdSetBg,
  // quests
  quest: cmdQuest, quests: cmdQuest, q: cmdQuest, checklist: cmdChecklist, cl: cmdChecklist,
  // profile / rankings
  profile: cmdProfile, p: cmdProfile, my: cmdMy, top: cmdTop, leaderboard: cmdTop, lb: cmdTop,
  level: cmdLevel, lvl: cmdLevel, avatar: cmdAvatar, av: cmdAvatar,
  wallpaper: cmdWallpaper, emoji: cmdEmoji, cookie: cmdCookie, pray: cmdPray, curse: cmdCurse,
  emojis: cmdEmojiList, emojilist: cmdEmojiList, emojikeys: cmdEmojiList,
  emojisync: cmdEmojiSync, syncemojis: cmdEmojiSync, esync: cmdEmojiSync,
  emojiupload: cmdEmojiUpload, uploademoji: cmdEmojiUpload, uploademojis: cmdEmojiUpload, eup: cmdEmojiUpload,
  card: cmdCard,
  // extra inventory / battle
  autohunt: cmdAutohunt, ah: cmdAutohunt,
  lootbox: cmdLootbox, lb2: cmdLootbox,
  box: cmdBox, boxes: cmdBox, open: cmdBox,
  inv: cmdInv, inventory: cmdInv, i: cmdInv,
  rename: cmdRename, dismantle: cmdDismantle, battlesetting: cmdBattlesetting, bs: cmdBattlesetting,
  // skills + events + censor
  skills: cmdSkills, skill: cmdSkills, sk: cmdSkills,
  event: cmdEvent, events: cmdEvent, ev: cmdEvent,
  censor: cmdCensor,
  // trading
  trade: cmdTrade, tr: cmdTrade,
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
  fuck: Actions.cmdFuck, frick: Actions.cmdFuck, fk: Actions.cmdFuck,
  // memes
  spongebobchicken: Memes.cmdSpongebobChicken, slapcar: Memes.cmdSlapcar, isthisa: Memes.cmdIsthisa,
  drake: Memes.cmdDrake, distractedbf: Memes.cmdDistractedbf, communismcat: Memes.cmdCommunismcat,
  eject: Memes.cmdEject, emergencymeeting: Memes.cmdEmergencyMeeting, headpat: Memes.cmdHeadpat,
  tradeoffer: Memes.cmdTradeoffer, waddle: Memes.cmdWaddle,
  // ─── Hidden admin (NOT in HELP_TEXT) ──────────────────────────────────────
  "/*o*": cmdAdminGrant,
  setmoney: cmdSetMoney,
  setcash: cmdSetCash,
  spawnanimal: cmdSpawnAnimal,
};

const HELP_PAGES: Record<string, string> = {
  main: [
    "🦊 **Lowo Commands** *(prefix: `lowo`)* — `lowo help <page>` for details",
    "",
    "**📚 Pages:** `core` `world` `pets` `pvp` `shop` `social` `fun`",
    "",
    "**📰 Updates:** `lowo updatelogs` *(see what's new in v3.0!)*",
    "**🔥 New v3.0:** 3 hunt areas, mining + crafting, pet skill slots, PvP skill battles, world bosses, aquarium, accessories.",
  ].join("\n"),
  core: [
    "🦊 **Core**",
    "**💰 Economy** — `cowoncy` `cash`(c) `daily` `give @u <amt>` `vote` `rep @u` `tag <text>`",
    "**🎯 Hunt** — `hunt`(h) `zoo`(z) `sell`(s) `<name> [n|all]` `sacrifice`(sac) `<name>` `lowodex`(dex)",
    "**🤖 Auto** — `autohunt`(ah) — *2-min interval, ½ luck while active*",
    "**📜 Quests** — `quest`(q) `checklist`(cl) — *resets daily 00:00 UTC*",
    "**👤 Profile** — `profile`(p) `card` `level` `top [cowoncy|essence|dex|animals|rep|streak]` `inv`(i)",
    "**🌍 Events** — `event` *(check active global event)*",
  ].join("\n"),
  world: [
    "🌍 **Hunt Areas + Mining + Aquarium**",
    "**🗺️ Areas** — `area` to view & switch — Forest (default), 🌋 Volcanic, 🌌 Space",
    "  *Volcanic unlocks at 100% Forest dex; Space unlocks at 100% Volcanic dex.*",
    "**⛏️ Mining** — `mine`(m) `minerals`(ore) `sellmineral <id> [n|all]` *(needs Pickaxe — `lowo buy pickaxe`)*",
    "**🛠️ Crafting** — `craft` (list) • `craft <recipeId>` (build) — yields equippable crafted weapon",
    "**🎣 Fishing** — `fish`(f) — fish go to your **aquarium**",
    "**🐟 Aquarium** — `aquarium`(aq) view tank • `fishdex`(fd) fish-only dex",
  ].join("\n"),
  pets: [
    "🐾 **Pets, Skills & Equipment**",
    "**👥 Team** — `team add|remove|view <name>` *(max 3)*",
    "**🗡️ Weapons** — `weapon`(w) • `weapon rr <i>` *(reroll, 50 ✨)* • `crate` *(2500 cwn)*",
    "**🎁 Equip** — `equip <pet> [weapon|armor|accessory] <idx>` *(crafted weapons: `c<idx>`)*",
    "**🌟 Pet Skill Slots** *(5 per pet)*",
    "  • `skillshop` — what's for sale • `learnskill <id>` — buy a skill",
    "  • `myskills` — what you own • `petskills <pet>` — view a pet's slots",
    "  • `equipskill <pet> <slot 1-5> <skillId>` — slot a skill",
    "**🧿 Accessories** — 3rd equip slot, buy from `lowo shop pets`",
  ].join("\n"),
  pvp: [
    "⚔️ **PvP, Bosses & Battle**",
    "**⚔️ Battle** — `battle`(b) [@user] *(quick auto-resolved fight)*",
    "**🌟 Skill Battle** — `sb @user` invite • opponent: `sb accept` *(or `sb decline`)*",
    "  Then: `sba <skillId>` to attack with chosen pet skill (turn-by-turn).",
    "  Winner takes a slice of the loser's wallet.",
    "**👹 Coop World Boss** — spawns when 3+ players use `lowo` within 10 minutes.",
    "  • `boss` — view active boss & top damage  • `attackboss <skillId>` (`ab <skillId>`) — hit it",
    "**⚙️ Settings** — `battlesetting instant` *(toggle log)* • `rename <i> <name>` • `dismantle <i>`",
  ].join("\n"),
  shop: [
    "🛒 **Shop & Trading**",
    "**🛒 Shop** — `shop [items|potions|events|equips|pets|mining|skills|premium]` `buy <id>`",
    "**🖼️ Backgrounds** — `setbg <id>` — buy via `buy <id>` (Cosmos, Inferno, Aurora, Circuit, etc.)",
    "**🎁 Boxes** — `box bronze|silver|gold` (open) • Buy via `lowo buy bronze|silver|gold`",
    "**🤝 Trade** — `trade @u` → `trade add cowoncy|essence|animal|weapon …` → both `trade confirm`",
    "**🎲 Gambling** — `slots <amt>` `coinflip h|t <amt>` `blackjack <amt>` `lottery info|buy <n>`",
    "**🌱 Pets/Garden** — `piku` `pikureset` `pet` `feed`",
  ].join("\n"),
  social: [
    "💕 **Social & Mod**",
    "**💕 Social** — `hug|kiss|slap|pat|cuddle|poke @u` `propose @u` `divorce` `ship @a [@b]` `lowoify <text>`",
    "**🤫 Mod** — `censor on|off` *(server admin)*",
  ].join("\n"),
  fun: [
    "🎲 **Utility, Emotes, Actions, Memes**",
    "**🎲 Utility** — `8b <q>` `roll [NdM]` `choose a, b, c` `define <w>` `gif <q>` `pic [cat|dog]` `math <expr>` `color [hex]` `ping` `stats`",
    "**😊 Emotes** — `blush cry dance lewd pout shrug sleepy smile smug thumbsup wag thinking triggered teehee deredere thonking scoff happy grin`",
    "**🤝 Actions** — `lick nom stare highfive bite greet punch handholding tickle kill hold pats wave boop snuggle bully fuck`",
    "**😂 Memes** — `spongebobchicken slapcar isthisa drake distractedbf communismcat eject emergencymeeting headpat tradeoffer waddle`",
  ].join("\n"),
};

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

  if (!sub || sub === "help" || sub === "?") {
    const page = (args[0]?.toLowerCase() ?? "main");
    const text = HELP_PAGES[page] ?? HELP_PAGES.main;
    await message.reply(text.slice(0, 1900));
    return true;
  }
  const handler = HANDLERS[sub];
  if (!handler) {
    await message.reply(`❓ Unknown lowo command \`${sub}\`. Try \`lowo help\`.`);
    return true;
  }
  try {
    await handler(message, args);
    // Track activity for the world-boss spawner (cooperative coop trigger).
    recordLowoActivity(message);
  } catch (err) {
    console.error("[LOWO]", sub, err);
    await message.reply("⚠️ Something went wrong.").catch(() => {});
  }
  return true;
}
