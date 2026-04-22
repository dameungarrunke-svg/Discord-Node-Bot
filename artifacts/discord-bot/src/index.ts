import {
  Client,
  GatewayIntentBits,
  Events,
  Message,
  Interaction,
  Routes,
  ChatInputCommandInteraction,
  ButtonInteraction,
  StringSelectMenuInteraction,
  MessageFlags,
  REST,
} from "discord.js";
import http from "http";
import { initPersistence, flushAll } from "./persistence.js";

import { data as setupPanelData, execute as setupPanelExecute } from "./commands/setupChallengePanel.js";
import { handleCreateTicket } from "./tickets/ticketFlow.js";
import { handleCloseTicket, handleDeleteTicket } from "./tickets/ticketControls.js";
import {
  setupLeaderboardData,
  addPlayerData,
  removePlayerData,
  editPlayerData,
  executeAddPlayer,
  executeRemovePlayer,
  executeEditPlayer,
} from "./leaderboard/commands.js";
import { executeSetupLeaderboard } from "./leaderboard/display.js";
import {
  setupMobileLeaderboardData,
  addMobilePlayerData,
  removeMobilePlayerData,
  editMobilePlayerData,
  executeAddMobilePlayer,
  executeRemoveMobilePlayer,
  executeEditMobilePlayer,
} from "./leaderboard/mobileCommands.js";
import { executeSetupMobileLeaderboard } from "./leaderboard/mobileDisplay.js";
import {
  executeSetupKillLeaderboard,
  refreshPinnedKillLeaderboard,
  setupKillLeaderboardData,
} from "./killLeaderboard/display.js";
import {
  addKillPlayerData,
  editKillPlayerData,
  moveKillPlayerData,
  removeKillPlayerData,
  executeAddKillPlayer,
  executeEditKillPlayer,
  executeMoveKillPlayer,
  executeRemoveKillPlayer,
} from "./killLeaderboard/commands.js";

import { startRaidData, executeStartRaid, endRaidData, executeEndRaid } from "./raids/index.js";
import {
  rankData, executeRank,
  leaderboardLevelData, executeLeaderboard,
  weeklyLbData, executeWeeklyLb,
  addXpData, executeAddXp,
  removeXpData, executeRemoveXp,
  setXpData, executeSetXp,
  resetXpData, executeResetXp,
  exportDataData, executeExportData,
  setLevelRoleData, executeSetLevelRole,
  removeLevelRoleData, executeRemoveLevelRole,
  setXpCooldownData, executeSetXpCooldown,
  setXpRangeData, executeSetXpRange,
  setXpChannelData, executeSetXpChannel,
  setMultiplierData, executeSetMultiplier,
  blacklistChannelData, executeBlacklistChannel,
  whitelistChannelData, executeWhitelistChannel,
  xpConfigData, executeXpConfig,
  levelRolesData, executeLevelRoles,
  startLsXpSystemData, executeStartLsXpSystem,
  stopLsXpSystemData, executeStopLsXpSystem,
} from "./leveling/commands.js";
import { processMessage } from "./leveling/engine.js";
import { startWeeklyResetScheduler } from "./leveling/weekly.js";
import { startTrainingData, executeStartTraining, endTrainingData, executeEndTraining } from "./training/index.js";
import {
  announceData, executeAnnounce,
  warnData, executeWarn,
  promoteData, executePromote,
  demoteData, executeDemote,
  attendanceData, executeAttendance,
  pollData, executePoll,
  mvpData, executeMvp,
  suggestionData, executeSuggestion,
} from "./utility/index.js";
import { setupRulesData, executeSetupRules } from "./rules/index.js";
import {
  dashboardData,
  executeDashboard,
  handleDashboardButton,
  handleDashboardSelect,
} from "./leveling/dashboard.js";
import {
  closeTournamentData,
  executeCloseTournament,
  executeTournament,
  tournamentData,
} from "./tournament/index.js";
import {
  censorData,
  executeCensor,
  stopcensorData,
  executeStopCensor,
} from "./moderation/commands.js";
import { handleModerationMessage } from "./moderation/monitor.js";
import { scan } from "./moderation/detector.js";

const token = process.env.DISCORD_BOT_TOKEN ?? process.env.DISCORD_TOKEN;
if (!token) {
  console.error("DISCORD_BOT_TOKEN is not set. Exiting.");
  process.exit(1);
}

const BOT_DISPLAY_NAME = "Last Stand Management";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions,
  ],
});

// Pre-warmed REST client — same undici connection pool, no TLS cold-start per interaction
const rest = new REST({ version: "10" }).setToken(token);

const commands = [
  setupPanelData.toJSON(),
  setupLeaderboardData.toJSON(),
  addPlayerData.toJSON(),
  removePlayerData.toJSON(),
  editPlayerData.toJSON(),
  setupMobileLeaderboardData.toJSON(),
  addMobilePlayerData.toJSON(),
  removeMobilePlayerData.toJSON(),
  editMobilePlayerData.toJSON(),
  setupKillLeaderboardData.toJSON(),
  addKillPlayerData.toJSON(),
  editKillPlayerData.toJSON(),
  removeKillPlayerData.toJSON(),
  moveKillPlayerData.toJSON(),
  startRaidData.toJSON(),
  endRaidData.toJSON(),
  startTrainingData.toJSON(),
  endTrainingData.toJSON(),
  announceData.toJSON(),
  warnData.toJSON(),
  promoteData.toJSON(),
  demoteData.toJSON(),
  attendanceData.toJSON(),
  pollData.toJSON(),
  mvpData.toJSON(),
  suggestionData.toJSON(),
  setupRulesData.toJSON(),
  tournamentData.toJSON(),
  closeTournamentData.toJSON(),
  censorData.toJSON(),
  stopcensorData.toJSON(),
  rankData.toJSON(),
  leaderboardLevelData.toJSON(),
  weeklyLbData.toJSON(),
  addXpData.toJSON(),
  removeXpData.toJSON(),
  setXpData.toJSON(),
  resetXpData.toJSON(),
  exportDataData.toJSON(),
  setLevelRoleData.toJSON(),
  removeLevelRoleData.toJSON(),
  setXpCooldownData.toJSON(),
  setXpRangeData.toJSON(),
  setXpChannelData.toJSON(),
  setMultiplierData.toJSON(),
  blacklistChannelData.toJSON(),
  whitelistChannelData.toJSON(),
  xpConfigData.toJSON(),
  levelRolesData.toJSON(),
  startLsXpSystemData.toJSON(),
  stopLsXpSystemData.toJSON(),
  dashboardData.toJSON(),
];

// Defined once at startup — not recreated on every interaction
const slashHandlers: Record<string, (i: ChatInputCommandInteraction) => Promise<void>> = {
  setupchallengepanel: setupPanelExecute,
  setupleaderboard: (i) => executeSetupLeaderboard(i, client),
  addleaderboardplayer: (i) => executeAddPlayer(i, client),
  removeleaderboardplayer: (i) => executeRemovePlayer(i, client),
  editleaderboardplayer: (i) => executeEditPlayer(i, client),
  setupmobileleaderboard: (i) => executeSetupMobileLeaderboard(i, client),
  addmobileplayer: (i) => executeAddMobilePlayer(i, client),
  removemobileplayer: (i) => executeRemoveMobilePlayer(i, client),
  editmobileplayer: (i) => executeEditMobilePlayer(i, client),
  setupkillleaderboard: (i) => executeSetupKillLeaderboard(i, client),
  addkillplayer: (i) => executeAddKillPlayer(i, client),
  editkillplayer: (i) => executeEditKillPlayer(i, client),
  removekillplayer: (i) => executeRemoveKillPlayer(i, client),
  movek: (i) => executeMoveKillPlayer(i, client),
  startraid: executeStartRaid,
  endraid: executeEndRaid,
  starttraining: executeStartTraining,
  endtraining: executeEndTraining,
  announce: executeAnnounce,
  warn: executeWarn,
  promote: executePromote,
  demote: executeDemote,
  attendance: executeAttendance,
  poll: executePoll,
  mvp: executeMvp,
  suggestion: executeSuggestion,
  setuprules: executeSetupRules,
  tournament: executeTournament,
  closetournamey: executeCloseTournament,
  censor: executeCensor,
  stopcensor: executeStopCensor,
  rank: executeRank,
  levellb: executeLeaderboard,
  weeklylb: executeWeeklyLb,
  addxp: executeAddXp,
  removexp: executeRemoveXp,
  setxp: executeSetXp,
  resetxp: executeResetXp,
  exportdata: executeExportData,
  setlevelrole: executeSetLevelRole,
  removelevelrole: executeRemoveLevelRole,
  setxpcooldown: executeSetXpCooldown,
  setxprange: executeSetXpRange,
  setxpchannel: executeSetXpChannel,
  setmultiplier: executeSetMultiplier,
  blacklistchannel: executeBlacklistChannel,
  whitelistchannel: executeWhitelistChannel,
  xpconfig: executeXpConfig,
  levelroles: executeLevelRoles,
  startlsxpsystem: executeStartLsXpSystem,
  stoplsxpsystem: executeStopLsXpSystem,
  dashboard: executeDashboard,
};

const buttonHandlers: Record<string, (i: ButtonInteraction) => Promise<void>> = {
  create_challenge_ticket: handleCreateTicket,
  close_ticket: handleCloseTicket,
  delete_ticket: handleDeleteTicket,
};

async function registerCommandsForGuild(guildId: string): Promise<void> {
  try {
    await rest.put(Routes.applicationGuildCommands(client.user!.id, guildId), {
      body: commands,
    });
    console.log(`[READY] Commands registered for guild: ${guildId}`);
  } catch (err) {
    console.error(`[ERROR] Failed to register commands for guild ${guildId}:`, err);
  }
}

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`[READY] Logged in as ${readyClient.user.tag}`);
  console.log(`[READY] Guilds in cache: ${readyClient.guilds.cache.size}`);

  if (readyClient.user.username !== BOT_DISPLAY_NAME) {
    try {
      await readyClient.user.setUsername(BOT_DISPLAY_NAME);
      console.log(`[READY] Bot username set to ${BOT_DISPLAY_NAME}`);
    } catch (err) {
      console.error("[ERROR] Failed to update bot username:", err);
    }
  }

  // Pre-warm the REST connection to Discord so the first interaction ack is fast
  try {
    await rest.get(Routes.gateway());
    console.log("[READY] REST connection pre-warmed.");
  } catch {
    // Non-critical — just a warm-up
  }

  try {
    await rest.put(Routes.applicationCommands(readyClient.user.id), { body: [] });
    console.log("[READY] Cleared all global application commands (using guild-only registration).");
  } catch (err) {
    console.error("[ERROR] Failed to clear global commands:", err);
  }

  const PRIMARY_GUILD_ID = "1479910330669990025";

  for (const [guildId] of readyClient.guilds.cache) {
    try {
      if (guildId === PRIMARY_GUILD_ID) {
        await rest.put(Routes.applicationGuildCommands(readyClient.user.id, guildId), { body: commands });
        console.log(`[READY] Registered ${commands.length} commands instantly to primary guild: ${guildId}`);
      } else {
        await rest.put(Routes.applicationGuildCommands(readyClient.user.id, guildId), { body: [] });
        console.log(`[READY] Cleared guild-scoped commands for: ${guildId} (now using globals).`);
      }
    } catch (err) {
      console.error(`[ERROR] Failed to set guild commands for ${guildId}:`, err);
    }

    try {
      const guild = await readyClient.guilds.fetch(guildId);
      const me = await guild.members.fetchMe();
      if (me.displayName !== BOT_DISPLAY_NAME) {
        await me.setNickname(BOT_DISPLAY_NAME);
        console.log(`[READY] Bot nickname set for guild: ${guildId}`);
      }
    } catch (err) {
      console.error(`[ERROR] Failed to update bot nickname for guild ${guildId}:`, err);
    }
  }

  try {
    await refreshPinnedKillLeaderboard(client);
    console.log("[READY] Kill leaderboard refreshed.");
  } catch (err) {
    console.error("[ERROR] Failed to refresh kill leaderboard:", err);
  }

  // ── Censor self-test ──────────────────────────────────────────────────────
  // Runs every startup to confirm the scanner correctly catches known bypasses.
  {
    const MUST_FLAG: [string, string][] = [
      ["Niggeer",   "extended vowel (ee)"],
      ["Niggerrr",  "extended consonant (rrr)"],
      ["Fuckslang", "compound: fuck prefix"],
      ["Fuckface",  "compound: fuck prefix"],
      ["Choicefuck","compound: fuck suffix"],
      ["Assfuck",   "compound: fuck suffix"],
      ["Lotffuck",  "compound: fuck suffix"],
      ["Retarded",  "exact slur"],
      ["niqqer",    "q-for-g bypass"],
      ["nikker",    "k-for-g bypass"],
      ["n.i.g.g.e.r","separator bypass"],
      ["phuck",     "ph→f bypass"],
      ["f.u.c.k.i.n.g", "separator bypass: fucking"],
    ];
    const MUST_PASS: string[] = [
      "Niger", "Nigeria", "snicker", "trigger", "flicker", "ticker",
    ];
    let passed = 0;
    let failed = 0;
    for (const [word, desc] of MUST_FLAG) {
      const result = scan(word);
      if (result) {
        console.log(`[SCAN-TEST] ✅ CAUGHT   "${word}" (${desc}) via ${result.method}: ${result.matchedTerm}`);
        passed++;
      } else {
        console.error(`[SCAN-TEST] ❌ MISSED   "${word}" (${desc}) — bypass NOT detected`);
        failed++;
      }
    }
    for (const word of MUST_PASS) {
      const result = scan(word);
      if (!result) {
        console.log(`[SCAN-TEST] ✅ ALLOWED  "${word}" (safe word, correctly not flagged)`);
        passed++;
      } else {
        console.error(`[SCAN-TEST] ⚠️ FALSE+   "${word}" was incorrectly flagged as "${result.matchedTerm}" (${result.method})`);
        failed++;
      }
    }
    console.log(`[SCAN-TEST] Result: ${passed} passed, ${failed} failed.`);
  }

  // Start weekly XP reset scheduler
  startWeeklyResetScheduler(readyClient);

  if (readyClient.guilds.cache.size === 0) {
    console.warn("[WARN] No guilds in cache — bot may not be in any server.");
  }
});

client.on(Events.GuildCreate, async (guild) => {
  try {
    const me = await guild.members.fetchMe();
    if (me.displayName !== BOT_DISPLAY_NAME) {
      await me.setNickname(BOT_DISPLAY_NAME);
    }
  } catch (err) {
    console.error(`[ERROR] Failed to set nickname for new guild ${guild.id}:`, err);
  }
});

// Log gateway disconnects/reconnects so we know if the WebSocket drops
client.on(Events.ShardDisconnect, (event, shardId) => {
  console.warn(`[GATEWAY] Shard ${shardId} DISCONNECTED — code ${event.code}`);
});
client.on(Events.ShardReconnecting, (shardId) => {
  console.log(`[GATEWAY] Shard ${shardId} reconnecting...`);
});
client.on(Events.ShardResume, (shardId, replayed) => {
  console.log(`[GATEWAY] Shard ${shardId} RESUMED (replayed ${replayed} events)`);
});

client.on(Events.MessageCreate, async (message: Message) => {
  if (message.author.bot) return;

  // Live moderation — runs before prefix commands
  handleModerationMessage(message, client).catch((err) =>
    console.error("[MODERATION] Unhandled error:", err)
  );

  // XP leveling system
  processMessage(message, client).catch((err) =>
    console.error("[LEVELING] Unhandled error:", err)
  );

  const content = message.content.trim();

  if (content === "!ping") {
    await message.reply("Pong!");
  } else if (content === "!hello") {
    await message.reply(`Hello, ${message.author.username}!`);
  } else if (content === "!help") {
    await message.reply(
      "**Available commands:**\n" +
      "`!ping` — Check if the bot is alive\n" +
      "`!hello` — Say hello\n" +
      "`!help` — Show this help message\n\n" +
      "**Slash Commands:**\n" +
      "`/setupchallengepanel` — *(Admin)* Deploy the challenge ticket panel\n" +
      "`/setupleaderboard` — *(Admin)* Deploy the leaderboard\n" +
      "`/addleaderboardplayer` — *(Admin)* Add a player to the leaderboard\n" +
      "`/removeleaderboardplayer` — *(Admin)* Remove a player from the leaderboard\n" +
      "`/editleaderboardplayer` — *(Admin)* Edit a leaderboard player\n" +
      "`/startraid` — *(Admin)* Announce a raid\n" +
      "`/endraid` — *(Admin)* End a raid and log results\n" +
      "`/starttraining` — *(Admin)* Announce a training session\n" +
      "`/endtraining` — *(Admin)* End a training and log results\n" +
      "`/announce` — *(Admin)* Post an announcement\n" +
      "`/warn` — *(Mod)* Warn a member\n" +
      "`/promote` — *(Admin)* Promote a member\n" +
      "`/demote` — *(Admin)* Demote a member\n" +
      "`/attendance` — *(Mod)* Mark a member's attendance\n" +
      "`/poll` — *(Mod)* Create a community poll\n" +
      "`/mvp` — *(Mod)* Award MVP to a member\n" +
      "`/suggestion` — Submit a suggestion\n" +
      "`/setuprules` — *(Admin)* Deploy the clan rulebook\n" +
      "`/tournament` — *(Admin)* Launch a TSB tournament\n" +
      "`/closetournamey` — *(Admin)* Close a TSB tournament"
    );
  }
});

client.on(Events.InteractionCreate, async (interaction: Interaction) => {
  if (interaction.isChatInputCommand()) {
    const cmd = interaction as ChatInputCommandInteraction;
    const t0 = Date.now();
    console.log(`[INTERACTION] /${cmd.commandName} received`);

    const PUBLIC_COMMANDS = new Set(["levellb", "weeklylb", "rank"]);
    const isPublic = PUBLIC_COMMANDS.has(cmd.commandName);
    try {
      if (isPublic) {
        await cmd.deferReply();
      } else {
        await cmd.deferReply({ flags: MessageFlags.Ephemeral });
      }
    } catch (err) {
      console.error(`[INTERACTION] /${cmd.commandName} — defer failed, cannot respond`, err);
      return;
    }

    console.log(`[INTERACTION] /${cmd.commandName} — deferred in ${Date.now() - t0}ms, running handler`);

    const handler = slashHandlers[cmd.commandName];
    if (handler) {
      handler(cmd).catch(async (err) => {
        console.error(`[ERROR] /${cmd.commandName}:`, err);
        const code: string | undefined = (err as { code?: string })?.code;
        const message: string = err instanceof Error ? err.message : String(err);
        let reply = "❌ Something went wrong.";
        if (code === "MissingPermissions" || message.includes("Missing Permissions")) {
          reply = "❌ I'm missing permissions to do that. Please make sure I have **Send Messages**, **Embed Links**, and **Manage Channels** permissions.";
        } else if (code === "MissingAccess" || message.includes("Missing Access")) {
          reply = "❌ I don't have access to that channel.";
        } else {
          reply = `❌ Error: ${message.split("\n")[0]}`;
        }
        try {
          await cmd.editReply({ content: reply });
        } catch (e2) {
          console.error(`[ERROR] editReply also failed for /${cmd.commandName}:`, e2);
        }
      });
    } else {
      console.warn(`[WARN] No handler for command: ${cmd.commandName}`);
      await cmd.editReply({ content: "❌ Unknown command." });
    }
    return;
  }

  // ── Dashboard select menus (update the original message in-place) ───────────
  if (interaction.isStringSelectMenu()) {
    const sel = interaction as StringSelectMenuInteraction;
    if (sel.customId.startsWith("dash_")) {
      try {
        await sel.deferUpdate();
      } catch (err) {
        console.error(`[INTERACTION] select:${sel.customId} — deferUpdate failed`, err);
        return;
      }
      handleDashboardSelect(sel).catch(async (err) => {
        console.error(`[ERROR] dashboard select [${sel.customId}]:`, err);
        try {
          await sel.editReply({ content: "❌ Dashboard error: " + (err instanceof Error ? err.message : String(err)) });
        } catch { /* ignore */ }
      });
      return;
    }
  }

  if (interaction.isButton()) {
    const btn = interaction as ButtonInteraction;
    const t0 = Date.now();
    console.log(`[INTERACTION] button:${btn.customId} received`);

    // ── Dashboard buttons use deferUpdate (update the panel in-place) ─────────
    if (btn.customId.startsWith("dash_")) {
      try {
        await btn.deferUpdate();
      } catch (err) {
        console.error(`[INTERACTION] button:${btn.customId} — deferUpdate failed`, err);
        return;
      }
      handleDashboardButton(btn).catch(async (err) => {
        console.error(`[ERROR] dashboard button [${btn.customId}]:`, err);
        try {
          await btn.editReply({ content: "❌ Dashboard error: " + (err instanceof Error ? err.message : String(err)) });
        } catch { /* ignore */ }
      });
      return;
    }

    // ── Regular buttons ───────────────────────────────────────────────────────
    try {
      await btn.deferReply({ flags: MessageFlags.Ephemeral });
    } catch (err) {
      console.error(`[INTERACTION] button:${btn.customId} — defer failed, cannot respond`, err);
      return;
    }

    console.log(`[INTERACTION] button:${btn.customId} — deferred in ${Date.now() - t0}ms, running handler`);

    const handler = buttonHandlers[btn.customId];
    if (handler) {
      handler(btn).catch(async (err) => {
        console.error(`[ERROR] button [${btn.customId}]:`, err);
        const code: string | undefined = (err as { code?: string })?.code;
        const message: string = err instanceof Error ? err.message : String(err);
        let reply = "❌ Something went wrong.";
        if (code === "MissingPermissions" || message.includes("Missing Permissions")) {
          reply = "❌ I'm missing permissions. Please make sure I have **Send Messages**, **Embed Links**, and **Manage Channels** permissions.";
        } else if (code === "MissingAccess" || message.includes("Missing Access")) {
          reply = "❌ I don't have access to that channel.";
        } else {
          reply = `❌ Error: ${message.split("\n")[0]}`;
        }
        try {
          await btn.editReply({ content: reply });
        } catch (e2) {
          console.error(`[ERROR] editReply also failed for button [${btn.customId}]:`, e2);
        }
      });
    } else {
      await btn.editReply({ content: "⚠️ This button is no longer active." });
    }
    return;
  }
});

const KEEP_ALIVE_PORT = parseInt(process.env.PORT ?? "3000", 10);
http.createServer((req, res) => {
  res.writeHead(200);
  res.end("OK");
}).listen(KEEP_ALIVE_PORT, () => {
  console.log(`[KEEP-ALIVE] HTTP server running on port ${KEEP_ALIVE_PORT}`);
});

// Self-ping every 30 seconds so the process stays warm and can respond within
// Discord's strict 3-second interaction acknowledgement window.
setInterval(() => {
  http.get(`http://localhost:${KEEP_ALIVE_PORT}/`, (res) => {
    res.resume();
  }).on("error", (err) => {
    console.warn("[KEEP-ALIVE] Self-ping failed:", err.message);
  });
}, 30 * 1000);

// Watchdog: only triggers when the WebSocket is genuinely DISCONNECTED (status 5).
// Does NOT run on quiet-but-healthy servers. Uses a lock to prevent concurrent reconnects.
// Because the WS must be down for this to fire, no interactions can arrive during the
// brief destroy → login window, so the "Unknown interaction" race condition cannot occur.
let wsReconnecting = false;

setInterval(async () => {
  if (wsReconnecting) return;

  // discord.js Status enum: 0=Ready, 5=Disconnected. Only act on genuine disconnection.
  const WS_DISCONNECTED = 5;
  if (client.ws.status !== WS_DISCONNECTED) return;

  wsReconnecting = true;
  console.warn("[WATCHDOG] WebSocket is DISCONNECTED — waiting 5 s for auto-resume...");

  // Give discord.js 5 seconds to self-resume before we intervene.
  await new Promise<void>((r) => setTimeout(r, 5_000));

  if (client.ws.status !== WS_DISCONNECTED) {
    console.log("[WATCHDOG] Connection restored automatically — no action needed.");
    wsReconnecting = false;
    return;
  }

  console.warn("[WATCHDOG] Still disconnected after 5 s — forcing full reconnect.");
  try {
    client.destroy();          // WS is already dead, so no interactions are in-flight here
    await client.login(token!); // re-sets the token and opens a new WebSocket
    console.log("[WATCHDOG] Reconnected successfully.");
  } catch (err) {
    console.error("[WATCHDOG] Reconnect failed:", err);
  } finally {
    wsReconnecting = false;
  }
}, 30_000);

// Catch unhandled promise rejections so they don't silently corrupt bot state
process.on("unhandledRejection", (reason) => {
  console.error("[PROCESS] Unhandled promise rejection:", reason);
});

// Catch synchronous uncaught exceptions and log them before Node exits
process.on("uncaughtException", (err) => {
  console.error("[PROCESS] Uncaught exception — bot may need restart:", err);
});

async function bootstrap(): Promise<void> {
  try {
    await initPersistence();
  } catch (err) {
    console.error("[BOOT] Persistence init failed:", err);
  }
  await client.login(token);
}

for (const sig of ["SIGTERM", "SIGINT"] as const) {
  process.on(sig, async () => {
    console.log(`[PROCESS] Received ${sig}, flushing data to Postgres...`);
    try {
      await flushAll();
    } catch (err) {
      console.error("[PROCESS] Flush on shutdown failed:", err);
    }
    process.exit(0);
  });
}

bootstrap();
