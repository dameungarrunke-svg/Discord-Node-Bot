// ─── MODERATION — Professional Warn + Auto-Timeout System ────────────────────
// Commands: `lowo warn @user <reason>`  |  `lowo clearwarn @user <amount>`
// Permission required: ManageMessages OR ModerateMembers (Discord guild perm)
// Punishment ladder:
//   1–2 warns → DM only
//   3 warns   → 1-hour timeout
//   4 warns   → 12-hour timeout
//   5+ warns  → 24-hour timeout (permanent escalation)

import {
  EmbedBuilder, PermissionFlagsBits,
  type Message, type GuildMember,
} from "discord.js";
import { getUser, updateUser } from "./storage.js";

const HOUR = 60 * 60 * 1000;

function timeoutDuration(warnCount: number): number | null {
  if (warnCount === 3) return 1 * HOUR;
  if (warnCount === 4) return 12 * HOUR;
  if (warnCount >= 5)  return 24 * HOUR;
  return null;
}

function timeoutLabel(warnCount: number): string | null {
  if (warnCount === 3) return "1 Hour Timeout";
  if (warnCount === 4) return "12 Hour Timeout";
  if (warnCount >= 5)  return "24 Hour Timeout";
  return null;
}

function hasModPerms(member: GuildMember): boolean {
  return (
    member.permissions.has(PermissionFlagsBits.Administrator) ||
    member.permissions.has(PermissionFlagsBits.ManageMessages) ||
    member.permissions.has(PermissionFlagsBits.ModerateMembers)
  );
}

async function sendPunishmentDM(
  target: GuildMember,
  moderator: GuildMember,
  reason: string,
  warnCount: number,
): Promise<void> {
  const punishment = timeoutLabel(warnCount) ?? "Warning";

  const embed = new EmbedBuilder()
    .setColor(0xE74C3C)
    .setTitle("❗ Punishment Issued")
    .setDescription(
      "You received a punishment from our staff for breaking server rules. " +
      "Please revise the rules again, and check the details of your punishment below.",
    )
    .addFields(
      { name: "• Punishment", value: punishment, inline: false },
      { name: "• Moderator", value: `<@${moderator.id}>`, inline: false },
      { name: "• Reason", value: reason, inline: false },
      { name: "• Warn Count", value: `${warnCount}`, inline: false },
      {
        name: "• Punishment Schedule",
        value: "3 warns → **1 Hour** Timeout\n4 warns → **12 Hour** Timeout\n5+ warns → **24 Hour** Timeout",
        inline: false,
      },
    )
    .setFooter({ text: `${target.guild.name} Moderation Team` })
    .setTimestamp();

  try {
    await target.send({ embeds: [embed] });
  } catch {
    // DMs may be disabled — silently skip
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CMD: lowo warn @user <reason>
// ═══════════════════════════════════════════════════════════════════════════════
export async function cmdWarn(message: Message, args: string[]): Promise<void> {
  if (!message.guild) {
    await message.reply("❌ This command can only be used in a server.");
    return;
  }

  const mod = message.member as GuildMember;
  if (!hasModPerms(mod)) {
    await message.reply("🔒 You need **Manage Messages** or **Timeout Members** permission to use this command.");
    return;
  }

  // Use .users (populated directly from mention data, no cache needed)
  const targetUser = message.mentions.users.first();
  if (!targetUser) {
    await message.reply("Usage: `lowo warn @user <reason>`");
    return;
  }
  if (targetUser.id === message.author.id) {
    await message.reply("❌ You cannot warn yourself.");
    return;
  }
  if (targetUser.bot) {
    await message.reply("❌ You cannot warn bots.");
    return;
  }

  // Fetch the GuildMember (needed for timeout + DM)
  let targetMember: GuildMember | null = null;
  try {
    targetMember = await message.guild.members.fetch(targetUser.id);
  } catch {
    await message.reply("❌ Could not find that user in this server.");
    return;
  }

  const reasonTokens = args.filter((a) => !/^<@!?\d+>$/.test(a));
  const reason = reasonTokens.join(" ").trim() || "No reason provided.";

  updateUser(targetUser.id, (x) => { x.warnCount = (x.warnCount ?? 0) + 1; });
  const warnCount = getUser(targetUser.id).warnCount;

  const duration = timeoutDuration(warnCount);
  let timedOut = false;
  if (duration !== null && targetMember) {
    try {
      await targetMember.timeout(duration, `Warn #${warnCount} — ${reason}`);
      timedOut = true;
    } catch {
      // Bot may lack permissions or target is above bot in hierarchy
    }
  }

  if (targetMember) await sendPunishmentDM(targetMember, mod, reason, warnCount);

  const label = timeoutLabel(warnCount);
  const embed = new EmbedBuilder()
    .setColor(warnCount >= 5 ? 0xE74C3C : warnCount >= 3 ? 0xE67E22 : 0xF1C40F)
    .setTitle("⚠️ Moderation Action")
    .addFields(
      { name: "• User", value: `<@${targetUser.id}>`, inline: true },
      { name: "• Moderator", value: `<@${message.author.id}>`, inline: true },
      { name: "• Reason", value: reason, inline: false },
      { name: "• Total Warns", value: `${warnCount}`, inline: true },
      {
        name: "• Action",
        value: label
          ? (timedOut ? `⏱️ **${label}** applied.` : `⏱️ **${label}** — could not apply *(check bot role/permissions)*.`)
          : "DM notification sent.",
        inline: true,
      },
      { name: "• Schedule", value: "3 = 1 hr · 4 = 12 hr · 5+ = 24 hr", inline: false },
    )
    .setTimestamp()
    .setFooter({ text: `Warned by ${message.author.tag}` });

  await message.reply({ embeds: [embed] });
}

// ═══════════════════════════════════════════════════════════════════════════════
// CMD: lowo clearwarn @user <amount>
// ═══════════════════════════════════════════════════════════════════════════════
export async function cmdClearWarn(message: Message, args: string[]): Promise<void> {
  if (!message.guild) {
    await message.reply("❌ This command can only be used in a server.");
    return;
  }

  const mod = message.member as GuildMember;
  if (!hasModPerms(mod)) {
    await message.reply("🔒 You need **Manage Messages** or **Timeout Members** permission to use this command.");
    return;
  }

  const targetUser = message.mentions.users.first();
  if (!targetUser) {
    await message.reply("Usage: `lowo clearwarn @user <amount>`");
    return;
  }

  const cleaned = args.filter((a) => !/^<@!?\d+>$/.test(a));
  const amtStr = cleaned.find((a) => /^\d+$/.test(a));
  if (!amtStr) {
    await message.reply("Usage: `lowo clearwarn @user <amount>`\n_e.g. `lowo clearwarn @user 2` removes 2 warns._");
    return;
  }
  const amount = Math.max(1, parseInt(amtStr, 10));

  updateUser(targetUser.id, (x) => {
    x.warnCount = Math.max(0, (x.warnCount ?? 0) - amount);
  });
  const newTotal = getUser(targetUser.id).warnCount;

  const nextThreshold =
    newTotal < 3 ? `${3 - newTotal} more warn(s) until 1-hour timeout`
    : newTotal < 4 ? "1 more warn until 12-hour timeout"
    : newTotal < 5 ? "1 more warn until 24-hour timeout"
    : "At/above 5 — next warn = 24-hour timeout";

  const embed = new EmbedBuilder()
    .setColor(0x2ECC71)
    .setTitle("✅ Warns Cleared")
    .addFields(
      { name: "• User", value: `<@${targetUser.id}>`, inline: true },
      { name: "• Removed", value: `${amount}`, inline: true },
      { name: "• New Total", value: `${newTotal}`, inline: true },
      { name: "• Next Threshold", value: nextThreshold, inline: false },
    )
    .setTimestamp()
    .setFooter({ text: `Actioned by ${message.author.tag}` });

  await message.reply({ embeds: [embed] });
}
