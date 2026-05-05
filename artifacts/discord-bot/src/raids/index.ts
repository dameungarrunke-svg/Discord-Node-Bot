import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  TextChannel,
  ThreadAutoArchiveDuration,
} from "discord.js";
import { saveRaidResult, nextRaidNumber } from "./store.js";

const ADMIN = PermissionFlagsBits.ManageGuild;

// ─── Helpers shared by /endraid ──────────────────────────────────────────────

function shortDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatPerformers(raw: string): string {
  const list = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (list.length === 0) return raw;
  return list
    .map((name, i) => `${String(i + 1).padStart(2, "0")}  ${name}`)
    .join("\n");
}

function findChannel(
  interaction: ChatInputCommandInteraction,
  ...keywords: string[]
): TextChannel | null {
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

// ─── Roblox API helpers ───────────────────────────────────────────────────────

async function getRobloxUserId(username: string): Promise<number | null> {
  try {
    const res = await fetch("https://users.roblox.com/v1/usernames/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usernames: [username], excludeBannedUsers: false }),
    });
    const data = (await res.json()) as { data?: { id: number }[] };
    return data.data?.[0]?.id ?? null;
  } catch {
    return null;
  }
}

async function getRobloxAvatar(userId: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=false`
    );
    const data = (await res.json()) as { data?: { imageUrl?: string }[] };
    return data.data?.[0]?.imageUrl ?? null;
  } catch {
    return null;
  }
}

// ─── /startraid ───────────────────────────────────────────────────────────────

function raidColor(type: string): number {
  if (type === "IMPORTANT RAID" || type === "Serious Raid") return 0x8b0000;
  return 0x2b2d31;
}

export const startRaidData = new SlashCommandBuilder()
  .setName("startraid")
  .setDescription("Deploy a raid callout to the server.")
  .setDefaultMemberPermissions(ADMIN)
  .addStringOption((o) =>
    o
      .setName("type")
      .setDescription("Type of raid")
      .setRequired(true)
      .addChoices(
        { name: "Normal Raid",    value: "Normal Raid"    },
        { name: "Serious Raid",   value: "Serious Raid"   },
        { name: "IMPORTANT RAID", value: "IMPORTANT RAID" },
        { name: "Teamer Raid",    value: "Teamer Raid"    }
      )
  )
  .addStringOption((o) =>
    o
      .setName("roblox_username")
      .setDescription("Your Roblox username")
      .setRequired(true)
  )
  .addStringOption((o) =>
    o
      .setName("roblox_profile")
      .setDescription("Your Roblox profile URL (https://...) — optional")
      .setRequired(false)
  )
  .addStringOption((o) =>
    o
      .setName("join_server")
      .setDescription("Roblox game / server link (https://...)")
      .setRequired(true)
  )
  .addStringOption((o) =>
    o
      .setName("allies")
      .setDescription("Allied clans joining the raid")
      .setRequired(true)
  )
  .addStringOption((o) =>
    o
      .setName("enemies")
      .setDescription("Enemy clans / target group")
      .setRequired(true)
  )
  .addRoleOption((o) =>
    o
      .setName("raid_role")
      .setDescription("Raid role to ping alongside @everyone (optional)")
      .setRequired(false)
  );

export async function executeStartRaid(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const raidType      = interaction.options.getString("type",            true);
  const robloxUser    = interaction.options.getString("roblox_username", true);
  const robloxProfile = interaction.options.getString("roblox_profile");
  const joinServer    = interaction.options.getString("join_server",     true);
  const allies        = interaction.options.getString("allies",          true);
  const enemies       = interaction.options.getString("enemies",         true);
  const raidRole      = interaction.options.getRole("raid_role");

  const channel = interaction.channel as TextChannel | null;
  if (!channel) {
    await interaction.editReply({ content: "❌ Cannot post in this channel." });
    return;
  }

  // Fetch Roblox avatar thumbnail (best-effort — doesn't block on failure)
  let avatarUrl: string | null = null;
  const userId = await getRobloxUserId(robloxUser);
  if (userId) avatarUrl = await getRobloxAvatar(userId);

  const nowUnix = Math.floor(Date.now() / 1000);

  const embed = new EmbedBuilder()
    .setColor(raidColor(raidType))
    .setDescription(
      `⚔️ **${raidType}** · 🟢 Ongoing\n\n` +
      `🎮 **Roblox:** ${robloxUser}\n` +
      `💬 **Discord:** <@${interaction.user.id}>\n` +
      `⏱️ **Started:** <t:${nowUnix}:R>\n` +
      `🤝 **Allies:** ${allies}\n` +
      `💀 **Enemies:** ${enemies}`
    );

  if (avatarUrl) embed.setThumbnail(avatarUrl);

  // Row 1 — link buttons (Roblox Profile only shown if URL was provided)
  const row1Buttons: ButtonBuilder[] = [];
  if (robloxProfile) {
    row1Buttons.push(
      new ButtonBuilder()
        .setLabel("🔍 Roblox Profile")
        .setStyle(ButtonStyle.Link)
        .setURL(robloxProfile)
    );
  }
  row1Buttons.push(
    new ButtonBuilder()
      .setLabel("🔗 Join Server")
      .setStyle(ButtonStyle.Link)
      .setURL(joinServer)
  );
  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(...row1Buttons);

  // Ping content — @everyone and the raid role if provided
  const roleSnowflakes: string[] = [];
  if (raidRole) roleSnowflakes.push(raidRole.id);

  const pingContent = raidRole ? `@everyone ${raidRole}` : `@everyone`;

  const raidMsg = await channel.send({
    content: pingContent,
    embeds: [embed],
    components: [row1],
    allowedMentions: { parse: ["everyone"], roles: roleSnowflakes },
  });

  // Create a thread for raid chat, then append "Chat Here" button
  try {
    const thread = await raidMsg.startThread({
      name: `${raidType} — Chat Here`,
      autoArchiveDuration: ThreadAutoArchiveDuration.OneHour,
    });
    const threadUrl = `https://discord.com/channels/${interaction.guildId}/${thread.id}`;
    const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel(`💬 ${raidType} — Chat Here`)
        .setStyle(ButtonStyle.Link)
        .setURL(threadUrl)
    );
    await raidMsg.edit({ components: [row1, row2] });
  } catch {
    // Thread creation is best-effort — callout is still live without it
  }

  await interaction.editReply({ content: `✅ Raid callout deployed.` });
}

// ─── /endraid ─────────────────────────────────────────────────────────────────

export const endRaidData = new SlashCommandBuilder()
  .setName("endraid")
  .setDescription("Close an active raid and post the match results.")
  .addStringOption((o) =>
    o.setName("clan_name").setDescription("Your clan name (LS)").setRequired(true)
  )
  .addStringOption((o) =>
    o.setName("opponent_clan").setDescription("Opponent clan name").setRequired(true)
  )
  .addStringOption((o) =>
    o
      .setName("result")
      .setDescription("Raid outcome")
      .setRequired(true)
      .addChoices(
        { name: "Victory — We won",          value: "victory"   },
        { name: "Defeat — We lost",           value: "defeat"    },
        { name: "Draw — It was even",         value: "draw"      },
        { name: "Contested — Unclear result", value: "contested" }
      )
  )
  .addStringOption((o) =>
    o
      .setName("top_performers")
      .setDescription("Top performers (comma-separated: user1, user2, user3)")
      .setRequired(true)
  )
  .addStringOption((o) =>
    o
      .setName("notes")
      .setDescription("Commander's notes — format: username — note (optional)")
      .setRequired(false)
  );

export async function executeEndRaid(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const clanName      = interaction.options.getString("clan_name",      true);
  const opponentClan  = interaction.options.getString("opponent_clan",  true);
  const result        = interaction.options.getString("result",         true);
  const topPerformers = interaction.options.getString("top_performers", true);
  const notes         = interaction.options.getString("notes");

  const raidNumber = nextRaidNumber();

  type Outcome = {
    authorLabel: string;
    outcomeDisplay: string;
    color: number;
  };

  const outcomeMap: Record<string, Outcome> = {
    victory:   { authorLabel: "◇  VICTORY",   outcomeDisplay: "🟢 WIN",       color: 0x16a34a },
    defeat:    { authorLabel: "◇  DEFEAT",     outcomeDisplay: "🔴 LOSS",      color: 0xb91c1c },
    draw:      { authorLabel: "◇  DRAW",       outcomeDisplay: "🟡 DRAW",      color: 0xd97706 },
    contested: { authorLabel: "◇  CONTESTED",  outcomeDisplay: "🟣 CONTESTED", color: 0x7c3aed },
  };

  const outcome = outcomeMap[result] ?? outcomeMap.draw;

  const fields: { name: string; value: string; inline?: boolean }[] = [
    {
      name: "TOP PERFORMERS",
      value: formatPerformers(topPerformers),
    },
  ];

  if (notes) {
    fields.push({
      name: "COMMANDER'S NOTES",
      value: `*${notes}*`,
    });
  }

  const embed = new EmbedBuilder()
    .setColor(outcome.color)
    .setAuthor({
      name: outcome.authorLabel,
      iconURL: interaction.guild?.iconURL() ?? undefined,
    })
    .setTitle(`${clanName}  ——  ${opponentClan}`)
    .setDescription(
      `> Outcome · ${outcome.outcomeDisplay}\n` +
      `> Date · ${shortDate()}`
    )
    .addFields(fields)
    .setFooter({
      text: `Raid #${raidNumber}  ·  Logged by ${interaction.user.username}`,
      iconURL: interaction.user.displayAvatarURL(),
    })
    .setTimestamp();

  saveRaidResult({
    id: `${Date.now()}`,
    clanName,
    opponentClan,
    result,
    topPerformers,
    notes: notes ?? "—",
    endedBy: interaction.user.tag,
    endedById: interaction.user.id,
    timestamp: new Date().toISOString(),
    guildId: interaction.guildId ?? "",
    raidNumber,
  });

  const resultsChannel = findChannel(interaction, "raid-results", "ʀᴀɪᴅ-ʀᴇsᴜʟᴛs");

  if (resultsChannel) {
    await resultsChannel.send({ embeds: [embed] });
    await interaction.editReply({
      content: `✅ Raid #${raidNumber} results posted to ${resultsChannel}.`,
    });
  } else {
    const ch = interaction.channel as TextChannel | null;
    if (ch) await ch.send({ embeds: [embed] });
    await interaction.editReply({
      content: `✅ Raid #${raidNumber} concluded and results logged.`,
    });
  }
}
