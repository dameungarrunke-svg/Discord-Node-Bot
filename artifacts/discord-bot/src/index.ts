import {
  Client,
  GatewayIntentBits,
  Events,
  Message,
  Interaction,
  REST,
  Routes,
  ChatInputCommandInteraction,
  ButtonInteraction,
} from "discord.js";

import { data as setupPanelData, execute as setupPanelExecute } from "./commands/setupChallengePanel.js";
import { handleCreateTicket } from "./tickets/ticketFlow.js";
import { handleCloseTicket, handleDeleteTicket } from "./tickets/ticketControls.js";

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

const commands = [setupPanelData.toJSON()];

async function registerCommandsForGuild(guildId: string): Promise<void> {
  const rest = new REST().setToken(token!);
  const clientId = client.user!.id;
  try {
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
      body: commands,
    });
    console.log(`Commands registered for guild: ${guildId}`);
  } catch (err) {
    console.error(`Failed to register commands for guild ${guildId}:`, err);
  }
}

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}`);
  for (const [guildId] of readyClient.guilds.cache) {
    await registerCommandsForGuild(guildId);
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
      "`!help` — Show this help message\n" +
      "`/setupchallengepanel` — *(Admin)* Deploy the TSB challenge ticket panel"
    );
  }
});

client.on(Events.InteractionCreate, async (interaction: Interaction) => {
  if (interaction.isChatInputCommand()) {
    const cmd = interaction as ChatInputCommandInteraction;
    if (cmd.commandName === "setupchallengepanel") {
      await setupPanelExecute(cmd).catch((err) => {
        console.error("Error in /setupchallengepanel:", err);
      });
    }
    return;
  }

  if (interaction.isButton()) {
    const btn = interaction as ButtonInteraction;
    switch (btn.customId) {
      case "create_challenge_ticket":
        await handleCreateTicket(btn).catch((err) => {
          console.error("Error creating challenge ticket:", err);
        });
        break;
      case "close_ticket":
        await handleCloseTicket(btn).catch((err) => {
          console.error("Error closing ticket:", err);
        });
        break;
      case "delete_ticket":
        await handleDeleteTicket(btn).catch((err) => {
          console.error("Error deleting ticket:", err);
        });
        break;
      default:
        break;
    }
    return;
  }
});

client.login(token);
