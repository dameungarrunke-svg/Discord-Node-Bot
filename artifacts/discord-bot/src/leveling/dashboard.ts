import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  StringSelectMenuInteraction,
  ButtonInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} from "discord.js";
import {
  getGuildConfig,
  patchGuildConfig,
  getGuildLevelRoles,
  resetWeeklyXp,
  setLastWeeklyReset,
} from "./db.js";

// ─── Command Definition ───────────────────────────────────────────────────────

export const dashboardData = new SlashCommandBuilder()
  .setName("dashboard")
  .setDescription("Open the XP system master control panel. (Admin)")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

// ─── Section Builders ─────────────────────────────────────────────────────────

function navRow(current?: string): ActionRowBuilder<StringSelectMenuBuilder> {
  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("dash_nav")
      .setPlaceholder("Select a section to configure...")
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel("⚙️  XP Settings")
          .setDescription("XP range, cooldown, enable/disable, channels")
          .setValue("dash_xp")
          .setDefault(current === "dash_xp"),
        new StringSelectMenuOptionBuilder()
          .setLabel("🎖️  Role Settings")
          .setDescription("Level → role mapping, keep old roles toggle")
          .setValue("dash_roles")
          .setDefault(current === "dash_roles"),
        new StringSelectMenuOptionBuilder()
          .setLabel("✨  Multipliers")
          .setDescription("Server-wide and event XP multipliers")
          .setValue("dash_multi")
          .setDefault(current === "dash_multi"),
        new StringSelectMenuOptionBuilder()
          .setLabel("📅  Weekly System")
          .setDescription("Weekly leaderboard and manual reset")
          .setValue("dash_weekly")
          .setDefault(current === "dash_weekly"),
        new StringSelectMenuOptionBuilder()
          .setLabel("🔔  Level-Up Messages")
          .setDescription("Announcements, pings, level-up channel")
          .setValue("dash_levelup")
          .setDefault(current === "dash_levelup"),
        new StringSelectMenuOptionBuilder()
          .setLabel("🛡️  Anti-Spam")
          .setDescription("Spam detection sensitivity")
          .setValue("dash_antispam")
          .setDefault(current === "dash_antispam"),
      )
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

function buildMainEmbed(guildId: string): EmbedBuilder {
  const config = getGuildConfig(guildId);
  const levelRoles = getGuildLevelRoles(guildId);
  const roleCount = Object.keys(levelRoles).length;

  return new EmbedBuilder()
    .setColor(config.enabled ? 0x5865f2 : 0xed4245)
    .setTitle("◈  MASTER CONTROL PANEL")
    .setDescription(
      "Welcome to the **Last Stand Management** XP control panel.\n" +
      "Use the dropdown below to navigate between sections.\n\u200b"
    )
    .addFields(
      {
        name: "System Status",
        value: config.enabled ? "```ansi\n\u001b[32mRUNNING\u001b[0m\n```" : "```ansi\n\u001b[31mSTOPPED\u001b[0m\n```",
        inline: true,
      },
      {
        name: "XP Range",
        value: `\`${config.xpMin} – ${config.xpMax}\` per msg`,
        inline: true,
      },
      {
        name: "Cooldown",
        value: `\`${config.cooldown}s\``,
        inline: true,
      },
      {
        name: "Server Multiplier",
        value: `\`${config.serverMultiplier}x\``,
        inline: true,
      },
      {
        name: "Level Roles",
        value: `\`${roleCount}\` configured`,
        inline: true,
      },
      {
        name: "Announcements",
        value: config.announcements ? "`✅ On`" : "`❌ Off`",
        inline: true,
      },
    )
    .setFooter({ text: "Last Stand Management  ·  XP Dashboard  ·  Select a section below" });
}

// ─── XP Settings Section ──────────────────────────────────────────────────────

function buildXpEmbed(guildId: string): EmbedBuilder {
  const config = getGuildConfig(guildId);
  const blChans = config.blacklistedChannels.length > 0
    ? config.blacklistedChannels.map((id) => `<#${id}>`).join(", ")
    : "None";
  const wlChans = config.whitelistedChannels.length > 0
    ? config.whitelistedChannels.map((id) => `<#${id}>`).join(", ")
    : "All channels";

  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle("⚙️  XP SETTINGS")
    .setDescription("Configure how XP is earned across the server.\n\u200b")
    .addFields(
      { name: "System", value: config.enabled ? "🟢 Running" : "🔴 Stopped", inline: true },
      { name: "XP Per Message", value: `${config.xpMin} – ${config.xpMax} XP`, inline: true },
      { name: "Cooldown", value: `${config.cooldown} seconds`, inline: true },
      { name: "Blacklisted Channels", value: blChans },
      { name: "Whitelisted Channels", value: wlChans },
    )
    .setFooter({ text: "Use /setxprange, /setxpcooldown, /blacklistchannel to fine-tune" });
}

function buildXpButtons(guildId: string): ActionRowBuilder<ButtonBuilder> {
  const config = getGuildConfig(guildId);
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("dash_btn_toggle_xp")
      .setLabel(config.enabled ? "⏹  Disable XP" : "▶  Enable XP")
      .setStyle(config.enabled ? ButtonStyle.Danger : ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId("dash_btn_xp_cooldown_30")
      .setLabel("Cooldown: 30s")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("dash_btn_xp_cooldown_60")
      .setLabel("Cooldown: 60s")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("dash_btn_xp_cooldown_120")
      .setLabel("Cooldown: 120s")
      .setStyle(ButtonStyle.Secondary),
  );
}

function buildXpRangeButtons(): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("dash_btn_xprange_1015")
      .setLabel("Range: 10–15")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("dash_btn_xprange_1525")
      .setLabel("Range: 15–25 (default)")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("dash_btn_xprange_2040")
      .setLabel("Range: 20–40")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("dash_btn_xprange_3060")
      .setLabel("Range: 30–60")
      .setStyle(ButtonStyle.Secondary),
  );
}

// ─── Role Settings Section ────────────────────────────────────────────────────

function buildRolesEmbed(guildId: string): EmbedBuilder {
  const config = getGuildConfig(guildId);
  const levelRoles = getGuildLevelRoles(guildId);
  const lines = Object.entries(levelRoles)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([lvl, name]) => `**Lv.${lvl}** → ${name}`)
    .join("\n") || "None configured";

  return new EmbedBuilder()
    .setColor(0x57f287)
    .setTitle("🎖️  ROLE SETTINGS")
    .setDescription("Manage which roles are granted at specific levels.\n\u200b")
    .addFields(
      {
        name: "Keep Old Roles",
        value: config.keepOldRoles
          ? "✅ Members keep all previous roles"
          : "❌ Old roles are removed on level-up",
        inline: false,
      },
      {
        name: `Configured Roles (${Object.keys(levelRoles).length})`,
        value: lines.length > 1000 ? lines.slice(0, 997) + "..." : lines,
      },
    )
    .setFooter({
      text: "Use /setlevelrole and /removelevelrole to configure level → role mappings",
    });
}

function buildRolesButtons(guildId: string): ActionRowBuilder<ButtonBuilder> {
  const config = getGuildConfig(guildId);
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("dash_btn_toggle_keeproles")
      .setLabel(config.keepOldRoles ? "❌  Remove Old Roles on Level-Up" : "✅  Keep Old Roles")
      .setStyle(config.keepOldRoles ? ButtonStyle.Secondary : ButtonStyle.Success),
  );
}

// ─── Multipliers Section ──────────────────────────────────────────────────────

function buildMultiEmbed(guildId: string): EmbedBuilder {
  const config = getGuildConfig(guildId);
  const roleMultLines = Object.entries(config.roleMultipliers)
    .map(([id, m]) => `<@&${id}> → **${m}x**`)
    .join("\n") || "None configured";

  return new EmbedBuilder()
    .setColor(0xfaa61a)
    .setTitle("✨  MULTIPLIERS")
    .setDescription("Control how much XP is multiplied globally or per role.\n\u200b")
    .addFields(
      { name: "Server Multiplier", value: `**${config.serverMultiplier}x**`, inline: true },
      { name: "Event Multiplier", value: `**${config.eventMultiplier}x**`, inline: true },
      { name: "\u200b", value: "\u200b", inline: true },
      { name: "Role Multipliers", value: roleMultLines },
    )
    .setFooter({ text: "Use /setmultiplier to set role-specific multipliers" });
}

function buildMultiButtons(): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("dash_btn_multi_server_1")
      .setLabel("Server: 1x")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("dash_btn_multi_server_15")
      .setLabel("Server: 1.5x")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("dash_btn_multi_server_2")
      .setLabel("Server: 2x")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("dash_btn_multi_server_3")
      .setLabel("Server: 3x")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("dash_btn_multi_event_reset")
      .setLabel("Reset Event → 1x")
      .setStyle(ButtonStyle.Danger),
  );
}

// ─── Weekly System Section ────────────────────────────────────────────────────

function buildWeeklyEmbed(guildId: string): EmbedBuilder {
  const config = getGuildConfig(guildId);
  return new EmbedBuilder()
    .setColor(0xeb459e)
    .setTitle("📅  WEEKLY SYSTEM")
    .setDescription("Manage the weekly XP leaderboard and reset schedule.\n\u200b")
    .addFields(
      {
        name: "Weekly Announcements",
        value: config.announcements
          ? "✅ Winners are announced when week resets"
          : "❌ No announcements",
        inline: false,
      },
      {
        name: "Reset Schedule",
        value: "Every **7 days** from last reset (automatic)",
        inline: false,
      },
    )
    .setFooter({ text: "Manual reset wipes all weekly XP and records this week's top 3" });
}

function buildWeeklyButtons(): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("dash_btn_weekly_reset")
      .setLabel("🔁  Manual Weekly Reset")
      .setStyle(ButtonStyle.Danger),
  );
}

// ─── Level-Up Message Section ─────────────────────────────────────────────────

function buildLevelUpEmbed(guildId: string): EmbedBuilder {
  const config = getGuildConfig(guildId);
  return new EmbedBuilder()
    .setColor(0x00b0f4)
    .setTitle("🔔  LEVEL-UP MESSAGES")
    .setDescription("Control how level-up notifications are displayed.\n\u200b")
    .addFields(
      {
        name: "Announcements",
        value: config.announcements ? "✅ Enabled — bot posts level-up cards" : "❌ Disabled",
        inline: true,
      },
      {
        name: "Ping User",
        value: config.pingOnLevelUp ? "✅ User is pinged" : "❌ No ping",
        inline: true,
      },
      {
        name: "Level-Up Channel",
        value: config.levelUpChannelId
          ? `<#${config.levelUpChannelId}>`
          : "Auto-detect (general / level / chat)",
        inline: false,
      },
    )
    .setFooter({ text: "Use /setxpchannel to set a specific channel" });
}

function buildLevelUpButtons(guildId: string): ActionRowBuilder<ButtonBuilder> {
  const config = getGuildConfig(guildId);
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("dash_btn_toggle_announcements")
      .setLabel(config.announcements ? "🔕  Disable Announcements" : "🔔  Enable Announcements")
      .setStyle(config.announcements ? ButtonStyle.Danger : ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId("dash_btn_toggle_ping")
      .setLabel(config.pingOnLevelUp ? "🔇  Disable Ping" : "📢  Enable Ping")
      .setStyle(config.pingOnLevelUp ? ButtonStyle.Secondary : ButtonStyle.Primary),
  );
}

// ─── Anti-Spam Section ────────────────────────────────────────────────────────

function buildAntiSpamEmbed(guildId: string): EmbedBuilder {
  const config = getGuildConfig(guildId);
  const enabled = config.antiSpamEnabled !== false;
  return new EmbedBuilder()
    .setColor(0xed4245)
    .setTitle("🛡️  ANTI-SPAM")
    .setDescription("Control spam detection for XP farming prevention.\n\u200b")
    .addFields(
      {
        name: "Spam Detection",
        value: enabled ? "✅ Active" : "❌ Disabled",
        inline: true,
      },
      {
        name: "What is detected?",
        value:
          "◈ Messages under 3 characters\n" +
          "◈ Identical repeated messages\n" +
          "◈ Single-character spam (e.g. `aaaaaa`)\n" +
          "◈ Short all-caps messages",
        inline: false,
      },
    )
    .setFooter({
      text: enabled
        ? "Spamming messages will not earn XP"
        : "Warning: disabling allows XP farming",
    });
}

function buildAntiSpamButtons(guildId: string): ActionRowBuilder<ButtonBuilder> {
  const config = getGuildConfig(guildId);
  const enabled = config.antiSpamEnabled !== false;
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("dash_btn_toggle_antispam")
      .setLabel(enabled ? "🚫  Disable Anti-Spam" : "✅  Enable Anti-Spam")
      .setStyle(enabled ? ButtonStyle.Danger : ButtonStyle.Success),
  );
}

// ─── Section renderer ─────────────────────────────────────────────────────────

type SectionId = "dash_xp" | "dash_roles" | "dash_multi" | "dash_weekly" | "dash_levelup" | "dash_antispam";

function renderSection(
  guildId: string,
  section: SectionId,
): {
  embeds: EmbedBuilder[];
  components: ActionRowBuilder<StringSelectMenuBuilder | ButtonBuilder>[];
} {
  const nav = navRow(section);

  switch (section) {
    case "dash_xp":
      return {
        embeds: [buildXpEmbed(guildId)],
        components: [nav as ActionRowBuilder<StringSelectMenuBuilder | ButtonBuilder>, buildXpButtons(guildId), buildXpRangeButtons()],
      };
    case "dash_roles":
      return {
        embeds: [buildRolesEmbed(guildId)],
        components: [nav as ActionRowBuilder<StringSelectMenuBuilder | ButtonBuilder>, buildRolesButtons(guildId)],
      };
    case "dash_multi":
      return {
        embeds: [buildMultiEmbed(guildId)],
        components: [nav as ActionRowBuilder<StringSelectMenuBuilder | ButtonBuilder>, buildMultiButtons()],
      };
    case "dash_weekly":
      return {
        embeds: [buildWeeklyEmbed(guildId)],
        components: [nav as ActionRowBuilder<StringSelectMenuBuilder | ButtonBuilder>, buildWeeklyButtons()],
      };
    case "dash_levelup":
      return {
        embeds: [buildLevelUpEmbed(guildId)],
        components: [nav as ActionRowBuilder<StringSelectMenuBuilder | ButtonBuilder>, buildLevelUpButtons(guildId)],
      };
    case "dash_antispam":
      return {
        embeds: [buildAntiSpamEmbed(guildId)],
        components: [nav as ActionRowBuilder<StringSelectMenuBuilder | ButtonBuilder>, buildAntiSpamButtons(guildId)],
      };
    default:
      return {
        embeds: [buildMainEmbed(guildId)],
        components: [nav as ActionRowBuilder<StringSelectMenuBuilder | ButtonBuilder>],
      };
  }
}

// ─── Command executor ─────────────────────────────────────────────────────────

export async function executeDashboard(i: ChatInputCommandInteraction): Promise<void> {
  const guildId = i.guildId!;
  await i.editReply({
    embeds: [buildMainEmbed(guildId)],
    components: [navRow() as ActionRowBuilder<StringSelectMenuBuilder | ButtonBuilder>],
  });
}

// ─── Select menu handler ──────────────────────────────────────────────────────

export async function handleDashboardSelect(i: StringSelectMenuInteraction): Promise<void> {
  if (i.customId !== "dash_nav") return;
  const guildId = i.guildId!;
  const section = i.values[0] as SectionId;
  const { embeds, components } = renderSection(guildId, section);
  await i.editReply({ embeds, components });
}

// ─── Button handler ───────────────────────────────────────────────────────────

export async function handleDashboardButton(i: ButtonInteraction): Promise<void> {
  const guildId = i.guildId!;
  const id = i.customId;

  let refreshSection: SectionId | null = null;

  // XP toggles
  if (id === "dash_btn_toggle_xp") {
    const config = getGuildConfig(guildId);
    patchGuildConfig(guildId, { enabled: !config.enabled });
    refreshSection = "dash_xp";
  }

  // Cooldown presets
  else if (id === "dash_btn_xp_cooldown_30") {
    patchGuildConfig(guildId, { cooldown: 30 });
    refreshSection = "dash_xp";
  } else if (id === "dash_btn_xp_cooldown_60") {
    patchGuildConfig(guildId, { cooldown: 60 });
    refreshSection = "dash_xp";
  } else if (id === "dash_btn_xp_cooldown_120") {
    patchGuildConfig(guildId, { cooldown: 120 });
    refreshSection = "dash_xp";
  }

  // XP range presets
  else if (id === "dash_btn_xprange_1015") {
    patchGuildConfig(guildId, { xpMin: 10, xpMax: 15 });
    refreshSection = "dash_xp";
  } else if (id === "dash_btn_xprange_1525") {
    patchGuildConfig(guildId, { xpMin: 15, xpMax: 25 });
    refreshSection = "dash_xp";
  } else if (id === "dash_btn_xprange_2040") {
    patchGuildConfig(guildId, { xpMin: 20, xpMax: 40 });
    refreshSection = "dash_xp";
  } else if (id === "dash_btn_xprange_3060") {
    patchGuildConfig(guildId, { xpMin: 30, xpMax: 60 });
    refreshSection = "dash_xp";
  }

  // Role settings
  else if (id === "dash_btn_toggle_keeproles") {
    const config = getGuildConfig(guildId);
    patchGuildConfig(guildId, { keepOldRoles: !config.keepOldRoles });
    refreshSection = "dash_roles";
  }

  // Multiplier presets
  else if (id === "dash_btn_multi_server_1") {
    patchGuildConfig(guildId, { serverMultiplier: 1.0 });
    refreshSection = "dash_multi";
  } else if (id === "dash_btn_multi_server_15") {
    patchGuildConfig(guildId, { serverMultiplier: 1.5 });
    refreshSection = "dash_multi";
  } else if (id === "dash_btn_multi_server_2") {
    patchGuildConfig(guildId, { serverMultiplier: 2.0 });
    refreshSection = "dash_multi";
  } else if (id === "dash_btn_multi_server_3") {
    patchGuildConfig(guildId, { serverMultiplier: 3.0 });
    refreshSection = "dash_multi";
  } else if (id === "dash_btn_multi_event_reset") {
    patchGuildConfig(guildId, { eventMultiplier: 1.0 });
    refreshSection = "dash_multi";
  }

  // Weekly reset
  else if (id === "dash_btn_weekly_reset") {
    resetWeeklyXp(guildId);
    setLastWeeklyReset(Date.now());
    refreshSection = "dash_weekly";
  }

  // Level-up message settings
  else if (id === "dash_btn_toggle_announcements") {
    const config = getGuildConfig(guildId);
    patchGuildConfig(guildId, { announcements: !config.announcements });
    refreshSection = "dash_levelup";
  } else if (id === "dash_btn_toggle_ping") {
    const config = getGuildConfig(guildId);
    patchGuildConfig(guildId, { pingOnLevelUp: !config.pingOnLevelUp });
    refreshSection = "dash_levelup";
  }

  // Anti-spam
  else if (id === "dash_btn_toggle_antispam") {
    const config = getGuildConfig(guildId);
    patchGuildConfig(guildId, { antiSpamEnabled: config.antiSpamEnabled === false ? true : false });
    refreshSection = "dash_antispam";
  }

  if (refreshSection) {
    const { embeds, components } = renderSection(guildId, refreshSection);
    await i.editReply({ embeds, components });
  }
}
