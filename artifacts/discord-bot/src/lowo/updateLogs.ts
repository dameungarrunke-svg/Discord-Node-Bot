import type { Message } from "discord.js";

export interface UpdateEntry {
  version: string;
  date: string;
  title: string;
  highlights: string[];
}

// Newest first.
export const UPDATE_LOGS: UpdateEntry[] = [
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

export async function cmdUpdateLogs(message: Message, args: string[]): Promise<void> {
  const filter = args[0]?.toLowerCase();
  const entries = filter ? UPDATE_LOGS.filter((e) => e.version.toLowerCase().includes(filter)) : UPDATE_LOGS;
  if (entries.length === 0) { await message.reply(`📭 No updates matching \`${filter}\`.`); return; }
  // Show only the newest entry in full; older entries get a one-line summary.
  const [latest, ...rest] = entries;
  const lines: string[] = [];
  lines.push(`📰 **Lowo Update Log — ${latest.version} (${latest.date})**`);
  lines.push(`### ${latest.title}`);
  for (const h of latest.highlights) lines.push(`• ${h}`);
  if (rest.length) {
    lines.push("");
    lines.push(`__Older versions__`);
    for (const e of rest) lines.push(`• \`${e.version}\` *(${e.date})* — ${e.title}`);
    lines.push(`Use \`lowo updatelogs <version>\` to read details.`);
  }
  await message.reply(lines.join("\n").slice(0, 1950));
}
