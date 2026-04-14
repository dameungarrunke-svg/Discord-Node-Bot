import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} from "discord.js";

const HR = "⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯";

export const data = new SlashCommandBuilder()
  .setName("setupchallengepanel")
  .setDescription("Deploy the LS Challenge Panel in this channel.")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(0x9f1239)
    .setAuthor({
      name: "LAST STAND  ·  CHALLENGE SYSTEM",
      iconURL: interaction.guild?.iconURL() ?? undefined,
    })
    .setTitle("⚔  CHALLENGE PANEL — THE ARENA IS OPEN")
    .setDescription(
      `${HR}\n\n` +
      `**Think you have what it takes?**\n` +
      `Open a private challenge ticket and submit your match request.\n` +
      `Staff will coordinate — your opponent will be notified.\n\n` +
      `${HR}\n\n` +
      `**HOW IT WORKS**\n` +
      `▸  Click **Open a Challenge Ticket** below\n` +
      `▸  Answer the questions in your private channel\n` +
      `▸  Your challenge is submitted to staff\n` +
      `▸  Staff arrange and confirm the match\n\n` +
      `${HR}\n\n` +
      `*One active ticket per member. Be ready to compete.*`
    )
    .setThumbnail(interaction.guild?.iconURL() ?? null)
    .setFooter({ text: "Last Stand (LS)  ·  Challenge System" })
    .setTimestamp();

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("create_challenge_ticket")
      .setLabel("Open a Challenge Ticket")
      .setEmoji("⚔")
      .setStyle(ButtonStyle.Danger)
  );

  const channel = interaction.channel;
  if (!channel || !("send" in channel)) {
    await interaction.editReply({ content: "❌ Cannot send messages in this channel." });
    return;
  }

  await channel.send({ embeds: [embed], components: [row] });
  await interaction.editReply({ content: "✅ Challenge panel deployed." });
}
