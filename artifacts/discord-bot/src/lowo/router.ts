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
import { cmdRecycle, cmdMaterials, cmdFuse } from "./pets.js";

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
  // ─── THE NEW ERA — pet recycling + 100-pet fusion system ──────────────────
  recycle: cmdRecycle, rec: cmdRecycle, breakdown: cmdRecycle,
  materials: cmdMaterials, mats: cmdMaterials, mat: cmdMaterials,
  fuse: cmdFuse, fusion: cmdFuse,
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

// THE NEW ERA — single-block help. Multi-page navigation removed per user
// request. The full command list is rendered inside one Discord message
// (split across at most 2 messages if it exceeds the 2000-char limit).
const HELP_TEXT = [
  "🦊 **LOWO COMMANDS — THE NEW ERA** *(prefix: `lowo`)*",
  "📰 What's new: `lowo updatelogs` (see v4.0 highlights below).",
  "",
  "**💰 Economy** — `cowoncy` `cash`(c) `daily` `give @u <amt>` `vote` `rep @u` `tag <text>`",
  "**🎯 Hunt / Zoo** — `hunt`(h) `zoo`(z) `sell`(s) `<name> [n|all]` `sacrifice`(sac) `<name>` `lowodex`(dex)",
  "**🤖 Auto** — `autohunt`(ah) — *2-min interval (1-min with Auto-Hunt Upgrade gamepass), ½ luck*",
  "**📜 Quests** — `quest`(q) `checklist`(cl) — *resets daily 00:00 UTC*",
  "**👤 Profile** — `profile`(p) `card` `level` `top [cowoncy|essence|dex|animals|rep|streak]` `inv`(i)",
  "**🌍 Events** — `event` *(check active global event)*",
  "",
  "**🗺️ Hunt Areas** — `area` to view & switch — Forest (default), 🌋 Volcanic, 🌌 Space *(unlock by completing the previous area's dex)*",
  "**⛏️ Mining** — `mine`(m) `minerals`(ore) `sellmineral <id> [n|all]` *(buy a Pickaxe first)*",
  "**🛠️ Crafting** — `craft` (list) • `craft <recipeId>` (build)",
  "**🎣 Fishing** — `fish`(f) — fish go to your **aquarium**",
  "**🐟 Aquarium** — `aquarium`(aq) view tank • `fishdex`(fd) fish-only dex",
  "",
  "**👥 Team** — `team add|remove|view <name>` *(max 3)*",
  "**🗡️ Weapons** — `weapon`(w) • `weapon rr <i>` *(reroll, 50 ✨)* • `crate` *(2500 cwn)*",
  "**🎁 Equip** — `equip <pet> [weapon|armor|accessory] <idx>` *(crafted: `c<idx>`)*",
  "**🌟 Pet Skill Slots** — `skillshop` `learnskill <id>` `myskills` `petskills <pet>` `equipskill <pet> <slot 1-5> <skillId>`",
  "**🧿 Accessories** — 3rd equip slot, buy from `lowo shop pets`",
  "",
  "**🧬 Pet Recycling + Fusion (NEW)** — `recycle`(rec) `<name> [n|all]` → 🧬 Pet Materials. `materials`(mats) view count. `fuse <petA> + <petB>` combines 2 pets + 50 🧬 → random fusion pet (100 unique fusions in the game).",
  "",
  "**⚔️ Battle** — `battle`(b) [@user] — now rewards **🪙 Battle Tokens** instead of cowoncy.",
  "**🌟 Skill Battle** — `sb @user`, opponent `sb accept`, then `sba <skillId>`.",
  "**👹 Coop World Boss** — spawns when 3+ players use lowo in 10m. `boss` view, `attackboss <skillId>`(ab) hit.",
  "**⚙️ Settings** — `battlesetting instant` • `rename <i> <name>` • `dismantle <i>`",
  "",
  "**🛒 Shop** — `shop [items|potions|events|equips|pets|mining|skills|gamepasses|essence|premium]` `buy <id> [cash]`",
  "  • **Gamepasses (NEW):** Double Luck, Secret Hunter, Auto-Hunt Upgrade, Triple Drop, Pity Pro, Battle Master, Coin Magnet, VIP Shop Card, Mythic Tracker, Crate Lover, Event Enthusiast, Essence Master.",
  "  • **Essence Shop (NEW):** OP perks bought with ✨ essence — Legendary Crate, Pity Wipe, Random Legendary, Mystery Fusion, etc.",
  "**🖼️ Backgrounds** — `setbg <id>` — *(10 new bgs in v4: Void, Galaxy, Pixel, Blood Moon, Crystal, Neon, Zen, Internet Era, Supernova, Oblivion).*",
  "**🎁 Boxes** — `box bronze|silver|gold` open • buy via `lowo buy bronze|silver|gold`",
  "**🤝 Trade** — `trade @u` → `trade add cowoncy|essence|animal|weapon …` → both `trade confirm`",
  "**🎲 Gambling** — `slots <amt>` `coinflip h|t <amt>` `blackjack <amt>` `lottery info|buy <n>`",
  "**🌱 Pets/Garden** — `piku` `pikureset` `pet` `feed`",
  "",
  "**💕 Social** — `hug|kiss|slap|pat|cuddle|poke @u` `propose @u` `divorce` `ship @a [@b]` `lowoify <text>`",
  "**🤫 Mod** — `censor on|off` *(server admin)*",
  "**🎲 Utility** — `8b <q>` `roll` `choose a,b,c` `define <w>` `gif <q>` `pic` `math` `color` `ping` `stats`",
  "**😊 Emotes** — `blush cry dance lewd pout shrug sleepy smile smug thumbsup wag thinking triggered teehee deredere thonking scoff happy grin`",
  "**🤝 Actions** — `lick nom stare highfive bite greet punch handholding tickle kill hold pats wave boop snuggle bully fuck`",
  "**😂 Memes** — `spongebobchicken slapcar isthisa drake distractedbf communismcat eject emergencymeeting headpat tradeoffer waddle`",
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

  if (!sub || sub === "help" || sub === "?") {
    // THE NEW ERA — single-block help. If the message is over Discord's 2000-char
    // limit, send it in two parts in-order.
    const MAX = 1950;
    if (HELP_TEXT.length <= MAX) {
      await message.reply(HELP_TEXT);
    } else {
      // Split on a paragraph boundary closest to MAX so sections stay intact.
      let cut = HELP_TEXT.lastIndexOf("\n\n", MAX);
      if (cut < 1000) cut = MAX; // fallback hard split
      await message.reply(HELP_TEXT.slice(0, cut));
      const ch = message.channel;
      if ("send" in ch) await ch.send(HELP_TEXT.slice(cut).trim().slice(0, 1950)).catch(() => {});
    }
    return true;
  }
  const handler = HANDLERS[sub];
  if (!handler) {
    // THE NEW ERA — auto-delete unknown-command warning after 8s to keep
    // channels tidy. Best-effort — silently ignore permission errors.
    const reply = await message.reply(`❓ Unknown lowo command \`${sub}\`. Try \`lowo help\`. *(this message will self-delete)*`).catch(() => null);
    if (reply) setTimeout(() => { reply.delete().catch(() => {}); }, 8000);
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
