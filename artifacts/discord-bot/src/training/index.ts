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

function shortDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

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
    o.setName("training_type").setDescription("Type of training (e.g. Combat Training, PvP Drills)").setRequired(true)
  )
  .addStringOption((o) =>
    o.setName("game_link").setDescription("Roblox game link").setRequired(true)
  )
  .addStringOption((o) =>
    o.setName("host").setDescription("Session host username or @mention").setRequired(true)
  )
  .addStringOption((o) =>
    o.setName("duration").setDescription("Expected duration (e.g. 1h, 45 minutes)").setRequired(true)
  )
  .addRoleOption((o) =>
    o.setName("ping_role").setDescription("Role to ping").setRequired(false)
  )
  .addStringOption((o) =>
    o.setName("notes").setDescription("Session overview / notes (optional)").setRequired(false)
  );

export async function executeStartTraining(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const trainingType = interaction.options.getString("training_type", true);
  const gameLink     = interaction.options.getString("game_link", true);
  const host         = interaction.options.getString("host", true);
  const duration     = interaction.options.getString("duration", true);
  const pingRole     = interaction.options.getRole("ping_role");
  const notes        = interaction.options.getString("notes");

  const fields: { name: string; value: string }[] = [
    { name: "GAME LINK", value: gameLink },
  ];
  if (notes) {
    fields.push({ name: "SESSION OVERVIEW", value: notes });
  }

  const embed = new EmbedBuilder()
    .setColor(0xf97316)
    .setAuthor({ name: "◈  TRAINING STARTED" })
    .setTitle(trainingType)
    .setDescription(
      `>>> Host  ·  ${host}\nDuration  ·  ${duration}\nDate  ·  ${shortDate()}`
    )
    .addFields(fields)
    .setFooter({ text: `Training called by ${interaction.user.username}` })
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
    o.setName("training_type").setDescription("Training type / session name").setRequired(true)
  )
  .addStringOption((o) =>
    o.setName("host").setDescription("Session host username or @mention").setRequired(true)
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

  const trainingType      = interaction.options.getString("training_type", true);
  const host              = interaction.options.getString("host", true);
  const durationCompleted = interaction.options.getString("duration_completed", true);
  const mvp               = interaction.options.getString("mvp", true);
  const notes             = interaction.options.getString("notes");

  const fields: { name: string; value: string }[] = [
    { name: "SESSION MVP", value: mvp },
  ];
  if (notes) {
    fields.push({ name: "SESSION NOTES", value: notes });
  }

  const embed = new EmbedBuilder()
    .setColor(0xf97316)
    .setAuthor({ name: "◈  TRAINING ENDED" })
    .setTitle(trainingType)
    .setDescription(
      `>>> Host  ·  ${host}\nDuration  ·  ${durationCompleted}\nDate  ·  ${shortDate()}`
    )
    .addFields(fields)
    .setFooter({ text: `Training ended by ${interaction.user.username}` })
    .setTimestamp();

  saveTrainingLog({
    id: `${Date.now()}`,
    host,
    durationCompleted,
    mvp,
    notes: notes ?? "—",
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
