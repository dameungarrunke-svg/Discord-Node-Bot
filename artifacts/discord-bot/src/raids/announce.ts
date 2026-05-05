import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  GuildMember,
} from "discord.js";

const CLAN_LEAD_RE = /\bclan\s*lead\b/i;
const URL_RE       = /^https?:\/\/\S+$/i;

const HR  = "⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯";
const DOT = " · · · · · · · · · · · · · · · ";

const DIFFICULTY_META: Record<string, { label: string; color: number }> = {
  low:  { label: "LOW",  color: 0x1a1a1a },
  mid:  { label: "MID",  color: 0x1a1a1a },
  high: { label: "HIGH", color: 0x1a1a1a },
};

export const raidAnnounceData = new SlashCommandBuilder()
  .setName("raidannounce")
  .setDescription("DM every LS clan member with a raid alert.")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addStringOption((o) =>
    o.setName("message").setDescription("Custom raid message").setRequired(true)
  )
  .addStringOption((o) =>
    o.setName("difficulty").setDescription("Raid difficulty").setRequired(true)
      .addChoices(
        { name: "Low",  value: "low"  },
        { name: "Mid",  value: "mid"  },
        { name: "High", value: "high" }
      )
  )
  .addStringOption((o) =>
    o.setName("target").setDescription("Target clan name").setRequired(true)
  )
  .addStringOption((o) =>
    o.setName("game_link").setDescription("Roblox game link (must start with https://)").setRequired(true)
  );

export async function executeRaidAnnounce(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const guild = interaction.guild;
  if (!guild) {
    await interaction.editReply({ content: "This command can only be used in a server." });
    return;
  }

  const member = interaction.member as GuildMember | null;
  const hasManageGuild = member?.permissions?.has(PermissionFlagsBits.ManageGuild) ?? false;
  const hasClanLead    = !!member?.roles?.cache?.some((r) => CLAN_LEAD_RE.test(r.name));
  if (!hasManageGuild && !hasClanLead) {
    await interaction.editReply({
      content: "Only the owner / admins or a Clan Lead can deploy raid alerts.",
    });
    return;
  }

  const message    = interaction.options.getString("message", true);
  const difficulty = interaction.options.getString("difficulty", true).toLowerCase();
  const target     = interaction.options.getString("target", true);
  const gameLink   = interaction.options.getString("game_link", true).trim();

  if (!URL_RE.test(gameLink)) {
    await interaction.editReply({
      content: "`game_link` must be a valid URL starting with `https://`.",
    });
    return;
  }

  const meta = DIFFICULTY_META[difficulty] ?? DIFFICULTY_META.mid;

  const embed = new EmbedBuilder()
    .setColor(meta.color)
    .setAuthor({
      name: "LAST STAND  ·  RAID OPERATIONS",
      iconURL: guild.iconURL() ?? undefined,
    })
    .setTitle("RAID NOTIFICATION")
    .setDescription(
      `${HR}\n` +
      `▸  **TARGET** ${DOT} ${target}\n` +
      `▸  **DIFFICULTY** ${DOT} \`${meta.label}\`\n` +
      `▸  **ISSUED BY** ${DOT} <@${interaction.user.id}>\n` +
      `${HR}\n` +
      `**BRIEFING**\n` +
      `> ${message}`
    )
    .addFields(
      { name: "• Status",  value: "`ACTIVE`",   inline: true },
      { name: "• Orders",  value: "`DEPLOY NOW`", inline: true },
    )
    .setFooter({ text: `Last Stand (LS)  ·  Raid Operations` })
    .setTimestamp();

  const button = new ButtonBuilder()
    .setLabel("JOIN RAID")
    .setStyle(ButtonStyle.Link)
    .setURL(gameLink);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

  let members;
  try {
    members = await guild.members.fetch();
  } catch (err) {
    console.error("[RAIDANNOUNCE] Failed to fetch guild members:", err);
    await interaction.editReply({
      content: "Failed to fetch guild members. Make sure I have the Server Members Intent.",
    });
    return;
  }

  const targets = members.filter((m) => !m.user.bot);

  if (targets.size === 0) {
    await interaction.editReply({ content: "No members found to DM." });
    return;
  }

  let sent = 0;
  let failed = 0;
  for (const m of targets.values()) {
    try {
      await m.send({ embeds: [embed], components: [row] });
      sent++;
    } catch {
      failed++;
    }
  }

  const failNote = failed > 0 ? ` *(${failed} had DMs closed)*` : "";
  await interaction.editReply({
    content: `Raid alert sent to **${sent}** clan members.${failNote}`,
  });
}
