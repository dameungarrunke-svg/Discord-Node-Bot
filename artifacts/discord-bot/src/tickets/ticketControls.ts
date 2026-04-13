import {
  ButtonInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  TextChannel,
  MessageFlags,
} from "discord.js";
import { removeActiveTicketByChannelId } from "./ticketManager.js";

export async function handleCloseTicket(interaction: ButtonInteraction): Promise<void> {
  const channel = interaction.channel as TextChannel;
  if (!channel) return;

  const member = interaction.guild?.members.cache.get(interaction.user.id);
  const hasStaffPerms =
    member?.permissions.has(PermissionFlagsBits.ManageChannels) ||
    member?.permissions.has(PermissionFlagsBits.Administrator);

  const userId = removeActiveTicketByChannelId(channel.id);
  const isOwner = userId === interaction.user.id;

  if (!isOwner && !hasStaffPerms) {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: "❌ Only the ticket owner or staff can close this ticket.",
    });
    return;
  }

  await interaction.deferReply();

  await channel.permissionOverwrites.set([
    {
      id: interaction.guild!.roles.everyone.id,
      deny: [PermissionFlagsBits.ViewChannel],
    },
    {
      id: interaction.client.user!.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ManageChannels,
      ],
    },
  ]);

  if (userId) {
    await channel.permissionOverwrites.create(userId, {
      ViewChannel: false,
    });
  }

  const closeEmbed = new EmbedBuilder()
    .setColor(0x95a5a6)
    .setTitle("🔒  Ticket Closed")
    .setDescription(
      `This ticket was closed by <@${interaction.user.id}>.\n\nOnly staff can view or delete this channel.`
    )
    .setTimestamp();

  await interaction.editReply({ embeds: [closeEmbed] });
}

export async function handleDeleteTicket(interaction: ButtonInteraction): Promise<void> {
  const channel = interaction.channel as TextChannel;
  if (!channel) return;

  const member = interaction.guild?.members.cache.get(interaction.user.id);
  const hasStaffPerms =
    member?.permissions.has(PermissionFlagsBits.ManageChannels) ||
    member?.permissions.has(PermissionFlagsBits.Administrator);

  const ticketOwnerId = removeActiveTicketByChannelId(channel.id);
  const isOwner = ticketOwnerId === interaction.user.id;

  if (!isOwner && !hasStaffPerms) {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: "❌ Only the ticket owner or staff can delete this ticket.",
    });
    return;
  }

  const deleteEmbed = new EmbedBuilder()
    .setColor(0xe74c3c)
    .setTitle("🗑️  Deleting Ticket")
    .setDescription("This ticket will be permanently deleted in **5 seconds**.");

  await interaction.reply({ embeds: [deleteEmbed] });

  setTimeout(async () => {
    await channel.delete().catch(() => {});
  }, 5_000);
}
