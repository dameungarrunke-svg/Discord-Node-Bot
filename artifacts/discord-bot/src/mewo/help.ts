import type { Message } from "discord.js";
import { EmbedBuilder } from "discord.js";

type Handler = (msg: Message, args: string[]) => Promise<void>;

const MODULES: Record<string, { emoji: string; desc: string; commands: string[] }> = {
  fun: {
    emoji: "🎮",
    desc: "Fun and entertainment commands",
    commands: [
      "`mewo 8ball <question>` — Consult the magic 8ball",
      "`mewo coinflip [rounds]` — Flip a coin (up to 10 rounds)",
      "`mewo rate <thing>` — Rate anything out of 100",
      "`mewo hotcalc [@user]` — Hotness percentage",
      "`mewo howgay [@user]` — How gay are you?",
      "`mewo howautistic [@user]` — Autism level check",
      "`mewo ppsize [@user]` — PP size in cm",
      "`mewo ship @u1 @u2` — Compatibility check",
      "`mewo say <msg>` — Make the bot say something",
      "`mewo rizz [@user]` — Drop a rizz line",
      "`mewo roast [@user]` — Roast someone",
      "`mewo math <expr>` — Calculate an expression",
      "`mewo asciify <text>` — Convert text to ASCII art",
      "`mewo urban <query>` — Urban Dictionary lookup",
      "`mewo lyrics <song>` — Find song lyrics",
      "`mewo nitro` — Send a fake nitro gift",
      "`mewo badtranslate <text>` — Chain bad translations",
      "`mewo emojimix <e1> <e2>` — Mix two emojis",
    ],
  },
  utility: {
    emoji: "🔧",
    desc: "Utility and information commands",
    commands: [
      "`mewo base64 encode <text>` — Encode to Base64",
      "`mewo base64 decode <string>` — Decode from Base64",
      "`mewo translate <lang> <text>` — Translate text (e.g. es, fr, ja)",
      "`mewo avatar [@user]` — View user avatar",
      "`mewo banner [@user]` — View user banner",
      "`mewo ping` — Bot latency",
      "`mewo qr generate <text>` — Generate a QR code",
      "`mewo timezone set <tz>` — Set your timezone (IANA format)",
      "`mewo timezone view [tz/@user]` — View a timezone",
      "`mewo convert discordid2user <id>` — ID to user",
      "`mewo convert discorduser2id @user` — User to ID",
      "`mewo ip lookup <ip>` — IP address information",
      "`mewo domain lookup <domain>` — DNS records lookup",
      "`mewo discord user @user` — View Discord user profile",
      "`mewo me [@user]` — View user info",
      "`mewo about` — About mewo",
      "`mewo invite` — Get invite link",
      "`mewo customize color [hex]` — Customize embed color",
    ],
  },
  ai: {
    emoji: "🤖",
    desc: "AI-powered commands",
    commands: [
      "`mewo ai chatgpt <prompt>` — Ask ChatGPT (set OPENAI_API_KEY)",
      "`mewo ai llama <prompt>` — Ask LLaMA 3.1 (set GROQ_API_KEY)",
      "`mewo ai usage` — Check your daily AI usage limits",
      "`mewo ai ocr` — Extract text from image (coming soon)",
      "`mewo ai screenshot <url>` — Screenshot a website (coming soon)",
      "`mewo ai download <url>` — Download media (coming soon)",
      "`mewo ai grok-imagine <prompt>` — Generate image (coming soon)",
      "`mewo ai perplexity <query>` — Perplexity search (coming soon)",
    ],
  },
  roleplay: {
    emoji: "🎭",
    desc: "Roleplay GIF commands — most work with @mentions",
    commands: [
      "`mewo roleplay baka [@u]`   `mewo roleplay bite [@u]`",
      "`mewo roleplay cry`         `mewo roleplay cuddle [@u]`",
      "`mewo roleplay feed [@u]`   `mewo roleplay handhold [@u]`",
      "`mewo roleplay handshake [@u]` `mewo roleplay highfive [@u]`",
      "`mewo roleplay hug [@u]`    `mewo roleplay kick [@u]`",
      "`mewo roleplay kiss [@u]`   `mewo roleplay pat [@u]`",
      "`mewo roleplay peck [@u]`   `mewo roleplay poke [@u]`",
      "`mewo roleplay punch [@u]`  `mewo roleplay shoot [@u]`",
      "`mewo roleplay slap [@u]`",
    ],
  },
  games: {
    emoji: "♟️",
    desc: "Interactive Discord games",
    commands: [
      "`mewo games rps` — Rock Paper Scissors vs bot",
      "`mewo games tictactoe @player` — TicTacToe vs someone",
      "`mewo games blackjack` — Blackjack vs bot",
      "`mewo games cookie` — First to click wins a cookie!",
      "`mewo games snake` — Snake game (coming soon)",
    ],
  },
  search: {
    emoji: "🔍",
    desc: "Search and lookup commands",
    commands: [
      "`mewo search youtube <query>` — Search YouTube videos",
      "`mewo search github <username>` — GitHub profile lookup",
      "`mewo search steam <game>` — Search Steam store",
      "`mewo search minecraft server <addr>` — MC server status",
      "`mewo search minecraft user <user>` — MC player info",
      "`mewo search minecraft skin <user>` — MC player skin",
      "`mewo search minecraft randomserver` — Random MC server",
    ],
  },
  tags: {
    emoji: "🏷️",
    desc: "Server tag system — save and share text snippets",
    commands: [
      "`mewo tags create <name> <content>` — Create a tag",
      "`mewo tags delete <name>` — Delete a tag",
      "`mewo tags edit <name> <content>` — Edit a tag",
      "`mewo tags list` — List all server tags",
      "`mewo tags send <name>` — Post a tag",
    ],
  },
  customize: {
    emoji: "⚙️",
    desc: "Personalize your mewo experience",
    commands: [
      "`mewo customize color [hex]` — Set your embed color (e.g. #FF0080)",
    ],
  },
};

export const handleHelp: Handler = async (msg, args) => {
  const module = args[0]?.toLowerCase();

  if (module && MODULES[module]) {
    const mod = MODULES[module];
    await msg.reply({
      embeds: [new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(`${mod.emoji} ${module.charAt(0).toUpperCase() + module.slice(1)} — Commands`)
        .setDescription(mod.desc)
        .addFields({ name: "Commands", value: mod.commands.join("\n"), inline: false })
        .setFooter({ text: "mewo • help • Use: mewo help for all modules" })
      ],
    });
    return;
  }

  const totalCommands = Object.values(MODULES).reduce((s, m) => s + m.commands.length, 0);

  const fields = Object.entries(MODULES).map(([key, mod]) => ({
    name: `${mod.emoji} ${key.charAt(0).toUpperCase() + key.slice(1)}`,
    value: `${mod.desc}\n\`mewo help ${key}\``,
    inline: true,
  }));

  await msg.reply({
    embeds: [new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle("mewo — Command Center")
      .setDescription(
        "A powerful multi-purpose prefix command system.\n" +
        "Use `mewo help <module>` to see commands for each module.\n\n" +
        "**Setup:** `mewo enable` in any channel to activate commands there.\n" +
        "`mewo disable` to turn off in a channel. Requires **Manage Channels** perm."
      )
      .addFields(fields)
      .addFields({
        name: "\u200B",
        value: `**Prefix:** \`mewo\`  |  **Total Commands:** ${totalCommands}+`,
        inline: false,
      })
      .setThumbnail(msg.client.user.displayAvatarURL())
      .setFooter({ text: "mewo • help" })
    ],
  });
};
