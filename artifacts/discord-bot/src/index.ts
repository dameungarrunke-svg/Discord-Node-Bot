import {
  Client,
  GatewayIntentBits,
  Events,
  Message,
  Interaction,
  Routes,
  ChatInputCommandInteraction,
  ButtonInteraction,
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
  ],
});

const commands = [
  setupPanelData.toJSON(),
  setupLeaderboardData.toJSON(),
  addPlayerData.toJSON(),
  removePlayerData.toJSON(),
  editPlayerData.toJSON(),
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

  for (const [guildId] of readyClient.guilds.cache) {
    await registerCommandsForGuild(guildId);
  }

  if (readyClient.guilds.cache.size === 0) {
    console.warn("No guilds in cache — bot may not be in any server.");
  }

  // Keep the REST HTTP connection warm so interaction responses never time out
  setInterval(async () => {
    try {
      await client.rest.get(Routes.user("@me"));
    } catch {
      // Ignore keep-alive errors
    }
  }, 3_000);
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
      "`/setupchallengepanel` — *(Admin)* Deploy the TSB challenge ticket panel\n" +
      "`/setupleaderboard` — *(Admin)* Deploy the permanent TSB leaderboard\n" +
      "`/addleaderboardplayer` — *(Admin)* Add a player to the leaderboard\n" +
      "`/removeleaderboardplayer` — *(Admin)* Remove a player from the leaderboard\n" +
      "`/editleaderboardplayer` — *(Admin)* Edit a leaderboard player"
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

    switch (btn.customId) {
      case "create_challenge_ticket":
        handleCreateTicket(btn).catch((err) => {
          console.error("Error creating challenge ticket:", err);
        });
        break;
      case "close_ticket":
        handleCloseTicket(btn).catch((err) => {
          console.error("Error closing ticket:", err);
        });
        break;
      case "delete_ticket":
        handleDeleteTicket(btn).catch((err) => {
          console.error("Error deleting ticket:", err);
        });
        break;
    }
    return;
  }
});

client.login(token);
