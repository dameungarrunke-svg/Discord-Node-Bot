import { SlashCommandBuilder, PermissionFlagsBits, type ChatInputCommandInteraction } from "discord.js";
import { setLowoEnabled, isLowoEnabled } from "./toggle.js";

export const lowoEnableData = new SlashCommandBuilder()
  .setName("lowoenable")
  .setDescription("Enable the Lowo (OwO-style) game system in this server")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export const lowoDisableData = new SlashCommandBuilder()
  .setName("lowodisable")
  .setDescription("Disable and hide the Lowo (OwO-style) game system in this server")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function executeLowoEnable(
  interaction: ChatInputCommandInteraction,
  reregister: () => Promise<void>,
): Promise<void> {
  setLowoEnabled(true);
  await reregister();
  await interaction.editReply({ content: "🦊 **Lowo system is now ON!** 🎉\nUse `lowo help` to see all commands." });
}

export async function executeLowoDisable(
  interaction: ChatInputCommandInteraction,
  reregister: () => Promise<void>,
): Promise<void> {
  setLowoEnabled(false);
  await reregister();
  await interaction.editReply({ content: "🚫 **Lowo system disabled.** All `lowo` commands are hidden." });
}

export { isLowoEnabled };
