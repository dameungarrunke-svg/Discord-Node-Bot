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

const LS_ROLE_RE = /\bLS\b/i;
const CLAN_LEAD_RE = /\bclan\s*lead\b/i;
const URL_RE = /^https?:\/\/\S+$/i;

const DIFFICULTY_META: Record<
  string,
  { label: string; emoji: string; color: number }
> = {
  low:  { label: "LOW",  emoji: "🟢", color: 0x16a34a },
  mid:  { label: "MID",  emoji: "🟠", color: 0xf97316 },
  high: { label: "HIGH", emoji: "🔴", color: 0xdc2626 },
};

export const raidAnnounceData = new SlashCommandBuilder()
  .setName("raidannounce")
  .setDescription("DM every LS clan member with a raid alert.")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addStringOption((o) =>
    o
      .setName("message")
      .setDescription("Custom raid message (e.g. 'Join up and wipe the targets!')")
      .setRequired(true)
  )
  .addStringOption((o) =>
    o
      .setName("difficulty")
      .setDescription("Raid difficulty")
      .setRequired(true)
      .addChoices(
        { name: "Low",  value: "low"  },
        { name: "Mid",  value: "mid"  },
        { name: "High", value: "high" }
      )
  )
  .addStringOption((o) =>
    o
      .setName("target")
      .setDescription("Target clan name")
      .setRequired(true)
  )
  .addStringOption((o) =>
    o
      .setName("game_link")
      .setDescription("Roblox game link (must start with https://)")
      .setRequired(true)
  );

export async function executeRaidAnnounce(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const guild = interaction.guild;
  if (!guild) {
    await interaction.editReply({ content: "❌ This command can only be used in a server." });
    return;
  }

  // ── Permission: ManageGuild OR has a "Clan Lead" role ──────────────────────
  const member = interaction.member as GuildMember | null;
  const hasManageGuild = member?.permissions?.has(PermissionFlagsBits.ManageGuild) ?? false;
  const hasClanLead = !!member?.roles?.cache?.some((r) => CLAN_LEAD_RE.test(r.name));
  if (!hasManageGuild && !hasClanLead) {
    await interaction.editReply({
      content: "❌ Only the owner / admins or a **Clan Lead** can deploy raid alerts.",
    });
    return;
  }

  const message    = interaction.options.getString("message", true);
  const difficulty = interaction.options.getString("difficulty", true).toLowerCase();
  const target     = interaction.options.getString("target", true);
  const gameLink   = interaction.options.getString("game_link", true).trim();

  if (!URL_RE.test(gameLink)) {
    await interaction.editReply({
      content: "❌ `game_link` must be a valid URL starting with `https://`.",
    });
    return;
  }

  const meta = DIFFICULTY_META[difficulty] ?? DIFFICULTY_META.mid;

  // ── Build the raid card ────────────────────────────────────────────────────
  const embed = new EmbedBuilder()
    .setColor(meta.color)
    .setTitle("🚨 RAID STARTED")
    .setDescription(message)
    .addFields(
      { name: "⚔️ Difficulty", value: `${meta.emoji} **${meta.label}**`, inline: true },
      { name: "🎯 Targets",    value: target,                            inline: true }
    )
    .setFooter({ text: "Premium Raid System • LAST STAND Management" })
    .setTimestamp();

  const button = new ButtonBuilder()
    .setLabel("🚀 Join Raid")
    .setStyle(ButtonStyle.Link)
    .setURL(gameLink);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

  // ── Find every LS clan member in this guild ────────────────────────────────
  let members;
  try {
    members = await guild.members.fetch();
  } catch (err) {
    console.error("[RAIDANNOUNCE] Failed to fetch guild members:", err);
    await interaction.editReply({
      content: "❌ Failed to fetch guild members. Make sure I have the **Server Members Intent**.",
    });
    return;
  }

  const lsMembers = members.filter(
    (m) => !m.user.bot && m.roles.cache.some((r) => LS_ROLE_RE.test(r.name))
  );

  if (lsMembers.size === 0) {
    await interaction.editReply({
      content: "⚠️ No LS clan members found. Add an **LS** role to your members and try again.",
    });
    return;
  }

  // ── DM each LS member ──────────────────────────────────────────────────────
  let sent = 0;
  let failed = 0;
  for (const m of lsMembers.values()) {
    try {
      await m.send({ embeds: [embed], components: [row] });
      sent++;
    } catch {
      failed++;
    }
  }

  const failNote = failed > 0 ? ` *(${failed} had DMs closed)*` : "";
  await interaction.editReply({
    content: `✅ Raid alert sent to **${sent}** clan members.${failNote}`,
  });
}
