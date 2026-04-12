import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("setupchallengepanel")
  .setDescription("Set up the TSB Challenge Ticket Panel in this channel.")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const embed = new EmbedBuilder()
    .setColor(0xc0392b)
    .setTitle("⚔️  TSB CHALLENGE PANEL")
    .setDescription(
      "**Welcome to the Official Challenge System.**\n\n" +
      "Think you have what it takes to compete?\n" +
      "Click the button below to open a private challenge ticket and submit your match request.\n\n" +
      "━━━━━━━━━━━━━━━━━━━━━━\n" +
      "📋  **How it works:**\n" +
      "> `1.` Click **Create Challenge Ticket**\n" +
      "> `2.` Answer the questions in your private channel\n" +
      "> `3.` Your challenge summary will be posted for staff\n" +
      "> `4.` Staff will coordinate the match\n" +
      "━━━━━━━━━━━━━━━━━━━━━━\n\n" +
      "⚡  *One active ticket per user. Be ready to compete.*"
    )
    .setThumbnail(interaction.guild?.iconURL() ?? null)
    .setFooter({ text: "The Strongest Battlegrounds  •  Challenge System" })
    .setTimestamp();

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("create_challenge_ticket")
      .setLabel("⚔️  Create Challenge Ticket")
      .setStyle(ButtonStyle.Danger)
  );

  await interaction.channel?.send({ embeds: [embed], components: [row] });
  await interaction.editReply({ content: "✅ Challenge panel deployed successfully." });
}
