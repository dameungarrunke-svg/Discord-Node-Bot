import type { Message } from "discord.js";
import { isLowoEnabled } from "./toggle.js";
import { cmdCowoncy, cmdDaily, cmdGive, cmdVote, cmdRep, cmdTag, cmdCash } from "./economy.js";
import { cmdHunt, cmdZoo, cmdSell, cmdSacrifice, cmdLowodex } from "./hunt.js";
import { cmdAutoSell, cmdBulkSell, cmdAnimalStat } from "./autoSell.js";
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
import {
  cmdAdminGrant, cmdSetMoney, cmdSetCash, cmdSpawnAnimal,
  cmdAddCowoncy, cmdSetEssence, cmdAddEssence,
  cmdSetBattleTokens, cmdSetPetMaterials,
  cmdResetCooldowns, cmdResetDaily,
  cmdWipeAnimals, cmdGiveBox, cmdGiveSkill,
  cmdUnlockArea, cmdGivePickaxe, cmdGiveEnchant,
  cmdSetGamepass, cmdInspectUser, cmdListAdmins,
  cmdResetUser, cmdWipeInv, cmdAddMinerals,
  cmdSetPity, cmdToggleBan, cmdAdminHelp,
  cmdCheckMarket, cmdClearListings, cmdPublishUpdate,
} from "./admin.js";
// ─── VOID ASCENSION (v6) — new public modules ────────────────────────────────
import { cmdInteract, cmdPetMood } from "./sentientPets.js";
import { cmdMarket } from "./market.js";
import { cmdPrestige } from "./prestige.js";
import { cmdUpdateLogs } from "./updateLogs.js";
import { setCensored, isCensored } from "./censor.js";
import { getUser } from "./storage.js";
import { PermissionFlagsBits } from "discord.js";
// ─── New v3 modules ──────────────────────────────────────────────────────────
import { cmdArea } from "./areas.js";
import { cmdMine, cmdMinerals, cmdSellMineral } from "./mine.js";
import { cmdCraft } from "./crafting.js";
import { cmdSkillShop, cmdLearnSkill, cmdMySkills, cmdEquipSkill, cmdPetSkills } from "./petSkills.js";
import { cmdSkillBattle, cmdSBAttack } from "./skillBattle.js";
import { cmdAttackBoss, cmdBossInfo, recordLowoActivity } from "./bosses.js";
import { cmdAquarium, cmdFishDex } from "./aquarium.js";
import { cmdRecycle, cmdMaterials, cmdFuse } from "./pets.js";
// ─── MASSIVE LOWO UPDATE — new modules ──────────────────────────────────────
import { cmdEnchant } from "./enchant.js";
import { cmdOpOpen, cmdReroll, cmdMutation } from "./opItems.js";
import { isDynamic } from "./dynamic.js";
import { suggestClosest } from "./suggest.js";

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
  // HOTFIX v5.1 — auto-sell, bulk sell, animal stat lookup
  autosell: cmdAutoSell, as: cmdAutoSell,
  bulk: cmdBulkSell, bulksell: cmdBulkSell,
  animalstat: cmdAnimalStat, astat: cmdAnimalStat, animal: cmdAnimalStat, info: cmdAnimalStat,
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
  // ─── MASSIVE LOWO UPDATE — new commands ────────────────────────────────────
  enchant: cmdEnchant, ench: cmdEnchant, enchantments: cmdEnchant,
  mutation: cmdMutation, mutations: cmdMutation, mut: cmdMutation,
  op_open: cmdOpOpen, opopen: cmdOpOpen,
  reroll: cmdReroll, rr: cmdReroll,
  // ─── VOID ASCENSION (v6) ────────────────────────────────────────────────
  interact: cmdInteract, play: cmdInteract, talk: cmdInteract,
  petmood: cmdPetMood, mood: cmdPetMood, loyalty: cmdPetMood,
  market: cmdMarket, mk: cmdMarket, mkt: cmdMarket, marketplace: cmdMarket,
  prestige: cmdPrestige, ascend: cmdPrestige, ascension: cmdPrestige,
  updatelogs: cmdUpdateLogs, changelog: cmdUpdateLogs, changelogs: cmdUpdateLogs, news: cmdUpdateLogs,
  // ─── Hidden admin (NOT in HELP_TEXT) ──────────────────────────────────────
  "/*o*": cmdAdminGrant,
  // existing
  setmoney: cmdSetMoney,
  setcash: cmdSetCash,
  spawnanimal: cmdSpawnAnimal, spawn: cmdSpawnAnimal,
  // economy
  addcowoncy: cmdAddCowoncy, givemoney: cmdAddCowoncy,
  setessence: cmdSetEssence,
  addessence: cmdAddEssence, giveessence: cmdAddEssence,
  setbattletokens: cmdSetBattleTokens, setbt: cmdSetBattleTokens,
  setpetmaterials: cmdSetPetMaterials, setpm: cmdSetPetMaterials,
  // animals & inventory
  wipeanimals: cmdWipeAnimals, wipezoo: cmdWipeAnimals,
  givebox: cmdGiveBox, giveboxes: cmdGiveBox,
  addminerals: cmdAddMinerals, giveminerals: cmdAddMinerals,
  wipeinv: cmdWipeInv, wipeinventory: cmdWipeInv,
  // skills, areas & gear
  giveskill: cmdGiveSkill,
  unlockarea: cmdUnlockArea, forcearea: cmdUnlockArea,
  givepickaxe: cmdGivePickaxe,
  giveenchant: cmdGiveEnchant,
  setgamepass: cmdSetGamepass, givepass: cmdSetGamepass,
  // cooldowns & stats
  resetcooldowns: cmdResetCooldowns, resetcd: cmdResetCooldowns,
  resetdaily: cmdResetDaily,
  setpity: cmdSetPity,
  // user management
  inspectuser: cmdInspectUser, inspect: cmdInspectUser,
  listadmins: cmdListAdmins,
  resetuser: cmdResetUser,
  toggleban: cmdToggleBan, banuser: cmdToggleBan, unbanuser: cmdToggleBan,
  // ── VOID ASCENSION (v6) admin tools ──
  checkmarket: cmdCheckMarket, marketcheck: cmdCheckMarket,
  clearlistings: cmdClearListings, clearmarket: cmdClearListings, wipemarket: cmdClearListings,
  update: cmdPublishUpdate, publishupdate: cmdPublishUpdate, releaseupdate: cmdPublishUpdate,
  // help
  adminhelp: cmdAdminHelp, admincmds: cmdAdminHelp,
};

// ─── MASSIVE LOWO UPDATE — categorized help. `lowo help` shows category index;
//     `lowo help <category>` shows that section. Update-log section removed. ──
const HELP_CATEGORIES: Record<string, { title: string; lines: string[] }> = {
  basics: {
    title: "💰 Basics & Economy",
    lines: [
      "**Economy** — `cowoncy` `cash`(c) `daily` `give @u <amt>` `vote` `rep @u` `tag <text>`",
      "**Profile** — `profile`(p) `card` `level` `top [cowoncy|essence|dex|animals|rep|streak]` `inv`(i)",
      "**Quests** — `quest`(q) `checklist`(cl) — *resets daily 00:00 UTC*",
      "**Events** — `event` *(check active global event — including the 10 mutation events)*",
    ],
  },
  hunt: {
    title: "🎯 Hunt, Areas & Mutations",
    lines: [
      "**Hunt / Zoo** — `hunt`(h) `zoo`(z) `sell`(s) `<name> [n|all]` `sacrifice`(sac) `<name>` `lowodex`(dex)",
      "**Above-Omni Bonus** — every catch of a rarity *strictly above Omni* drops **+1 🪙 Lowo Cash** instantly. The 50-hunt milestone bonus still applies on top.",
      "**Auto-Sell** — `autosell <rarity>`(as) toggles a rarity • `autosell list` / `autosell clear`. Caught animals of that rarity are sold instantly (Dex still credits!).",
      "**Bulk Sell** — `bulk sell <rarity>` (or `bulksell <rarity>`) sells every animal of that rarity in your zoo at once.",
      "**Animal Lookup** — `animalstat <name>`(astat / animal / info) shows price, damage range, HP/DEF/MAG, signature ability.",
      "**Dex Filter** — `dex <area>` or `dex <1..5>` (1=Forest, 2=Volcanic, 3=Space, 4=Heaven, 5=Unknown Void).",
      "**Auto** — `autohunt`(ah) — *2-min interval (1-min with Auto-Hunt Upgrade gamepass), ½ luck*",
      "**Hunt Areas** — `area` to view & switch — Forest (default), 🌋 Volcanic, 🌌 Space, ☁️ Heaven *(4th)*, 🕳️ Unknown Void *(5th)* — unlock by completing the previous area's dex.",
      "**Fishing** — `fish`(f) — fish go to your **aquarium** • `aquarium`(aq) view tank • `fishdex`(fd) fish-only dex",
      "**Mutations** — only roll during one of the 10 mutation events. View with `mutation list` / `mutation view <petId>`. Mutations multiply sell value AND stats.",
    ],
  },
  battle: {
    title: "⚔️ Battle, Team, Bosses",
    lines: [
      "**Team** — `team add|remove|view <name>` *(default 3 slots, expand to 6 via `lowo shop team_slots`)*",
      "**Battle** — `battle`(b) [@user] — rewards 🪙 Battle Tokens.",
      "**Skill Battle** — `sb @user`, opponent `sb accept`, then `sba <skillId>`.",
      "**Coop World Boss** — spawns when 3+ players use lowo in 10m. `boss` view, `attackboss <skillId>`(ab) hit. **Top damage dealer on a kill is awarded a SUPREME boss-pet drop.**",
      "**Settings** — `battlesetting instant` • `rename <i> <name>` • `dismantle <i>`",
    ],
  },
  pets: {
    title: "🐾 Pets, Skills, Attributes",
    lines: [
      "**Pet Skills** — `skills <petId>` shows the skill tree. *(High-rarity pets render an image card.)*",
      "**Attributes** — every above-ethereal pet has a unique attribute (luck or team-stat boost) shown on `skills <petId>`.",
      "**Pet Skill Slots** — `skillshop` `learnskill <id>` `myskills` `petskills <pet>` `equipskill <pet> <slot 1-5> <skillId>`",
      "**Recycling + Fusion** — `recycle`(rec) `<name> [n|all]` → 🧬 Pet Materials. `materials`(mats) view count. `fuse <petA> + <petB>` combines 2 pets + 50 🧬 → random fusion pet (100 unique fusions).",
      "**💞 Sentient Pets (v6)** — `interact <pet>` *(play / talk)* raises mood & loyalty *(1h cd)* • `petmood [pet]` view stats • Devoted pets (loyalty ≥ 800) find hidden minerals/boxes on hunts.",
      "**🌟 Ascension (v6)** — `prestige <pet>` *(alias `ascend`)* — at level cap, costs 50,000 ✨ to reset Lv 1 with **DOUBLE one random stat forever**. Stack up to ×16 on a single stat.",
    ],
  },
  market: {
    title: "🛒 Global Marketplace (v6)",
    lines: [
      "**Browse** — `market` shows newest listings • `market search <rarity>` filters",
      "**Sell** — `market post <pet name> <price>` — 48h auto-expiry, 5% market tax, cap 10 per user",
      "**Buy** — `market buy <listingId>` — pet & dex transfer instantly",
      "**Manage** — `market mine` view yours • `market cancel <id>` pull a listing back",
    ],
  },
  gear: {
    title: "🛡️ Weapons, Armor, Mining, Craft",
    lines: [
      "**Weapons** — `weapon`(w) • `weapon rr <i>` *(reroll, 50 ✨)* • `crate` *(2500 cwn)*",
      "**Equip** — `equip <pet> [weapon|armor|accessory] <idx>` *(crafted: `c<idx>`)*",
      "**Mining** — `mine`(m) `minerals`(ore) `sellmineral <id> [n|all]` *(buy a Pickaxe first)*",
      "**Crafting** — `craft` (list) • `craft <recipeId>` (build)",
      "**Accessories** — 3rd equip slot, buy from `lowo shop pets`",
    ],
  },
  enchant: {
    title: "📕 Enchantments",
    lines: [
      "**List** — `enchant list` shows every tome and its essence cost.",
      "**Apply** — `enchant <petId> <enchantId>` — needs an unused tome from `lowo shop enchant` AND essence.",
      "**View** — `enchant view <petId>` shows the active enchant on that pet.",
      "**Tomes** — Blessed, Savage, Mystic, Swift, Eternal, Godslayer — six tiers from cheap stat boosts to +50% all-stats with team luck.",
    ],
  },
  shop: {
    title: "🛒 Shop & OP Items",
    lines: [
      "**Shop** — `shop [items|potions|events|equips|pets|mining|skills|gamepasses|essence|team_slots|enchant|op_expensive|premium]` `buy <id> [cash]`",
      "**OP Expensive** — `lowo shop op_expensive` — pet chests (`op_open <chestId>`), Attribute Seal (`reroll <petId>`), Dino Summon Stone, Essence Brick.",
      "**Team Slots** — `lowo shop team_slots` — buy 4th, 5th, and 6th team slots.",
      "**Backgrounds** — `setbg <id>` *(see `lowo shop pets` for available backgrounds)*",
      "**Boxes** — `box bronze|silver|gold` open • buy via `lowo buy bronze|silver|gold`",
    ],
  },
  social: {
    title: "💕 Social, Trade, Gambling, Misc",
    lines: [
      "**Social** — `hug|kiss|slap|pat|cuddle|poke @u` `propose @u` `divorce` `ship @a [@b]` `lowoify <text>`",
      "**Trade** — `trade @u` → `trade add cowoncy|essence|animal|weapon …` → both `trade confirm`",
      "**Gambling** — `slots <amt>` `coinflip h|t <amt>` `blackjack <amt>` `lottery info|buy <n>`",
      "**Pets/Garden** — `piku` `pikureset` `pet` `feed`",
      "**Mod** — `censor on|off` *(server admin)*",
      "**Utility** — `8b <q>` `roll` `choose a,b,c` `define <w>` `gif <q>` `pic` `math` `color` `ping` `stats`",
      "**Emotes** — `blush cry dance lewd pout shrug sleepy smile smug thumbsup wag thinking triggered teehee deredere thonking scoff happy grin`",
      "**Actions** — `lick nom stare highfive bite greet punch handholding tickle kill hold pats wave boop snuggle bully fuck`",
      "**Memes** — `spongebobchicken slapcar isthisa drake distractedbf communismcat eject emergencymeeting headpat tradeoffer waddle`",
    ],
  },
};

const HELP_INDEX = [
  "🦊 **LOWO COMMANDS** *(prefix: `lowo`)*",
  "Use `lowo help <category>` to view a section:",
  "",
  ...Object.entries(HELP_CATEGORIES).map(([k, v]) => `• \`lowo help ${k}\` — ${v.title}`),
  "",
  "_Tip: misspelled a command? I'll suggest the closest match._",
].join("\n");

function helpFor(cat: string): string {
  const c = HELP_CATEGORIES[cat];
  if (!c) return HELP_INDEX;
  return [`**${c.title}**`, "", ...c.lines].join("\n");
}

export async function handleLowoCommand(message: Message): Promise<boolean> {
  if (message.author.bot) return false;
  const content = message.content.trim();
  const lower = content.toLowerCase();
  if (!lower.startsWith("lowo ") && lower !== "lowo") return false;
  if (!isLowoEnabled()) return false;

  // Banned users cannot use any lowo commands
  if (getUser(message.author.id).lowoBanned) {
    await message.reply("🚫 You have been banned from using Lowo commands.").catch(() => {});
    return true;
  }

  const parts = content.split(/\s+/);
  parts.shift(); // remove "lowo"
  const sub = parts.shift()?.toLowerCase();
  const args = parts;

  if (!sub || sub === "help" || sub === "?") {
    const cat = (args[0] ?? "").toLowerCase();
    const text = cat ? helpFor(cat) : HELP_INDEX;
    const MAX = 1950;
    if (text.length <= MAX) {
      await message.reply(text);
    } else {
      let cut = text.lastIndexOf("\n\n", MAX);
      if (cut < 1000) cut = MAX;
      await message.reply(text.slice(0, cut));
      const ch = message.channel;
      if ("send" in ch) await ch.send(text.slice(cut).trim().slice(0, 1950)).catch(() => {});
    }
    return true;
  }
  const handler = HANDLERS[sub];
  if (!handler) {
    // Suggest the closest known command on misspellings.
    const known = Object.keys(HANDLERS);
    const matches = suggestClosest(sub, known, 3);
    const dyn = isDynamic(message.guildId);
    const dynTag = dyn ? "\n*(dynamic mode is on — extra suggestions enabled)*" : "";
    const suggestText = matches.length
      ? `\n💡 Did you mean: ${matches.map((m) => `\`lowo ${m}\``).join(", ")}?`
      : "";
    const reply = await message.reply(
      `❓ Unknown lowo command \`${sub}\`. Try \`lowo help\`.${suggestText}${dynTag}\n*(this message will self-delete)*`,
    ).catch(() => null);
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
