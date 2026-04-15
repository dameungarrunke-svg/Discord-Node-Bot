import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  Role,
  SlashCommandBuilder,
  TextChannel,
} from "discord.js";
import {
  addTournamentParticipant,
  BracketType,
  getTournament,
  nextTournamentId,
  removeTournamentParticipant,
  saveTournament,
  TournamentData,
} from "./store.js";

const ADMIN = PermissionFlagsBits.ManageGuild;
const HR = "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━";
const THIN = "────── ⋆⋅☆⋅⋆ ──────";

const BRACKET_CHOICES: BracketType[] = [
  "Single Elimination",
  "Double Elimination",
  "Round Robin",
];

function safeValue(value: string): string {
  return value.trim() || "—";
}

function participantCounter(tournament: TournamentData): string {
  return `${tournament.participants.length}/${tournament.maxParticipants}`;
}

function buildTournamentEmbed(tournament: TournamentData, guildIcon?: string | null): EmbedBuilder {
  const participantsOpen = tournament.participants.length < tournament.maxParticipants;
  const notes = tournament.notes ? `\n\n**COMMAND NOTES**\n> ${tournament.notes}` : "";
  const deadline = tournament.registrationDeadline
    ? `\n▸  **REGISTRATION DEADLINE** ${THIN} \`${tournament.registrationDeadline}\``
    : "";

  return new EmbedBuilder()
    .setColor(participantsOpen ? 0xdc2626 : 0x7f1d1d)
    .setAuthor({
      name: "LAST STAND (LS)  ·  TSB CHAMPIONSHIP CONTROL",
      iconURL: guildIcon ?? undefined,
    })
    .setTitle(`⚔️  TOURNAMENT LOCKED IN  ·  ${tournament.id}`)
    .setDescription(
      `${HR}\n` +
      `**THE STRONGEST BATTLEGROUNDS COMPETITIVE EVENT**\n` +
      `Elite players, ranked pressure, no excuses. Step into the arena and prove who survives under Last Stand rules.\n\n` +
      `**TOURNAMENT ABOUT**\n> ${tournament.about}\n\n` +
      `**RULES OF ENGAGEMENT**\n> ${tournament.rules}\n\n` +
      `${HR}\n` +
      `▸  **DATE** ${THIN} \`${tournament.tournamentDate}\`\n` +
      `▸  **TIME** ${THIN} \`${tournament.tournamentTime}\`\n` +
      `▸  **HOST** ${THIN} <@${tournament.hostId}>\n` +
      `▸  **BRACKET** ${THIN} \`${tournament.bracketType}\`\n` +
      `▸  **SLOTS** ${THIN} \`${participantCounter(tournament)}\`\n` +
      `▸  **PRIZE** ${THIN} \`${tournament.prize}\`\n` +
      `▸  **GAME LINK** ${THIN} ${tournament.gameLink}\n` +
      `▸  **ENTRY REQUIREMENT** ${THIN} \`${tournament.entryRequirement}\`${deadline}\n` +
      `${HR}\n\n` +
      `**REGISTRATION STATUS**\n` +
      `> ${participantsOpen ? "🟢 Open — use the buttons below to join." : "🔴 Full — all competitive slots are locked."}` +
      notes
    )
    .setFooter({
      text: `Last Stand Management  ·  TSB Tournament System  ·  Created by ${tournament.createdByTag}`,
    })
    .setTimestamp(new Date(tournament.createdAt));
}

function buildTournamentButtons(tournament: TournamentData): ActionRowBuilder<ButtonBuilder> {
  const full = tournament.participants.length >= tournament.maxParticipants;
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`tournament_join:${tournament.id}`)
      .setLabel("Join Tournament")
      .setEmoji("⚔️")
      .setStyle(ButtonStyle.Success)
      .setDisabled(full),
    new ButtonBuilder()
      .setCustomId(`tournament_leave:${tournament.id}`)
      .setLabel("Leave Tournament")
      .setEmoji("🚪")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`tournament_view:${tournament.id}`)
      .setLabel("View Participants")
      .setEmoji("👥")
      .setStyle(ButtonStyle.Secondary)
  );
}

function buildTournamentMessage(tournament: TournamentData, guildIcon?: string | null) {
  return {
    embeds: [buildTournamentEmbed(tournament, guildIcon)],
    components: [buildTournamentButtons(tournament)],
  };
}

function buildParticipantsText(tournament: TournamentData): string {
  if (tournament.participants.length === 0) {
    return "No participants have joined yet.";
  }

  return tournament.participants
    .slice(0, 50)
    .map((participant, index) => `\`${(index + 1).toString().padStart(2, "0")}.\` <@${participant.userId}>`)
    .join("\n");
}

export const tournamentData = new SlashCommandBuilder()
  .setName("tournament")
  .setDescription("Launch a premium Last Stand TSB tournament announcement.")
  .setDefaultMemberPermissions(ADMIN)
  .addStringOption((option) =>
    option.setName("tournament_about").setDescription("What this tournament is about").setRequired(true)
  )
  .addStringOption((option) =>
    option.setName("rules").setDescription("Tournament rules").setRequired(true)
  )
  .addStringOption((option) =>
    option.setName("game_link").setDescription("The Strongest Battlegrounds game/private server link").setRequired(true)
  )
  .addStringOption((option) =>
    option.setName("prize").setDescription("Tournament prize").setRequired(true)
  )
  .addRoleOption((option) =>
    option.setName("ping_role").setDescription("Role to ping for the tournament").setRequired(true)
  )
  .addStringOption((option) =>
    option.setName("tournament_date").setDescription("Tournament date").setRequired(true)
  )
  .addStringOption((option) =>
    option.setName("tournament_time").setDescription("Tournament time").setRequired(true)
  )
  .addUserOption((option) =>
    option.setName("host").setDescription("Tournament host").setRequired(true)
  )
  .addIntegerOption((option) =>
    option
      .setName("maximum_participants")
      .setDescription("Maximum tournament participants")
      .setRequired(true)
      .setMinValue(2)
      .setMaxValue(200)
  )
  .addStringOption((option) =>
    option
      .setName("bracket_type")
      .setDescription("Tournament bracket format")
      .setRequired(true)
      .addChoices(...BRACKET_CHOICES.map((choice) => ({ name: choice, value: choice })))
  )
  .addStringOption((option) =>
    option.setName("entry_requirement").setDescription("Requirement to enter").setRequired(true)
  )
  .addStringOption((option) =>
    option.setName("registration_deadline").setDescription("Optional registration deadline").setRequired(false)
  )
  .addStringOption((option) =>
    option.setName("notes").setDescription("Optional extra notes").setRequired(false)
  );

export async function executeTournament(interaction: ChatInputCommandInteraction): Promise<void> {
  const channel = interaction.channel as TextChannel | null;
  if (!channel || !channel.isTextBased()) {
    await interaction.editReply({ content: "❌ Cannot post a tournament in this channel." });
    return;
  }

  const pingRole = interaction.options.getRole("ping_role", true) as Role;
  const host = interaction.options.getUser("host", true);
  const id = nextTournamentId();

  const tournament: TournamentData = {
    id,
    guildId: interaction.guildId ?? "",
    channelId: channel.id,
    messageId: "",
    about: safeValue(interaction.options.getString("tournament_about", true)),
    rules: safeValue(interaction.options.getString("rules", true)),
    gameLink: safeValue(interaction.options.getString("game_link", true)),
    prize: safeValue(interaction.options.getString("prize", true)),
    pingRoleId: pingRole.id,
    tournamentDate: safeValue(interaction.options.getString("tournament_date", true)),
    tournamentTime: safeValue(interaction.options.getString("tournament_time", true)),
    hostId: host.id,
    hostTag: host.tag,
    maxParticipants: interaction.options.getInteger("maximum_participants", true),
    bracketType: interaction.options.getString("bracket_type", true) as BracketType,
    entryRequirement: safeValue(interaction.options.getString("entry_requirement", true)),
    notes: interaction.options.getString("notes")?.trim() || undefined,
    registrationDeadline: interaction.options.getString("registration_deadline")?.trim() || undefined,
    createdById: interaction.user.id,
    createdByTag: interaction.user.tag,
    createdAt: new Date().toISOString(),
    participants: [],
  };

  const message = await channel.send({
    content: `<@&${pingRole.id}>`,
    ...buildTournamentMessage(tournament, interaction.guild?.iconURL() ?? undefined),
    allowedMentions: { roles: [pingRole.id] },
  });

  tournament.messageId = message.id;
  saveTournament(tournament);

  await interaction.editReply({
    content: `✅ Premium TSB tournament created: ${message.url}`,
  });
}

export async function handleTournamentButton(interaction: ButtonInteraction): Promise<boolean> {
  const [action, tournamentId] = interaction.customId.split(":");
  if (!action.startsWith("tournament_") || !tournamentId) return false;

  const tournament = getTournament(tournamentId);
  if (!tournament) {
    await interaction.editReply({ content: "❌ Tournament data could not be found." });
    return true;
  }

  if (action === "tournament_view") {
    const embed = new EmbedBuilder()
      .setColor(0x1f2937)
      .setTitle(`👥 Participants · ${tournament.id}`)
      .setDescription(
        `${HR}\n` +
        `**Registered:** \`${participantCounter(tournament)}\`\n\n` +
        `${buildParticipantsText(tournament)}\n` +
        `${HR}`
      )
      .setFooter({ text: "Last Stand Management  ·  Tournament Registry" });

    await interaction.editReply({ embeds: [embed] });
    return true;
  }

  if (action === "tournament_join") {
    const result = addTournamentParticipant(tournament.id, {
      userId: interaction.user.id,
      userTag: interaction.user.tag,
      joinedAt: new Date().toISOString(),
    });

    if (result === "duplicate") {
      await interaction.editReply({ content: "⚠️ You are already registered for this tournament." });
      return true;
    }
    if (result === "full") {
      await interaction.editReply({ content: "❌ This tournament is already full." });
      return true;
    }
    if (result === "missing") {
      await interaction.editReply({ content: "❌ Tournament data could not be found." });
      return true;
    }

    const updated = getTournament(tournament.id)!;
    await interaction.message.edit(buildTournamentMessage(updated, interaction.guild?.iconURL() ?? undefined));
    await interaction.editReply({ content: `✅ You joined tournament **${tournament.id}**.` });
    return true;
  }

  if (action === "tournament_leave") {
    const result = removeTournamentParticipant(tournament.id, interaction.user.id);

    if (result === "not_joined") {
      await interaction.editReply({ content: "⚠️ You are not registered for this tournament." });
      return true;
    }
    if (result === "missing") {
      await interaction.editReply({ content: "❌ Tournament data could not be found." });
      return true;
    }

    const updated = getTournament(tournament.id)!;
    await interaction.message.edit(buildTournamentMessage(updated, interaction.guild?.iconURL() ?? undefined));
    await interaction.editReply({ content: `✅ You left tournament **${tournament.id}**.` });
    return true;
  }

  return false;
}