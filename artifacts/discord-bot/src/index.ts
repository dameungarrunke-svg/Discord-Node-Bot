import {
  Client,
  GatewayIntentBits,
  Events,
  Message,
  Interaction,
  Routes,
  ChatInputCommandInteraction,
  ButtonInteraction,
  MessageFlags,
} from "discord.js";

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

const token = process.env.DISCORD_BOT_TOKEN;
if (!token) {
  console.error("DISCORD_BOT_TOKEN is not set. Exiting.");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions,
  ],
});

const commands = [
  setupPanelData.toJSON(),
  setupLeaderboardData.toJSON(),
  addPlayerData.toJSON(),
  removePlayerData.toJSON(),
  editPlayerData.toJSON(),
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
];

async function registerCommandsForGuild(guildId: string): Promise<void> {
  try {
    await client.rest.put(Routes.applicationGuildCommands(client.user!.id, guildId), {
      body: commands,
    });
    console.log(`Commands registered for guild: ${guildId}`);
  } catch (err) {
    console.error(`Failed to register commands for guild ${guildId}:`, err);
  }
}

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}`);
  console.log(`Guilds in cache: ${readyClient.guilds.cache.size}`);

  // Clear any stale global (application-level) commands
  try {
    await client.rest.put(Routes.applicationCommands(readyClient.user.id), { body: [] });
    console.log("Cleared global application commands.");
  } catch (err) {
    console.error("Failed to clear global commands:", err);
  }

  for (const [guildId] of readyClient.guilds.cache) {
    await registerCommandsForGuild(guildId);
  }

  if (readyClient.guilds.cache.size === 0) {
    console.warn("No guilds in cache — bot may not be in any server.");
  }

});

client.on(Events.GuildCreate, async (guild) => {
  await registerCommandsForGuild(guild.id);
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
      "`/setuprules` — *(Admin)* Deploy the clan rulebook"
    );
  }
});

client.on(Events.InteractionCreate, async (interaction: Interaction) => {
  if (interaction.isChatInputCommand()) {
    const cmd = interaction as ChatInputCommandInteraction;

    const handlers: Record<string, (i: ChatInputCommandInteraction) => Promise<void>> = {
      setupchallengepanel: setupPanelExecute,
      setupleaderboard: (i) => executeSetupLeaderboard(i, client),
      addleaderboardplayer: (i) => executeAddPlayer(i, client),
      removeleaderboardplayer: (i) => executeRemovePlayer(i, client),
      editleaderboardplayer: (i) => executeEditPlayer(i, client),
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
    };

    const handler = handlers[cmd.commandName];
    if (handler) {
      handler(cmd).catch(async (err) => {
        console.error(`Error in /${cmd.commandName}:`, err);
        try {
          if (cmd.deferred || cmd.replied) {
            await cmd.editReply({ content: "❌ Something went wrong. Please try again." });
          } else {
            await cmd.reply({ content: "❌ Something went wrong. Please try again.", flags: MessageFlags.Ephemeral });
          }
        } catch {
          // Interaction already expired
        }
      });
    } else {
      console.warn(`No handler for command: ${cmd.commandName}`);
      cmd.reply({ content: "❌ Unknown command.", flags: MessageFlags.Ephemeral }).catch(() => {});
    }
    return;
  }

  if (interaction.isButton()) {
    const btn = interaction as ButtonInteraction;

    const buttonHandlers: Record<string, (i: ButtonInteraction) => Promise<void>> = {
      create_challenge_ticket: handleCreateTicket,
      close_ticket: handleCloseTicket,
      delete_ticket: handleDeleteTicket,
    };

    const btnHandler = buttonHandlers[btn.customId];
    if (btnHandler) {
      btnHandler(btn).catch(async (err) => {
        console.error(`Error in button [${btn.customId}]:`, err);
        try {
          if (btn.deferred || btn.replied) {
            await btn.editReply({ content: "❌ Something went wrong. Please try again." });
          } else {
            await btn.reply({ content: "❌ Something went wrong. Please try again.", flags: MessageFlags.Ephemeral });
          }
        } catch {
          // Interaction already expired
        }
      });
    }
    return;
  }
});

client.login(token);
