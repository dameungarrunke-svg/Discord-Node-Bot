import { Client, GatewayIntentBits, Events, Message } from "discord.js";

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

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}`);
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
      "**Available commands:**\n`!ping` — Check if the bot is alive\n`!hello` — Say hello\n`!help` — Show this help message"
    );
  }
});

client.login(token);
