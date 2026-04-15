import {
  Client,
  GatewayIntentBits,
  Events,
  Message,
  Interaction,
  Routes,
  ChatInputCommandInteraction,
  ButtonInteraction,
  REST,
} from "discord.js";
import http from "http";

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
  closeTournamentData,
  executeCloseTournament,
  executeTournament,
  tournamentData,
} from "./tournament/index.js";

const token = process.env.DISCORD_BOT_TOKEN;
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
];

// Defined once at startup — not recreated on every interaction
const slashHandlers: Record<string, (i: ChatInputCommandInteraction) => Promise<void>> = {
  setupchallengepanel: setupPanelExecute,
  setupleaderboard: (i) => executeSetupLeaderboard(i, client),
  addleaderboardplayer: (i) => executeAddPlayer(i, client),
  removeleaderboardplayer: (i) => executeRemovePlayer(i, client),
  editleaderboardplayer: (i) => executeEditPlayer(i, client),
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
    console.log("[READY] Cleared global application commands.");
  } catch (err) {
    console.error("[ERROR] Failed to clear global commands:", err);
  }

  for (const [guildId] of readyClient.guilds.cache) {
    await registerCommandsForGuild(guildId);

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

  if (readyClient.guilds.cache.size === 0) {
    console.warn("[WARN] No guilds in cache — bot may not be in any server.");
  }
});

client.on(Events.GuildCreate, async (guild) => {
  await registerCommandsForGuild(guild.id);
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

    try {
      await cmd.deferReply({ ephemeral: true });
    } catch (err) {
      console.error(`[INTERACTION] /${cmd.commandName} — defer failed, cannot respond`, err);
      return;
    }

    console.log(`[INTERACTION] /${cmd.commandName} — deferred in ${Date.now() - t0}ms, running handler`);

    const handler = slashHandlers[cmd.commandName];
    if (handler) {
      handler(cmd).catch(async (err) => {
        console.error(`[ERROR] /${cmd.commandName}:`, err);
        try {
          await cmd.editReply({ content: "❌ Something went wrong. Please try again." });
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

  if (interaction.isButton()) {
    const btn = interaction as ButtonInteraction;
    const t0 = Date.now();
    console.log(`[INTERACTION] button:${btn.customId} received`);

    try {
      await btn.deferReply({ ephemeral: true });
    } catch (err) {
      console.error(`[INTERACTION] button:${btn.customId} — defer failed, cannot respond`, err);
      return;
    }

    console.log(`[INTERACTION] button:${btn.customId} — deferred in ${Date.now() - t0}ms, running handler`);

    const handler = buttonHandlers[btn.customId];
    if (handler) {
      handler(btn).catch(async (err) => {
        console.error(`[ERROR] button [${btn.customId}]:`, err);
        try {
          await btn.editReply({ content: "❌ Something went wrong. Please try again." });
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

client.login(token);
