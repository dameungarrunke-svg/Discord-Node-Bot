# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Discord bot**: discord.js 14, run from `artifacts/discord-bot`

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/discord-bot run dev` — run Discord bot locally

## Discord Bot Notes

- Requires `DISCORD_BOT_TOKEN` in Replit Secrets.
- Bot display name is managed on startup as `Last Stand Management`.
- Slash commands are acknowledged immediately with Discord.js `deferReply({ flags: MessageFlags.Ephemeral })`, then command handlers update the deferred reply with `editReply`.
- Kill leaderboard commands are separate from the original leaderboard: `/setupkillleaderboard`, `/addkillplayer`, `/editkillplayer`, `/removekillplayer`, and `/movek`.
- `/setupkillleaderboard` and `/setuprules` post in the channel where the command is run, so they can be placed from any eligible text channel without a channel picker.
- Kill leaderboard data is stored at `artifacts/discord-bot/data/kill-leaderboard.json`. Player cards use a clean Discord embed layout matching the reference image: rank/name title, Roblox username, Discord username, decorated unlabeled position text, kill count, stage, bottom divider GIF, and a right-side avatar thumbnail.
- Kill leaderboard stage options are: Stage 2 High Strong, Stage 2 High Stable, Stage 2 High Weak, Stage 2 Mid Strong, Stage 2 Mid Stable, and Stage 2 Mid Weak.
- `/tournament` creates a polished Last Stand / TSB tournament announcement with role ping, highlighted prize section, participant counter, and no public buttons. `/closetournamey` closes an existing tournament by ID, updates the embed status to Closed, and removes any old button components. Tournament data is stored at `artifacts/discord-bot/data/tournaments.json`.

## Lowo Subsystem (`artifacts/discord-bot/src/lowo/`)
- OwO-bot-style game system, prefix `lowo`. Toggled via `/lowoenable` / `/lowodisable`. Storage: `data/lowo.json` (debounced writes, auto-backfilled fields).
- Core modules: `storage`, `data` (animals/weapons/boxes/backgrounds/events/skill-curve/areas/minerals/accessories/active-skills/craft-recipes), `economy`, `hunt` (area-aware, pity, event boosts, area-unlock notifies), `battle` (3 equip slots: weapon/armor/accessory; crafted weapons via `c<idx>` prefix; Blood Moon ×1.5 dmg; shield-potion DEF buff), `skills` (per-animal XP & perks Lv 3/5/7/10), `shop` (8 categories: items/potions/events/equips/pets/mining/skills/premium; Shop Sale −20%), `extra` (autohunt 2-min interval + ½ luck via `isAutohuntActive`), `quests`, `social/actions/emotes`, `profile`, `profileCard` (per-bg patterns: stars/hex/waves/flames/sakura/dots/circuit/aurora), `events` (generic id-aware `eventBonus`), `cron`, `censor`, `toggle`, `slashCommands`, `router`.
- v3 modules: `areas` (`lowo area` switch + `refreshAreaUnlocks`; Forest→Volcanic→Space chained 100%-dex unlocks), `mine` (`lowo mine` + `minerals` + `sellmineral`; pickaxe tiers 0/1/2/3), `crafting` (`lowo craft` + 13 recipes), `petSkills` (5 slots/pet, `skillshop`/`learnskill`/`myskills`/`equipskill`/`petskills`), `skillBattle` (PvP: `sb @user` invite, `sba <skillId>` turn-based), `bosses` (`recordLowoActivity` per-command; auto-spawn when 3+ players use lowo within 10 min; `boss` + `attackboss <skillId>`), `aquarium` (`fish` now routes to `aquarium`+`fishDex`, view via `aquarium`+`fishdex`), `updateLogs` (`lowo updatelogs`), `emojis` (`data/lowo_emojis.json` custom-emoji override map).
- Content: 180+ animals across 3 areas with new rarities `inferno`/`cosmic`/`void`/`secret`. Pepsodent secret pet at 0.000045% (sells 5,000,000). Glitch Fox sell price 750,000 (typo fix). 18 accessories, 15 named active pet skills (Divine Killer Burst, Gamma Burst, Celestial Banisher, Void Lance, Arcues' Judgment …).
- 15 global events (10 new): Mineral Rush, Crafting Surge, Boss Invasion, Blood Moon, Skill Storm, Void Breach, Secret Whisper, Lucky Skies, Shop Sale, XP Bonanza.
- Cron is started inside the existing `Events.ClientReady` handler in `index.ts` (next to the weekly XP scheduler) — does NOT modify the bootstrap block. Stores keep using plain `readFileSync`/`writeFileSync` (no changes to `persistence.ts`, Dockerfile, or `railway.json`).
- New persisted files (auto-synced via `persistence.ts` data-dir watcher): `data/lowo_censor.json` (per-guild censor flag), `data/lowo_emojis.json` (optional custom emoji map).

## Mobile Leaderboard

A completely separate leaderboard for mobile players, stored in `artifacts/discord-bot/data/mobile-leaderboard.json`.

- `/setupmobileleaderboard` — Deploy the mobile leaderboard in the current channel
- `/addmobileplayer` — Add a player to the mobile leaderboard
- `/editmobileplayer` — Edit a mobile leaderboard player
- `/removemobileplayer` — Remove a player from the mobile leaderboard

Same design, layout, and styling as the PC leaderboard. Data is fully separate — no sharing or syncing between PC and mobile leaderboards.

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
