import type { Message } from "discord.js";
import { getLowoMeta, updateLowoMeta } from "./storage.js";
import { baseEmbed, replyEmbed, warnEmbed, COLOR } from "./embeds.js";

export interface UpdateEntry {
  version: string;
  date: string;
  title: string;
  highlights: string[];
  /** When true, this entry stays HIDDEN from `lowo updatelogs` until an admin
   *  publishes it via `lowo update`. */
  pending?: boolean;
}

// The newest version we ship in code that is still "pending" until an admin
// types `lowo update`. Updated whenever we cut a new release.
export const LATEST_PENDING_VERSION = "v6.2";

// Newest first.
export const UPDATE_LOGS: UpdateEntry[] = [
  {
    version: "v6.2",
    date: "2026-04-30",
    title: "👾 LOWO: VOID CORRUPTIONS",
    pending: true,
    highlights: [
      "**🜏 THE VOID FORGE** — turn unwanted pets into raw 💎 **Void Shards**, then spend Shards + ✨ essence on equippable **Relics** that bend the world to your will.",
      "  • `lowo forge` — open the forge menu *(aliases `relic`, `relics`)*.",
      "  • `lowo forge smelt <pet> [count|all]` — burn pets into 💎 Shards. Rarer pets = more shards (Common 1 → Transcendent 520 → Secret 999).",
      "  • `lowo forge list` — full relic catalog & costs. `lowo forge owned` — your collection.",
      "  • `lowo forge craft <relic id>` — pay 💎 + ✨ to forge a relic.",
      "  • `lowo forge equip <relic id>` / `lowo forge unequip` — only **ONE** relic active at a time.",
      "**📜 RELICS** — pick your global buff:",
      "  • 🧭 **The Cursed Compass** — adds a hidden **+0.05% chance per hunt** to find a 🤫 SECRET pet.",
      "  • 👁️ **The Void Eye** — permanent **+10% Luck** on every hunt (stacks with potions / Arcues).",
      "  • 🌑 **Null Charm** — all pet sales return **+15% cowoncy**.",
      "  • 🪙 **Glitch Token** — sacrifices yield **+25% essence**.",
      "  • 💠 **Chaos Shard** — every hunt has a **+10% chance** to drop one bonus animal.",
      "  • ⚫ **Singularity Core** — lowers the corruption deletion risk from **5% → 2%**.",
      "  • ⚓ **Void Anchor** — catches in **The Infinite Void** grant **+25% bonus essence**.",
      "**👾 PET CORRUPTION** — drag a max-level pet into the void.",
      "  • `lowo corrupt <pet name>` — costs 💰 **1,000 cowoncy**. Each stat (HP/ATK/DEF/MAG) is rerolled to **1.0× — 3.0× of base**.",
      "  • **Risk:** **5% chance** the pet stack is permanently lost. Equipping the **Singularity Core** drops that to **2%**.",
      "  • Corrupted pets are tagged 👾 in `lowo zoo` and `lowo profile`.",
      "  • `lowo corrupt` (no args) lists every pet you've corrupted.",
      "  • 👑 **THE SINGULARITY** — corrupting **God Rithwik** creates *The Singularity*: **locked 3× on every stat**, no risk, ever.",
      "**🌑 NEW AREA — THE INFINITE VOID** *(Stage 6)* — **100 brand-new pets!**",
      "  • Unlock by completing **100% of every prior area's dex** *(Forest → Unknown Void)*.",
      "  • Filled with **100 unique boss-class pets** themed around Void-Dragons, Glitch-Spiders, Reality-Eaters, Shadow-Knights & Abyssal-Serpents.",
      "  • Every spawn is **EPIC rarity or higher** — Epic → Legendary → Mythic → Ethereal → Inferno → Cosmic → Void → 2 hidden **SECRETS** *(Void Sovereign and The Architect's Mistake)*.",
      "  • Stats are scaled **roughly 2× of Area-5 pets**. Epics start at **2,000 HP**; Secrets reach **15,000 HP / 1,200 ATK**.",
      "  • You can only hunt here with **at least one 👾 corrupted pet on your team** — standard pets are too weak to enter.",
      "  • Pair with the **Void Anchor** relic for **+25% essence** on every catch.",
      "**🜏 NEW: THE VOID SHOP** *(`lowo voidshop`)* — spend 💎 Shards on one-shot consumables:",
      "  • 🎣 **Void Lure** — `80 💎` — your next Infinite-Void hunt drops **+2 extra animals**.",
      "  • 🛡️ **Void Insurance** — `200 💎` — automatically saves the next failed corruption from deletion.",
      "  • Buy with `lowo voidshop buy <id> [qty]`.",
      "**🛒 PROFILE & ZOO**",
      "  • Corrupted pets show **👾** (or **⚫** for The Singularity) next to their name in `lowo zoo`.",
      "  • Pet stacks vanishing after a corruption fail also clean themselves out of your team automatically.",
    ],
  },
  {
    version: "v6.1",
    date: "2026-04-28",
    title: "🎨 LOWO: THE UI/UX OVERHAUL",
    pending: true,
    highlights: [
      "**🎨 EVERY COMMAND IS NOW A RICH EMBED** — one consistent, premium look across the whole bot.",
      "  • **Rarity-accent colors** — every embed picks a fixed hex by rarity (Legendary `#F97316`, Divine `#FDE047`, Void `#000000`, …).",
      "  • **Grid stat layouts** — inline fields instead of vertical text walls (your zoo, profile, hunt card, market all scan at a glance now).",
      "  • **Code-block values** — every number/currency wrapped in backticks for readability (`5,000 cowoncy`).",
      "  • **Custom progress bars** — `[▰▰▰▱▱▱▱▱▱▱]` style on **pity**, **XP**, **mood**, **loyalty**, **daily-streak cycle**.",
      "  • **Session footer everywhere** — every reply footers your live stats (`Hunts • Cwn • Ess • Cash • Pets`).",
      "  • **Thumbnails** — your avatar in the top-right of profile / zoo / wallet embeds.",
      "  • **✨ NEW CATCH ✨ Catch Cards** — `lowo hunt` now ships a rarity-colored card with the animal's emoji, stats, mutation tag, and pity/auto-sold flags. Multi-catches get a stats grid.",
      "**🛒 SHOP MAIN MENU = BUTTONS** — `lowo shop` opens a clickable Action Row with **Items / Equips / Pets / Premium / Gamepasses / Events / Essence / Mining / Skills / Team Slots**. Buttons are scoped to the invoker.",
      "**🃏 HOLOGRAPHIC PET CARDS** — `Divine` and `Omni` rarity pet cards now render with a **holographic shimmer overlay** plus a *gamer-styled* heading on the canvas (Orbitron-style fallback).",
      "**🔒 ADMIN-GATE FEEDBACK** — `lowo update` now explains *why* you're blocked (and how to fix `LOWO_OWNER_ID` on Railway) instead of pretending to be an unknown command.",
      "**✅/❌ INTERACTION FEEDBACK** — successes start with ✅ / ✨, errors with ❌ / ⚠️, utility errors auto-delete after **8 seconds** to keep channels tidy.",
      "**🧠 BUILT ON A SHARED `embeds.ts` LIBRARY** — every future command is one helper call away from looking like the rest. No more visual drift.",
    ],
  },
  {
    version: "v6.0",
    date: "2026-04-28",
    title: "🕳️ LOWO: VOID ASCENSION UPDATE",
    pending: true,
    highlights: [
      "**🐾 SENTIENT PETS** — pets now have **moods** and **loyalty**.",
      "  • `lowo interact <pet>` *(aliases `play` / `talk`)* — feed them attention. **+15 mood, +10 loyalty** per interaction. **1h cooldown per pet**.",
      "  • `lowo petmood [pet]` — view a single pet's stats or your top-loyal roster.",
      "  • Hunting with a pet on your team raises its mood/loyalty too.",
      "  • Pets at **Loyalty ≥ 800** become 💖 **Devoted** — every hunt has a **0.5% chance per devoted pet** to find a hidden mineral or box for you.",
      "**🌟 PET ASCENSION (PRESTIGE)** — push a pet past the cap.",
      "  • `lowo prestige <pet>` *(alias `ascend`)* — costs **50,000 ✨ essence**, requires the pet to be at the **level cap**.",
      "  • Pet resets to **Lv 1** but gains a **Permanent Mutation** that **doubles ONE random stat (HP / ATK / DEF / MAG) forever**.",
      "  • Stack ascensions on the same pet — capped at **×16** on a single stat to keep things sane.",
      "  • `lowo prestige` (no args) lists every pet you've ascended.",
      "**🗺️ AREA TRAITS** — areas now affect gameplay mechanically.",
      "  • 🌋 **Volcanic** — Fire-type pets gain **+20% ATK** in battle. Hunt cooldown **+2s** *(heat penalty)*.",
      "  • ☁️ **Heaven** — Hunt luck **+10%**, but sacrifices return **−20% essence** *(it's a holy place!)*.",
      "  • 🕳️ **Unknown Void** — All battle stats are **hidden** during fights. Feel the fight.",
      "  • View traits any time with `lowo area`.",
      "**🛒 GLOBAL MARKETPLACE** — async player-to-player trading at last.",
      "  • `lowo market` — browse all listings *(newest first)*.",
      "  • `lowo market post <pet name> <price>` — list a pet for cowoncy. **48h auto-expiry**.",
      "  • `lowo market search <rarity>` — filter by rarity (e.g. `epic`, `mythic`, `secret`).",
      "  • `lowo market buy <id>` — buy instantly. **5% market tax** on the seller.",
      "  • `lowo market mine` / `lowo market cancel <id>` — manage your listings.",
      "  • Each user can have up to **10 active listings**. Expired listings refund the pet to your zoo.",
      "**🦊 EASTER EGG — HUNGRY BOT** — if you forgot to claim `lowo daily`, the bot has a **1% chance** to *snatch your catch* and tease you about it. Keep your daily streak alive!",
      "**🛡️ ADMIN TOOLS**",
      "  • `lowo update` — **publish** the latest pending update entry to your server *(admin only)*. Until you publish, this entry stays hidden from `lowo updatelogs`.",
      "  • `lowo checkmarket` — list every active marketplace listing across the server *(admin)*.",
      "  • `lowo clearlistings` — wipe the marketplace and refund every pet to its seller *(admin)*.",
    ],
  },
  {
    version: "v5.1",
    date: "2026-04-27",
    title: "🩹 HOTFIX — QoL & Major Bug Sweep",
    highlights: [
      "**✨ ADDED**",
      "  • **Above-Omni catch bonus** — every animal of a rarity *strictly above Omni* (Divine/Glitched/Inferno/Cosmic/Void/Transcendent/Supreme/Secret) now drops **+1 🪙 Lowo Cash** the moment you catch it. The classic *50-hunt = +1 Lowo Cash* milestone is unchanged.",
      "  • **`lowo autosell <rarity>`** — toggle a rarity ON or OFF. Anything you catch of that rarity is auto-sold for cowoncy on the spot (Dex still credits!). Use `lowo autosell list` / `lowo autosell clear`. Aliases: `lowo as`.",
      "  • **`lowo bulk sell <rarity>`** — sell every animal of a rarity in your zoo at once. Aliases: `lowo bulksell <rarity>`.",
      "  • **`lowo dex <area>`** — filter your dex by area. Use `1` Forest / `2` Volcanic / `3` Space / `4` Heaven / `5` Unknown Void (or the area name). Now grouped by rarity and auto-paginated.",
      "  • **`lowo animalstat <name>`** — quick lookup: sell price, essence value, damage range, HP/DEF/MAG, and the unique signature ability. Aliases: `lowo astat`, `lowo animal`, `lowo info`.",
      "  • **Profile potion timers** — `lowo profile` now lists every active buff with remaining time (Luck, Mega Luck, Haste, Shield, Dino Summon).",
      "**🐛 FIXED**",
      "  • **Luck bonuses now stack additively** — Arcues +5%, Luck Potion +10%, Mega Luck +25% combine to **+40%** (was multiplicative & confusing). Autohunt nerf still applies after.",
      "  • **`lowo shop` truncation** — categories with 27+ items (e.g. Premium / OP) were silently cut off at ~20. Output is now chunked into multiple messages so the full catalog always shows.",
      "  • **Team-slot purchases** — buying `team_slot_1/2/3` now correctly raises your team cap (3 → 6) instead of silently doing nothing.",
      "  • **OP chest purchases** — `op_pet_chest`, `op_god_chest`, `op_void_chest`, `op_attribute_seal` now actually land in your inventory and can be opened with `lowo op_open`.",
      "  • **OP Dino Summon Stone, OP Essence Brick, all enchant tomes** — now apply correctly when bought.",
      "  • **`lowo level` random jumps** — XP formula no longer counts current cowoncy/essence (which spend down). Replaced with a monotonic mix of total hunts, boss kills, dex completion and accumulated pet XP — your level can no longer go DOWN after a big spend.",
    ],
  },
  {
    version: "v4.0",
    date: "2026-04-26",
    title: "✨ THE NEW ERA",
    highlights: [
      "**🎫 GAMEPASSES SHOP** — 12 permanent perks. Pay with cowoncy *or* Lowo Cash (use `lowo buy <id> cash`):",
      "  • **Double Luck Pass** ×2 luck on all hunts/fishing.",
      "  • **Secret Hunter Pass** secret-pet drop chance ×10.",
      "  • **Auto-Hunt Upgrade** autohunt ticks every 1 min instead of 2.",
      "  • **Triple Drop Pass** 25% chance for a bonus animal every hunt.",
      "  • **Pity Pro** pity threshold halved (200 → 100).",
      "  • **Battle Master** +50% Battle Token rewards.",
      "  • **Mythic Tracker** mythic+ rarity weight ×2 every hunt.",
      "  • **Coin Magnet** +50% cowoncy from selling animals.",
      "  • **VIP Shop Card** −10% on all cowoncy shop prices.",
      "  • **Crate Lover** +1 bonus weapon roll per paid crate.",
      "  • **Event Enthusiast** personal events run 2× as long.",
      "  • **Essence Master** +50% essence from sacrifices.",
      "**✨ ESSENCE SHOP** — 11 OP items bought with ✨ essence: Legendary Crate, Pity Wipe, Random Legendary, Mystery Fusion Pet, Skill Tome, Battle Token Bundle, Lowo Cash Bundle, Pet Materials Bundle, Mega Luck (2h), Secret Whisper Token, Godsave Insurance.",
      "**🎯 10+ NEW EVENT-SHOP SCROLLS** — Double Hunt, Rare Rush, Essence Storm, Battle Frenzy, Mineral Rush, Lucky Skies, Blood Moon, Skill Storm, Shop Sale, XP Bonanza, Void Breach, Secret Whisper.",
      "**🪙 BATTLE TOKENS** — `lowo battle` no longer rewards cowoncy. Wins now grant a brand-new **🪙 Battle Token** currency *(future use coming — earn now to bank!)*.",
      "**🤫 SECRET PET — INTERNET 🌐** — even rarer than Pepsodent (0.000010% chance per hunt or fish). Sells for **6,700,000** cowoncy. Tracked by `lowo dex`.",
      "**🐟 30 NEW FISH** — full new fish roster across the rarity tiers, viewable via `lowo fishdex`.",
      "**🧬 PET RECYCLING + 100-PET FUSION** — `lowo recycle <name>` breaks pets down into 🧬 Pet Materials. `lowo fuse <petA> + <petB>` (50 🧬) produces a random fusion pet from a roster of **100** brand-new fusion pets (e.g. Tiger-Fox, Wolf-Owl Lord, Dragon-Phoenix Spirit, Hydra-Inferno King…).",
      "**🖼️ 10 NEW BACKGROUNDS** — Void Realm, Galaxy, Pixel Art, Blood Moon, Crystal Cave, Neon City, Zen Garden, **Internet Era** *(Lowo Cash exclusive)*, Supernova, Oblivion.",
      "**📚 ONE-BLOCK HELP** — `lowo help` is now a single message containing every command. No more pages.",
      "**🧹 AUTO-DELETE UNKNOWN COMMANDS** — typo replies vanish after 8 seconds to keep channels tidy.",
      "**🐛 STAGE-HUNT BUG FIXED** — if your hunt area gets stuck on a region you haven't unlocked, the bot now snaps you back to Forest automatically. Hunts will never silently fail again.",
      "**🛡️ DEX & ZOO PERSISTENCE** — listings stay visible permanently — they no longer auto-delete or get reaped.",
      "**📦 STILL HERE** — everything from v3.0 (areas, mining, crafting, pet skill slots, PvP skill battles, world bosses, aquarium, accessories) is unchanged.",
    ],
  },
  {
    version: "v3.0",
    date: "2026-04-25",
    title: "🌌 The Universe Update",
    highlights: [
      "**Three hunt areas:** Forest (default), Volcanic 🌋 and Space 🌌. Switch with `lowo area`.",
      "**Area unlocks:** Volcanic unlocks at 100% Forest dex. Space unlocks at 100% Volcanic dex.",
      "**180+ animals** across all areas with brand-new tiers: 🔥 INFERNO, 🌌 COSMIC, 🕳️ VOID.",
      "**Pepsodent 🦷** — secret rarity with a **0.000045%** drop in any area. Sells for 5,000,000 cowoncy.",
      "**Mining + Crafting:** `lowo mine` for 14 mineral types, `lowo craft` for 13 weapon recipes.",
      "**Pet Skill Slots:** every pet has 5 skill slots. New named actives: Divine Killer Burst 🌟, Gamma Burst 💥, Celestial Banisher ✨, Void Lance 🕳️ and more.",
      "**Skill Battles (PvP):** challenge anyone with `lowo sb @user`, then attack their pets turn-by-turn. Winner takes a slice of the loser's wallet.",
      "**Coop World Bosses:** when 3+ players use lowo within 10 minutes, a boss spawns. Hit it with `lowo attackboss <skill>`. Top damager wins big.",
      "**3rd Pet Equip Slot:** Accessories — collars, halos, jet packs, void sigils. 18 items in the new `pets` shop category.",
      "**Aquarium:** fish are no longer thrown in your zoo — they swim in your aquarium. `lowo aquarium`.",
      "**Designed Backgrounds:** profile cards now render patterns (stars, hex, waves, flames, sakura, aurora, circuits).",
      "**More Random Events:** 10 new global events incl. Mineral Rush ⛏️, Boss Invasion 👹, Skill Storm 🌟, Void Breach 🕳️, Secret Whisper 🤫.",
      "**Autohunt Nerf:** runs every 2 minutes (was 1) and your effective luck is halved while it's running.",
      "**Custom Emojis:** drop a `data/lowo_emojis.json` to override emojis with your server's custom ones.",
      "**Fixes:** Glitch Fox 🟥🦊 sells for 750,000 cowoncy (was a typo at 99,999). Higher shop prices to match new economy.",
      "**Updates view:** type `lowo updatelogs` any time to see this list.",
    ],
  },
  {
    version: "v2.0",
    date: "2026-03-15",
    title: "✨ The Foundations Update",
    highlights: [
      "Per-animal skill trees & XP grinding.",
      "Daily streaks, lottery system, fishing, marriage system.",
      "Profile cards, leaderboards, lottery, daily quests.",
      "Tiered loot crates and weapon rerolls.",
    ],
  },
  {
    version: "v1.0",
    date: "2026-02-01",
    title: "🦊 Lowo is born",
    highlights: [
      "Hunt, battle, zoo, dex, cowoncy economy, basic shop.",
    ],
  },
];

// ─── Release-gate helpers ────────────────────────────────────────────────────
function isReleased(entry: UpdateEntry): boolean {
  if (!entry.pending) return true;
  return getLowoMeta().releasedVersions.includes(entry.version);
}

/** Returns the visible entries for `lowo updatelogs` (releases hidden until published). */
export function visibleEntries(): UpdateEntry[] {
  return UPDATE_LOGS.filter(isReleased);
}

/** Find the latest pending entry that has not yet been published. */
export function latestPendingEntry(): UpdateEntry | null {
  for (const e of UPDATE_LOGS) {
    if (e.pending && !isReleased(e)) return e;
  }
  return null;
}

/** Mark a version as released. Idempotent. */
export function markReleased(version: string): void {
  updateLowoMeta((m) => {
    if (!m.releasedVersions.includes(version)) m.releasedVersions.push(version);
  });
}

/** Format a single update entry for posting. */
export function formatEntryFull(entry: UpdateEntry): string {
  const lines: string[] = [];
  lines.push(`📰 **Lowo Update Log — ${entry.version} (${entry.date})**`);
  lines.push(`### ${entry.title}`);
  for (const h of entry.highlights) lines.push(`• ${h}`);
  return lines.join("\n");
}

export async function cmdUpdateLogs(message: Message, args: string[]): Promise<void> {
  const filter = args[0]?.toLowerCase();
  const visible = visibleEntries();
  const entries = filter ? visible.filter((e) => e.version.toLowerCase().includes(filter)) : visible;
  if (entries.length === 0) {
    await replyEmbed(message, warnEmbed(message, "No Updates Found", `No updates matching \`${filter ?? ""}\`.`));
    return;
  }
  const [latest, ...rest] = entries;
  const e = baseEmbed(message, COLOR.brand)
    .setTitle(`📰 ${latest.title}`)
    .setDescription(`**Version:** \`${latest.version}\`  •  **Date:** \`${latest.date}\``);
  // Group highlights into chunks of <=1024 chars (field-value cap).
  let buf = "";
  let group = 1;
  const flush = (): void => {
    if (!buf) return;
    e.addFields({ name: `Highlights ${group > 1 ? `(${group})` : ""}`.trim(), value: buf.slice(0, 1024), inline: false });
    buf = ""; group += 1;
  };
  for (const h of latest.highlights) {
    const line = `• ${h}\n`;
    if (buf.length + line.length > 1000) flush();
    buf += line;
  }
  flush();
  if (rest.length) {
    const olderLines = rest.map((r) => `• \`${r.version}\` *(${r.date})* — ${r.title}`).join("\n");
    e.addFields({ name: "Older Versions", value: `${olderLines.slice(0, 950)}\n\n_Use \`lowo updatelogs <version>\` to read details._`, inline: false });
  }
  await replyEmbed(message, e);
}
