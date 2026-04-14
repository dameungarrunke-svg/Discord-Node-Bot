import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlags,
  TextChannel,
} from "discord.js";
import { saveTrainingLog } from "./store.js";

const ADMIN = PermissionFlagsBits.ManageGuild;

const HR  = "⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯";
const DOT = " · · · · · · · · · · · · · · · ";

function findChannel(interaction: ChatInputCommandInteraction, ...keywords: string[]): TextChannel | null {
  const guild = interaction.guild;
  if (!guild) return null;
  for (const kw of keywords) {
    const found = guild.channels.cache.find(
      (c) => c.isTextBased() && c.name.toLowerCase().includes(kw.toLowerCase())
    ) as TextChannel | undefined;
    if (found) return found;
  }
  return null;
}

export const startTrainingData = new SlashCommandBuilder()
  .setName("starttraining")
  .setDescription("Deploy a training session alert to the server.")
  .setDefaultMemberPermissions(ADMIN)
  .addStringOption((o) =>
    o.setName("game_link").setDescription("Roblox game link").setRequired(true)
  )
  .addStringOption((o) =>
    o.setName("host").setDescription("Session host name / tag").setRequired(true)
  )
  .addStringOption((o) =>
    o.setName("training_type").setDescription("Type of training (e.g. PvP, Ranked, Defence drills)").setRequired(true)
  )
  .addStringOption((o) =>
    o.setName("duration").setDescription("Expected duration (e.g. 1 hour, 45 minutes)").setRequired(true)
  )
  .addStringOption((o) =>
    o.setName("start_time").setDescription("When it starts (e.g. NOW, In 5 minutes, 4:00 PM EST)").setRequired(true)
  )
  .addStringOption((o) =>
    o.setName("attendance_requirement").setDescription("Attendance status (e.g. Mandatory, Optional, Core members only)").setRequired(true)
  )
  .addRoleOption((o) =>
    o.setName("ping_role").setDescription("Role to ping").setRequired(false)
  )
  .addStringOption((o) =>
    o.setName("notes").setDescription("Session notes / additional details").setRequired(false)
  );

export async function executeStartTraining(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const gameLink      = interaction.options.getString("game_link", true);
  const host          = interaction.options.getString("host", true);
  const trainingType  = interaction.options.getString("training_type", true);
  const duration      = interaction.options.getString("duration", true);
  const startTime     = interaction.options.getString("start_time", true);
  const attendanceReq = interaction.options.getString("attendance_requirement", true);
  const pingRole      = interaction.options.getRole("ping_role");
  const notes         = interaction.options.getString("notes") || "—";

  const embed = new EmbedBuilder()
    .setColor(0xd97706)
    .setAuthor({
      name: "LAST STAND  ·  TRAINING DIVISION",
      iconURL: interaction.guild?.iconURL() ?? undefined,
    })
    .setTitle("🎯  TRAINING SESSION — REPORT FOR DUTY")
    .setDescription(
      `${HR}\n` +
      `▸  **HOST** ${DOT} \`${host}\`\n` +
      `▸  **SESSION TYPE** ${DOT} \`${trainingType}\`\n` +
      `▸  **DURATION** ${DOT} \`${duration}\`\n` +
      `▸  **START TIME** ${DOT} \`${startTime}\`\n` +
      `▸  **ATTENDANCE** ${DOT} \`${attendanceReq}\`\n` +
      `${HR}\n` +
      `🔗  [**CLICK TO JOIN THE SESSION**](${gameLink})\n` +
      `${HR}\n` +
      `**SESSION BRIEFING**\n` +
      `> ${notes}`
    )
    .setFooter({
      text: `Announced by ${interaction.user.tag}  ·  Last Stand (LS)`,
      iconURL: interaction.user.displayAvatarURL(),
    })
    .setTimestamp();

  const channel = interaction.channel as TextChannel | null;
  if (!channel) {
    await interaction.editReply({ content: "❌ Cannot post in this channel." });
    return;
  }

  await channel.send({ content: pingRole ? `${pingRole}` : undefined, embeds: [embed] });
  await interaction.editReply({ content: "✅ Training session announced." });
}

export const endTrainingData = new SlashCommandBuilder()
  .setName("endtraining")
  .setDescription("Close a training session and log the results.")
  .setDefaultMemberPermissions(ADMIN)
  .addStringOption((o) =>
    o.setName("host").setDescription("Session host name / tag").setRequired(true)
  )
  .addStringOption((o) =>
    o.setName("duration_completed").setDescription("Actual duration completed").setRequired(true)
  )
  .addStringOption((o) =>
    o.setName("mvp").setDescription("Most Valuable Player of the session").setRequired(true)
  )
  .addStringOption((o) =>
    o.setName("notes").setDescription("Post-session notes (optional)").setRequired(false)
  );

export async function executeEndTraining(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const host              = interaction.options.getString("host", true);
  const durationCompleted = interaction.options.getString("duration_completed", true);
  const mvp               = interaction.options.getString("mvp", true);
  const notes             = interaction.options.getString("notes") || "—";

  const embed = new EmbedBuilder()
    .setColor(0x059669)
    .setAuthor({
      name: "LAST STAND  ·  TRAINING DIVISION",
      iconURL: interaction.guild?.iconURL() ?? undefined,
    })
    .setTitle("✅  TRAINING CONCLUDED — RESULTS LOGGED")
    .setDescription(
      `${HR}\n` +
      `▸  **HOST** ${DOT} \`${host}\`\n` +
      `▸  **DURATION** ${DOT} \`${durationCompleted}\`\n` +
      `▸  **SESSION MVP** ${DOT} \`${mvp}\`\n` +
      `${HR}\n` +
      `**POST-SESSION NOTES**\n` +
      `> ${notes}`
    )
    .setFooter({
      text: `Closed by ${interaction.user.tag}  ·  Last Stand (LS)`,
      iconURL: interaction.user.displayAvatarURL(),
    })
    .setTimestamp();

  saveTrainingLog({
    id: `${Date.now()}`,
    host,
    durationCompleted,
    mvp,
    notes,
    endedBy: interaction.user.tag,
    endedById: interaction.user.id,
    timestamp: new Date().toISOString(),
    guildId: interaction.guildId ?? "",
  });

  const resultsChannel = findChannel(interaction, "training-results", "training-log");

  if (resultsChannel) {
    await resultsChannel.send({ embeds: [embed] });
    await interaction.editReply({ content: `✅ Results posted to ${resultsChannel}.` });
  } else {
    const ch = interaction.channel as TextChannel | null;
    if (ch) await ch.send({ embeds: [embed] });
    await interaction.editReply({ content: "✅ Training concluded and results logged." });
  }
}
