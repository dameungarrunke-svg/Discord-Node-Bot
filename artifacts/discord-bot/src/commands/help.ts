import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
} from "discord.js";

export const helpData = new SlashCommandBuilder()
  .setName("help")
  .setDescription("Show what Last Stand Bot can do")
  .addBooleanOption((o) =>
    o.setName("admin")
     .setDescription("Show ALL admin/staff commands too (admins only)")
     .setRequired(false),
  );

interface Section {
  title: string;
  emoji: string;
  lines: string[];
}

// ─── User-facing sections ──────────────────────────────────────────────────────
const USER_SECTIONS: Section[] = [
  {
    emoji: "📊", title: "Leveling & Ranks",
    lines: [
      "`/rank` — your level + XP card",
      "`/levellb` — all-time leaderboard",
      "`/weeklylb` — weekly leaderboard",
      "`/leaderboard` — universal leaderboard browser",
      "`/dashboard` — your stats dashboard",
    ],
  },
  {
    emoji: "🤗", title: "Social  (`/social ...`)",
    lines: [
      "`hug`, `kiss`, `pat`, `slap`, `cuddle`, `poke`,",
      "`bite`, `highfive`, `handhold`, `stare`",
    ],
  },
  {
    emoji: "🔥", title: "Troll  (`/troll ...`)",
    lines: [
      "`roast`, `insult`, `toxicrate`, `cancel`, `ratio`,",
      "`clown`, `expose`, `skillissue`, `noobrate`, `sus`",
    ],
  },
  {
    emoji: "💘", title: "Relationship  (`/relationship ...`)",
    lines: [
      "`love`, `marry`, `divorce`, `crush`, `ship`,",
      "`rizz`, `simp`, `date`, `gf`, `bf`",
    ],
  },
  {
    emoji: "🔮", title: "Answers  (`/answer ...`)",
    lines: [
      "`ask`, `eightball`, `advice`, `truth`, `dare`,",
      "`confession`, `pickup`, `compliment`, `chat`",
    ],
  },
  {
    emoji: "📸", title: "Memes  (`/meme ...`)",
    lines: [
      "`meme`, `shitpost`, `randomfact`, `joke`, `darkjoke`,",
      "`brainrot`, `quote`, `copypasta`, `triggered`, `cringe`",
    ],
  },
  {
    emoji: "🎲", title: "Mini Games  (`/game ...`)",
    lines: [
      "`coinflip`, `dice`, `rps`, `guess`, `fight`,",
      "`duel`, `gamble`, `slots`, `trivia`, `clickspeed`",
    ],
  },
  {
    emoji: "🏴", title: "Last Stand  (`/ls ...`)",
    lines: [
      "`raidcall`, `teamup`, `lstarget`, `backup`, `clutch`,",
      "`rankme`, `lsrate`, `toxicmode`, `warcry`, `laststand`",
    ],
  },
  {
    emoji: "✨", title: "Bonus  (`/bonus ...`)",
    lines: [
      "`ego`, `aura`, `drip`, `npc`, `maincharacter`,",
      "`villain`, `glaze`, `mid`, `peak`, `fallen`",
    ],
  },
  {
    emoji: "📋", title: "Other",
    lines: [
      "`/poll` — create a quick poll",
      "`/suggestion` — submit a suggestion",
      "`/attendance` — mark attendance",
      "`/mvp` — vote MVP",
    ],
  },
];

// ─── Admin sections ────────────────────────────────────────────────────────────
const ADMIN_SECTIONS: Section[] = [
  {
    emoji: "🛠️", title: "Setup",
    lines: [
      "`/setupchallengepanel`, `/setuprules`",
      "`/setupleaderboard`, `/setupmobileleaderboard`, `/setupkillleaderboard`",
    ],
  },
  {
    emoji: "🏆", title: "Leaderboard Management",
    lines: [
      "`/addleaderboardplayer`, `/removeleaderboardplayer`, `/editleaderboardplayer`",
      "`/addmobileplayer`, `/removemobileplayer`, `/editmobileplayer`",
      "`/addkillplayer`, `/removekillplayer`, `/editkillplayer`, `/movek`",
    ],
  },
  {
    emoji: "⚔️", title: "Raids & Training",
    lines: [
      "`/startraid`, `/endraid`",
      "`/starttraining`, `/endtraining`",
      "`/tournament`, `/closetournamey`",
    ],
  },
  {
    emoji: "📣", title: "Moderation & Comms",
    lines: [
      "`/announce`, `/warn`, `/promote`, `/demote`",
      "`/censor`, `/stopcensor`",
    ],
  },
  {
    emoji: "📈", title: "XP / Leveling Admin",
    lines: [
      "`/addxp`, `/removexp`, `/setxp`, `/resetxp`",
      "`/setxpcooldown`, `/setxprange`, `/setxpchannel`, `/setmultiplier`",
      "`/blacklistchannel`, `/whitelistchannel`, `/xpconfig`",
      "`/setlevelrole`, `/removelevelrole`, `/levelroles`",
      "`/startlsxpsystem`, `/stoplsxpsystem`",
      "`/exportdata`",
    ],
  },
  {
    emoji: "🎭", title: "Fun System Toggle",
    lines: [
      "`/onmeme` — show all fun command groups",
      "`/offmeme` — hide all fun command groups",
    ],
  },
];

const COLOR_USER  = 0x5865f2;
const COLOR_ADMIN = 0xff8c00;

function buildEmbed(sections: Section[], adminMode: boolean): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(adminMode ? COLOR_ADMIN : COLOR_USER)
    .setTitle(adminMode ? "🛡️ Last Stand Bot — Full Admin Help" : "📖 Last Stand Bot — Help")
    .setDescription(
      adminMode
        ? "All admin & staff commands. Use `/help` (without `admin:true`) for the user list."
        : "Here's everything you can do. Type `/help admin:true` if you're staff to see admin commands.",
    )
    .setFooter({ text: "Last Stand • use the slash menu to autocomplete any command" });

  for (const s of sections) {
    embed.addFields({
      name: `${s.emoji} ${s.title}`,
      value: s.lines.join("\n"),
      inline: false,
    });
  }
  return embed;
}

export async function executeHelp(interaction: ChatInputCommandInteraction): Promise<void> {
  const wantsAdmin = interaction.options.getBoolean("admin") ?? false;

  if (wantsAdmin) {
    const member = interaction.member;
    const hasPerm =
      typeof member?.permissions === "object" &&
      "has" in member.permissions &&
      member.permissions.has(PermissionFlagsBits.ManageGuild);
    if (!hasPerm) {
      await interaction.editReply({
        content: "🚫 The admin help is for staff only (Manage Server permission).",
      });
      return;
    }

    const userEmbed  = buildEmbed(USER_SECTIONS,  false);
    const adminEmbed = buildEmbed(ADMIN_SECTIONS, true);
    await interaction.editReply({ embeds: [userEmbed, adminEmbed] });
    return;
  }

  await interaction.editReply({ embeds: [buildEmbed(USER_SECTIONS, false)] });
}
