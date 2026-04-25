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
