/**
 * Shared UI helpers for the v6.1 "UI/UX Overhaul" — every public Lowo command
 * should funnel its replies through these to keep the look & feel consistent.
 *
 *   • Fixed rarity hex colors (`RARITY_HEX`)
 *   • Text-based progress bars (`progressBar`)
 *   • Code-block value formatter (`val`)
 *   • Reply helpers (`replyEmbed`, `successEmbed`, `errorEmbed`, `warnEmbed`,
 *     `infoEmbed`, `catchCardEmbed`)
 *   • Consistent session footer (`sessionFooter`)
 *   • Shop button row (`shopButtonsRow` — used for the main menu)
 *   • Auto-self-destruct utility error reply (`replySelfDestruct`)
 */
import {
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  type Message, type APIEmbedField, type ColorResolvable, type User,
} from "discord.js";
import type { Animal, Rarity } from "./data.js";
import { getUser } from "./storage.js";

// ─── Rarity → fixed accent hex (the "Accents" rule) ─────────────────────────
export const RARITY_HEX: Record<Rarity, number> = {
  common:       0x9aa0a6,
  uncommon:     0x4ade80,
  rare:         0x3b82f6,
  epic:         0xa855f7,
  mythic:       0xeab308,
  legendary:    0xf97316,
  ethereal:     0x67e8f9,
  divine:       0xfde047,
  omni:         0xfacc15,
  glitched:     0xef4444,
  inferno:      0xff5722,
  cosmic:       0x7c3aed,
  void:         0x000000,
  secret:       0xff00ff,
  supreme:      0xffb84a,
  transcendent: 0x90e0ff,
};

export const COLOR = {
  brand:    0xff7a3c,  // signature lowo orange
  success:  0x22c55e,
  error:    0xef4444,
  warn:     0xfacc15,
  info:     0x3b82f6,
  market:   0x10b981,
  shop:     0xeab308,
  battle:   0xdc2626,
  hunt:     0x16a34a,
  profile:  0x8b5cf6,
  prestige: 0xfbbf24,
  void:     0x111827,
  heaven:   0x93c5fd,
  volcanic: 0xea580c,
  space:    0x6366f1,
} as const;

export function rarityColor(r?: Rarity | null): number {
  if (!r) return COLOR.brand;
  return RARITY_HEX[r] ?? COLOR.brand;
}

// ─── Number / value styling ─────────────────────────────────────────────────
/** Wrap a number/string in single backticks and locale-format numbers. */
export function val(n: number | string): string {
  if (typeof n === "number") return `\`${n.toLocaleString()}\``;
  return `\`${n}\``;
}

// ─── Text progress bar — `[▰▰▰▱▱▱▱▱▱▱] 30%` style ───────────────────────────
export function progressBar(value: number, max: number, length = 10): string {
  if (max <= 0) return `[${"▱".repeat(length)}] 0%`;
  const pct = Math.max(0, Math.min(1, value / max));
  const filled = Math.round(pct * length);
  const bar = "▰".repeat(filled) + "▱".repeat(Math.max(0, length - filled));
  return `[${bar}] ${Math.round(pct * 100)}%`;
}

// ─── Footer with the user's session stats ───────────────────────────────────
export function sessionFooter(message: Message, user: User = message.author): { text: string; iconURL?: string } {
  const u = getUser(user.id);
  const animals = Object.values(u.zoo).reduce((a: number, b: number) => a + b, 0);
  const text =
    `${user.username}  •  Hunts: ${u.huntsTotal ?? 0}  •  ` +
    `Cwn: ${u.cowoncy.toLocaleString()}  •  Ess: ${u.essence.toLocaleString()}  •  ` +
    `Cash: ${u.lowoCash}  •  Pets: ${animals}`;
  return { text, iconURL: user.displayAvatarURL({ size: 64 }) };
}

// ─── Base embed factory — applies brand color + footer ──────────────────────
export function baseEmbed(message: Message, color: ColorResolvable = COLOR.brand): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(color)
    .setFooter(sessionFooter(message))
    .setTimestamp(new Date());
}

// ─── Quick-success / error / warn / info shortcuts ──────────────────────────
function withTitle(e: EmbedBuilder, prefix: string, title: string): EmbedBuilder {
  return e.setTitle(`${prefix} ${title}`);
}
export function successEmbed(message: Message, title: string, body?: string): EmbedBuilder {
  const e = withTitle(baseEmbed(message, COLOR.success), "✅", title);
  if (body) e.setDescription(body);
  return e;
}
export function errorEmbed(message: Message, title: string, body?: string): EmbedBuilder {
  const e = withTitle(baseEmbed(message, COLOR.error), "❌", title);
  if (body) e.setDescription(body);
  return e;
}
export function warnEmbed(message: Message, title: string, body?: string): EmbedBuilder {
  const e = withTitle(baseEmbed(message, COLOR.warn), "⚠️", title);
  if (body) e.setDescription(body);
  return e;
}
export function infoEmbed(message: Message, title: string, body?: string): EmbedBuilder {
  const e = withTitle(baseEmbed(message, COLOR.info), "ℹ️", title);
  if (body) e.setDescription(body);
  return e;
}

// ─── Reply helpers ──────────────────────────────────────────────────────────
export async function replyEmbed(
  message: Message,
  embed: EmbedBuilder,
  components?: ActionRowBuilder<ButtonBuilder>[],
): Promise<void> {
  await message.reply({
    embeds: [embed],
    ...(components ? { components } : {}),
    allowedMentions: { repliedUser: false, parse: [] },
  });
}

export async function replyEmbeds(
  message: Message,
  embeds: EmbedBuilder[],
  components?: ActionRowBuilder<ButtonBuilder>[],
): Promise<void> {
  await message.reply({
    embeds,
    ...(components ? { components } : {}),
    allowedMentions: { repliedUser: false, parse: [] },
  });
}

/** For utility-style errors (e.g. "unknown command") — auto-deletes after N ms. */
export async function replySelfDestruct(message: Message, embed: EmbedBuilder, ms = 8000): Promise<void> {
  const reply = await message.reply({
    embeds: [embed],
    allowedMentions: { repliedUser: false, parse: [] },
  }).catch(() => null);
  if (reply) setTimeout(() => { reply.delete().catch(() => {}); }, ms);
}

// ─── "Catch Card" — used by `lowo hunt` for caught animals ──────────────────
export function catchCardEmbed(
  message: Message,
  animal: Animal,
  opts: { areaTag?: string; mutationLabel?: string | null; pity?: boolean; autosold?: boolean } = {},
): EmbedBuilder {
  const fields: APIEmbedField[] = [
    { name: "Rarity",  value: `\`[ ${animal.rarity.toUpperCase()} ]\``, inline: true },
    { name: "HP",      value: val(animal.hp),  inline: true },
    { name: "ATK",     value: val(animal.atk), inline: true },
    { name: "DEF",     value: val(animal.def), inline: true },
    { name: "MAG",     value: val(animal.mag), inline: true },
    { name: "Sells",   value: `${val(animal.sellPrice)} 🪙`, inline: true },
  ];
  const flags: string[] = [];
  if (opts.pity)         flags.push("🎯 **PITY!**");
  if (opts.autosold)     flags.push("💸 *auto-sold*");
  if (opts.mutationLabel) flags.push(opts.mutationLabel);
  const desc = [
    `### ${animal.emoji} ${animal.name}`,
    opts.areaTag ? `*${opts.areaTag}*` : null,
    flags.length ? flags.join("  •  ") : null,
  ].filter(Boolean).join("\n");

  return baseEmbed(message, rarityColor(animal.rarity))
    .setAuthor({ name: `✨ ${message.author.username} caught a new ${animal.rarity}!`, iconURL: message.author.displayAvatarURL({ size: 64 }) })
    .setTitle(`✨ NEW CATCH ✨`)
    .setDescription(desc)
    .addFields(fields);
}

// ─── Shop main-menu button row (ActionRow with shop categories) ─────────────
export const SHOP_BUTTON_PREFIX = "lowo:shop:";

const PRIMARY_SHOP_BUTTONS: Array<{ id: string; label: string; emoji: string; style: ButtonStyle }> = [
  { id: "items",       label: "Items",       emoji: "🧪", style: ButtonStyle.Primary   },
  { id: "equips",      label: "Equips",      emoji: "🛡️", style: ButtonStyle.Primary   },
  { id: "pets",        label: "Pets",        emoji: "🐾", style: ButtonStyle.Primary   },
  { id: "premium",     label: "Premium",     emoji: "💎", style: ButtonStyle.Success   },
  { id: "gamepasses",  label: "Gamepasses",  emoji: "🎫", style: ButtonStyle.Secondary },
];
const SECONDARY_SHOP_BUTTONS: Array<{ id: string; label: string; emoji: string; style: ButtonStyle }> = [
  { id: "events",       label: "Events",      emoji: "🎉", style: ButtonStyle.Secondary },
  { id: "essence",      label: "Essence",     emoji: "✨", style: ButtonStyle.Secondary },
  { id: "mining",       label: "Mining",      emoji: "⛏️", style: ButtonStyle.Secondary },
  { id: "skills",       label: "Skills",      emoji: "🧠", style: ButtonStyle.Secondary },
  { id: "team_slots",   label: "Team Slots",  emoji: "👥", style: ButtonStyle.Secondary },
];

function buildRow(invokerId: string, defs: typeof PRIMARY_SHOP_BUTTONS): ActionRowBuilder<ButtonBuilder> {
  const row = new ActionRowBuilder<ButtonBuilder>();
  for (const b of defs) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`${SHOP_BUTTON_PREFIX}${b.id}:${invokerId}`)
        .setLabel(b.label)
        .setEmoji(b.emoji)
        .setStyle(b.style),
    );
  }
  return row;
}

/** Two action rows of shop category buttons, scoped to the invoking user. */
export function shopButtonsRows(invokerId: string): ActionRowBuilder<ButtonBuilder>[] {
  return [buildRow(invokerId, PRIMARY_SHOP_BUTTONS), buildRow(invokerId, SECONDARY_SHOP_BUTTONS)];
}

// ─── Inline-field grid helper ───────────────────────────────────────────────
/** Build an array of inline stat fields from a {label: value} object. */
export function statsGrid(stats: Record<string, string | number>): APIEmbedField[] {
  return Object.entries(stats).map(([name, v]) => ({
    name,
    value: typeof v === "number" ? val(v) : v,
    inline: true,
  }));
}
