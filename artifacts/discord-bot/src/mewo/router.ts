import type { Message } from "discord.js";
import { EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { isChannelEnabled, enableChannel, disableChannel } from "./store.js";
import { handleHelp } from "./help.js";
import {
  cmd8ball, cmdCoinflip, cmdRate, cmdHotcalc, cmdHowgay, cmdHowautistic,
  cmdPpsize, cmdShip, cmdSay, cmdRizz, cmdRoast, cmdMath, cmdAsciify,
  cmdUrban, cmdLyrics, cmdNitro, cmdBadtranslate, cmdEmojimix,
} from "./modules/fun.js";
import {
  cmdBaka, cmdBite, cmdCry, cmdCuddle, cmdFeed, cmdHandhold, cmdHandshake,
  cmdHighfive, cmdHug, cmdKick, cmdKiss, cmdPat, cmdPeck, cmdPoke,
  cmdPunch, cmdShoot, cmdSlap, cmdRoleplayHelp,
} from "./modules/roleplay.js";
import {
  cmdBase64Encode, cmdBase64Decode, cmdAvatar, cmdBanner, cmdPing,
  cmdDiscordUser, cmdTimezoneSet, cmdTimezoneView, cmdQrGenerate,
  cmdConvertId2User, cmdConvertUser2Id, cmdIpLookup, cmdDomainLookup,
  cmdTranslate, cmdMe, cmdAbout, cmdInvite, cmdCustomizeColor,
} from "./modules/utility.js";
import {
  cmdChatgpt, cmdLlama, cmdAiUsage, cmdOcr, cmdScreenshot, cmdDownload,
} from "./modules/ai.js";
import {
  cmdRps, cmdTictactoe, cmdBlackjack, cmdCookie, cmdSnake,
} from "./modules/games.js";
import {
  cmdGithub, cmdMinecraftServer, cmdMinecraftUser, cmdMinecraftSkin,
  cmdMinecraftRandomserver, cmdYoutube, cmdSteam,
} from "./modules/search.js";
import {
  cmdTagCreate, cmdTagDelete, cmdTagEdit, cmdTagList, cmdTagSend,
} from "./modules/tags.js";

type Handler = (msg: Message, args: string[]) => Promise<void>;

const PREFIX = "mewo";

function comingSoon(feature: string): Handler {
  return async (msg) => {
    await msg.reply({
      embeds: [new EmbedBuilder()
        .setColor(0xFEE75C)
        .setTitle("Coming Soon")
        .setDescription(`**${feature}** is not yet available. Check back for updates!`)
        .setFooter({ text: "mewo" })
      ],
    });
  };
}

function unknownCmd(group?: string): Handler {
  return async (msg) => {
    await msg.reply({
      embeds: [new EmbedBuilder()
        .setColor(0xED4245)
        .setDescription(group
          ? `❌ Unknown \`${group}\` subcommand. Try \`mewo help ${group}\``
          : "❌ Unknown command. Use `mewo help` to see all commands.")
        .setFooter({ text: "mewo" })
      ],
    });
  };
}

// ─── Sub-command maps ─────────────────────────────────────────────────────────

const AI_CMDS: Record<string, Handler> = {
  chatgpt: cmdChatgpt,
  llama: cmdLlama,
  usage: cmdAiUsage,
  ocr: cmdOcr,
  screenshot: cmdScreenshot,
  download: cmdDownload,
  "grok-imagine": comingSoon("AI Image Generation (Grok)"),
  geolocate: comingSoon("AI Geolocation"),
  deepgeolocate: comingSoon("AI Deep Geolocation"),
  perplexity: comingSoon("Perplexity Web Search"),
  tts: comingSoon("Text to Speech (use: mewo ai tts elevenlabs or openai)"),
};

const AI_TTS_CMDS: Record<string, Handler> = {
  elevenlabs: comingSoon("ElevenLabs TTS (requires ELEVENLABS_API_KEY)"),
  openai: comingSoon("OpenAI TTS (requires OPENAI_API_KEY)"),
};

const BASE64_CMDS: Record<string, Handler> = {
  encode: cmdBase64Encode,
  decode: cmdBase64Decode,
};

const GAMES_CMDS: Record<string, Handler> = {
  rps: cmdRps,
  tictactoe: cmdTictactoe,
  blackjack: cmdBlackjack,
  cookie: cmdCookie,
  snake: cmdSnake,
};

const ROLEPLAY_CMDS: Record<string, Handler> = {
  baka: cmdBaka, bite: cmdBite, cry: cmdCry, cuddle: cmdCuddle,
  feed: cmdFeed, handhold: cmdHandhold, handshake: cmdHandshake,
  highfive: cmdHighfive, hug: cmdHug, kick: cmdKick, kiss: cmdKiss,
  pat: cmdPat, peck: cmdPeck, poke: cmdPoke, punch: cmdPunch,
  shoot: cmdShoot, slap: cmdSlap, help: cmdRoleplayHelp,
};

const SEARCH_CMDS: Record<string, Handler> = {
  youtube: cmdYoutube,
  github: cmdGithub,
  steam: cmdSteam,
};

const MINECRAFT_CMDS: Record<string, Handler> = {
  server: cmdMinecraftServer,
  user: cmdMinecraftUser,
  skin: cmdMinecraftSkin,
  randomserver: cmdMinecraftRandomserver,
};

const TAGS_CMDS: Record<string, Handler> = {
  create: cmdTagCreate,
  delete: cmdTagDelete,
  edit: cmdTagEdit,
  list: cmdTagList,
  send: cmdTagSend,
};

const TIMEZONE_CMDS: Record<string, Handler> = {
  set: cmdTimezoneSet,
  view: cmdTimezoneView,
};

const CONVERT_CMDS: Record<string, Handler> = {
  discordid2user: cmdConvertId2User,
  discorduser2id: cmdConvertUser2Id,
};

const QR_CMDS: Record<string, Handler> = {
  generate: cmdQrGenerate,
  scan: comingSoon("QR Scan (requires image attachment)"),
};

const CUSTOMIZE_CMDS: Record<string, Handler> = {
  color: cmdCustomizeColor,
  wallet: comingSoon("Wallet Customization"),
};

const DISCORD_CMDS: Record<string, Handler> = {
  user: cmdDiscordUser,
  dsa: comingSoon("Discord DSA Lookup"),
};

const IP_CMDS: Record<string, Handler> = {
  lookup: cmdIpLookup,
  ping: comingSoon("Global IP Ping"),
};

const DOMAIN_CMDS: Record<string, Handler> = {
  lookup: cmdDomainLookup,
};

// ─── Main router ──────────────────────────────────────────────────────────────

export async function handleMewoCommand(message: Message): Promise<boolean> {
  const content = message.content.trim();
  const lower = content.toLowerCase();

  // Must start with "mewo" (exactly, case-insensitive)
  if (!lower.startsWith(PREFIX)) return false;
  const afterPrefix = content.slice(PREFIX.length);

  // Must be "mewo" alone, or "mewo <space>..." — prevent matching "mewo!" etc
  if (afterPrefix !== "" && afterPrefix[0] !== " ") return false;

  const rest = afterPrefix.trim();
  const parts = rest ? rest.split(/\s+/) : [];
  const cmd = parts[0]?.toLowerCase() ?? "";
  const args = parts.slice(1);

  // "mewo" alone or "mewo help" → show help (always allowed, no channel check)
  if (!cmd || cmd === "help") {
    await handleHelp(message, args).catch(console.error);
    return true;
  }

  // ── Channel enable/disable — no channel-enabled check needed ──────────────
  if (cmd === "enable") {
    if (!message.member?.permissions.has(PermissionFlagsBits.ManageChannels)) {
      await message.reply({
        embeds: [new EmbedBuilder().setColor(0xED4245)
          .setDescription("❌ You need **Manage Channels** permission to enable mewo here.")]
      });
      return true;
    }
    enableChannel(message.channelId);
    await message.reply({
      embeds: [new EmbedBuilder()
        .setColor(0x57F287)
        .setTitle("mewo Enabled")
        .setDescription(
          `mewo commands are now **enabled** in <#${message.channelId}>.\n\n` +
          "Use `mewo help` to see all available commands."
        )
        .setFooter({ text: "mewo • channel settings" })
      ],
    });
    return true;
  }

  if (cmd === "disable") {
    if (!message.member?.permissions.has(PermissionFlagsBits.ManageChannels)) {
      await message.reply({
        embeds: [new EmbedBuilder().setColor(0xED4245)
          .setDescription("❌ You need **Manage Channels** permission to disable mewo here.")]
      });
      return true;
    }
    disableChannel(message.channelId);
    await message.reply({
      embeds: [new EmbedBuilder()
        .setColor(0xED4245)
        .setTitle("mewo Disabled")
        .setDescription(`mewo commands are now **disabled** in <#${message.channelId}>.`)
        .setFooter({ text: "mewo • channel settings" })
      ],
    });
    return true;
  }

  // ── All other commands require the channel to be enabled ─────────────────
  if (!isChannelEnabled(message.channelId)) return false;

  try {
    switch (cmd) {

      // ── Fun ────────────────────────────────────────────────────────────────
      case "8ball":        await cmd8ball(message, args);        break;
      case "coinflip":     await cmdCoinflip(message, args);     break;
      case "rate":         await cmdRate(message, args);          break;
      case "hotcalc":      await cmdHotcalc(message, args);      break;
      case "howgay":       await cmdHowgay(message, args);       break;
      case "howautistic":  await cmdHowautistic(message, args);  break;
      case "ppsize":       await cmdPpsize(message, args);       break;
      case "ship":         await cmdShip(message, args);         break;
      case "say":          await cmdSay(message, args);          break;
      case "rizz":         await cmdRizz(message, args);         break;
      case "roast":        await cmdRoast(message, args);        break;
      case "math":         await cmdMath(message, args);         break;
      case "asciify":      await cmdAsciify(message, args);      break;
      case "urban":        await cmdUrban(message, args);        break;
      case "lyrics":       await cmdLyrics(message, args);       break;
      case "nitro":        await cmdNitro(message, args);        break;
      case "badtranslate": await cmdBadtranslate(message, args); break;
      case "emojimix":     await cmdEmojimix(message, args);     break;

      // ── Utility ────────────────────────────────────────────────────────────
      case "ping":    await cmdPing(message, args);    break;
      case "avatar":  await cmdAvatar(message, args);  break;
      case "banner":  await cmdBanner(message, args);  break;
      case "me":      await cmdMe(message, args);      break;
      case "about":   await cmdAbout(message, args);   break;
      case "invite":  await cmdInvite(message, args);  break;
      case "translate": await cmdTranslate(message, args); break;

      // ── Coming-soon stubs (single-word) ────────────────────────────────────
      case "bypass":
      case "shazam":
      case "soundcloud":
      case "voicemessage":
      case "button":
      case "socialscan":
      case "sherlock":
      case "download":
        await comingSoon(cmd.charAt(0).toUpperCase() + cmd.slice(1))(message, args);
        break;
      case "fake":
        await comingSoon("Fake Media Generation (fake message, convo, quote, etc.)")(message, args);
        break;

      // ── Groups ─────────────────────────────────────────────────────────────

      case "ai": {
        const sub = args[0]?.toLowerCase();
        if (sub === "tts") {
          const subSub = args[1]?.toLowerCase();
          const h = subSub ? AI_TTS_CMDS[subSub] : null;
          if (h) await h(message, args.slice(2));
          else await comingSoon("Text to Speech")(message, args);
          break;
        }
        const h = sub ? AI_CMDS[sub] : null;
        if (h) await h(message, args.slice(1));
        else await unknownCmd("ai")(message, args);
        break;
      }

      case "base64": {
        const h = BASE64_CMDS[args[0]?.toLowerCase()];
        if (h) await h(message, args.slice(1));
        else {
          await message.reply({
            embeds: [new EmbedBuilder().setColor(0xED4245)
              .setDescription("❌ Usage: `mewo base64 encode <text>` or `mewo base64 decode <string>`")]
          });
        }
        break;
      }

      case "games": {
        const h = GAMES_CMDS[args[0]?.toLowerCase()];
        if (h) await h(message, args.slice(1));
        else await unknownCmd("games")(message, args);
        break;
      }

      case "roleplay": {
        const h = ROLEPLAY_CMDS[args[0]?.toLowerCase()];
        if (h) await h(message, args.slice(1));
        else await cmdRoleplayHelp(message, args);
        break;
      }

      case "search": {
        const sub = args[0]?.toLowerCase();
        if (sub === "minecraft") {
          const mcSub = args[1]?.toLowerCase();
          const h = mcSub ? MINECRAFT_CMDS[mcSub] : null;
          if (h) await h(message, args.slice(2));
          else {
            await message.reply({
              embeds: [new EmbedBuilder().setColor(0xED4245)
                .setDescription("❌ Usage: `mewo search minecraft server/user/skin/randomserver <...>`")]
            });
          }
        } else {
          const h = sub ? SEARCH_CMDS[sub] : null;
          if (h) await h(message, args.slice(1));
          else await unknownCmd("search")(message, args);
        }
        break;
      }

      case "tags": {
        const h = TAGS_CMDS[args[0]?.toLowerCase()];
        if (h) await h(message, args.slice(1));
        else await unknownCmd("tags")(message, args);
        break;
      }

      case "timezone": {
        const h = TIMEZONE_CMDS[args[0]?.toLowerCase()];
        if (h) await h(message, args.slice(1));
        else {
          await message.reply({
            embeds: [new EmbedBuilder().setColor(0xED4245)
              .setDescription("❌ Usage: `mewo timezone set <tz>` or `mewo timezone view [tz/@user]`")]
          });
        }
        break;
      }

      case "convert": {
        const h = CONVERT_CMDS[args[0]?.toLowerCase()];
        if (h) await h(message, args.slice(1));
        else {
          await message.reply({
            embeds: [new EmbedBuilder().setColor(0xED4245)
              .setDescription("❌ Usage: `mewo convert discordid2user <id>` or `mewo convert discorduser2id @user`")]
          });
        }
        break;
      }

      case "qr": {
        const h = QR_CMDS[args[0]?.toLowerCase()];
        if (h) await h(message, args.slice(1));
        else await unknownCmd("qr")(message, args);
        break;
      }

      case "customize": {
        const h = CUSTOMIZE_CMDS[args[0]?.toLowerCase()];
        if (h) await h(message, args.slice(1));
        else await unknownCmd("customize")(message, args);
        break;
      }

      case "discord": {
        const h = DISCORD_CMDS[args[0]?.toLowerCase()];
        if (h) await h(message, args.slice(1));
        else await unknownCmd("discord")(message, args);
        break;
      }

      case "ip": {
        const h = IP_CMDS[args[0]?.toLowerCase()];
        if (h) await h(message, args.slice(1));
        else {
          await message.reply({
            embeds: [new EmbedBuilder().setColor(0xED4245)
              .setDescription("❌ Usage: `mewo ip lookup <ip>`")]
          });
        }
        break;
      }

      case "domain": {
        const h = DOMAIN_CMDS[args[0]?.toLowerCase()];
        if (h) await h(message, args.slice(1));
        else {
          await message.reply({
            embeds: [new EmbedBuilder().setColor(0xED4245)
              .setDescription("❌ Usage: `mewo domain lookup <domain>`")]
          });
        }
        break;
      }

      // ── Settings / info aliases ─────────────────────────────────────────────
      case "settings": await cmdAbout(message, args); break;

      // ── Default ────────────────────────────────────────────────────────────
      default:
        await message.reply({
          embeds: [new EmbedBuilder()
            .setColor(0xFEE75C)
            .setDescription(`Unknown command \`${cmd}\`. Use \`mewo help\` to see all available commands.`)
            .setFooter({ text: "mewo" })
          ],
        });
    }
  } catch (e) {
    console.error(`[MEWO] Error in command "${cmd}":`, e);
    await message.reply({
      embeds: [new EmbedBuilder()
        .setColor(0xED4245)
        .setDescription("❌ An unexpected error occurred. Please try again.")
        .setFooter({ text: "mewo" })
      ],
    }).catch(() => {});
  }

  return true;
}
