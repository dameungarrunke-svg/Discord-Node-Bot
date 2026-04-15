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

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
