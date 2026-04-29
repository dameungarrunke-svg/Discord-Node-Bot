/**
 * Shared UI helpers for the v6.1 / v6.2 "Elite Edition" UI overhaul.
 * Every public Lowo command should funnel its replies through these so the
 * look & feel stays consistent.
 *
 *   • Fixed rarity hex colors  (`RARITY_HEX`)
 *   • Per-rarity flavor text   (`RARITY_FLAVOR`)
 *   • Code-block value         (`val`)
 *   • Two progress-bar styles  (`progressBar` ▰▱ • `progressBarBlocks` ▓░)
 *   • Reply helpers            (`sendLowoEmbed`, `replyEmbed`, `successEmbed`,
 *                               `errorEmbed`, `warnEmbed`, `infoEmbed`,
 *                               `catchCardEmbed`)
 *   • Consistent footer        (`sessionFooter`)
 *   • Shop button row          (`shopButtonsRows`)
 *   • Zoo pager buttons        (`pagerButtons`, `ZOO_BUTTON_PREFIX`)
 *   • Self-destruct util reply (`replySelfDestruct`)
 */
import {
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  type Message, type APIEmbedField, type ColorResolvable, type User,
  type AttachmentBuilder,
} from "discord.js";
import type { Animal, Rarity } from "./data.js";
import { getUser } from "./storage.js";

// ─── Rarity → fixed accent hex (per the "Elite Edition" spec) ──────────────
export const RARITY_HEX: Record<Rarity, number> = {
  common:       0xB9BBBE,  // Discord gray
  uncommon:     0x4ade80,
  rare:         0x3b82f6,
  epic:         0xa855f7,
  mythic:       0xFF00FF,  // neon pink
  legendary:    0xf97316,
  ethereal:     0x67e8f9,
  divine:       0xfde047,
  omni:         0x00FFFF,  // cyan
  glitched:     0xef4444,
  inferno:      0xff5722,
  cosmic:       0x7c3aed,
  void:         0x1A1A1A,  // deep black
  secret:       0xff77ff,
  supreme:      0xffb84a,
  transcendent: 0x90e0ff,
};

export const COLOR = {
  brand:    0xff7a3c,
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

// ─── Per-rarity flavor text (used by Catch Cards) ──────────────────────────
export const RARITY_FLAVOR: Record<Rarity, string> = {
  common:       "A common find — but every legend starts somewhere.",
  uncommon:     "A spark of something more glimmers in the brush.",
  rare:         "A glimmer in the wild — fortune favors the bold.",
  epic:         "Epic energy crackles through the air.",
  mythic:       "Mythic forces stir as it steps into view…",
  legendary:    "A legendary presence shakes the ground beneath your feet.",
  ethereal:     "The veil between worlds thins and parts before you.",
  divine:       "Divine light pierces through the canopy.",
  omni:         "All things bend toward this being.",
  glitched:     "Reality stutters — what *is* this?!",
  inferno:      "Hellfire roars in its wake.",
  cosmic:       "The stars realign for a single, perfect moment.",
  void:         "Silence. The void answers your call.",
  secret:       "A secret meant for no one — yours alone.",
  supreme:      "Supreme. Untouchable. Yours.",
  transcendent: "Beyond mortal comprehension — you have transcended.",
};

// ─── Number / value styling ─────────────────────────────────────────────────
/** Wrap a number/string in single backticks and locale-format numbers. */
export function val(n: number | string): string {
  if (typeof n === "number") return `\`${n.toLocaleString()}\``;
  return `\`${n}\``;
}

// ─── Progress bars ──────────────────────────────────────────────────────────
/** Triangle bar: `[▰▰▰▱▱▱▱▱▱▱] 30%` */
export function progressBar(value: number, max: number, length = 10): string {
  if (max <= 0) return `[${"▱".repeat(length)}] 0%`;
  const pct = Math.max(0, Math.min(1, value / max));
  const filled = Math.round(pct * length);
  const bar = "▰".repeat(filled) + "▱".repeat(Math.max(0, length - filled));
  return `[${bar}] ${Math.round(pct * 100)}%`;
}
/** Hi-fi block bar: `[▓▓▓▓▓▓▓░░░] 70%` (used for the v6.2 Pity bar). */
export function progressBarBlocks(value: number, max: number, length = 10): string {
  if (max <= 0) return `[${"░".repeat(length)}] 0%`;
  const pct = Math.max(0, Math.min(1, value / max));
  const filled = Math.round(pct * length);
  const bar = "▓".repeat(filled) + "░".repeat(Math.max(0, length - filled));
  return `[${bar}] ${Math.round(pct * 100)}%`;
}

// ─── Footer with the user's session stats ───────────────────────────────────
/** User-only footer (no `Message` required — works in interaction handlers). */
export function sessionFooterFor(viewer: User): { text: string; iconURL?: string } {
  const u = getUser(viewer.id);
  const animals = Object.values(u.zoo).reduce((a: number, b: number) => a + b, 0);
  const text =
    `${viewer.username}  •  Hunts: ${u.huntsTotal ?? 0}  •  ` +
    `Cwn: ${u.cowoncy.toLocaleString()}  •  Ess: ${u.essence.toLocaleString()}  •  ` +
    `Cash: ${u.lowoCash}  •  Pets: ${animals}`;
  return { text, iconURL: viewer.displayAvatarURL({ size: 64 }) };
}
export function sessionFooter(message: Message, user: User = message.author): { text: string; iconURL?: string } {
  return sessionFooterFor(user);
}

// ─── Base embed factory — applies brand color + footer ──────────────────────
/** User-only embed factory (no `Message` required — works in button handlers). */
export function baseEmbedFor(viewer: User, color: ColorResolvable = COLOR.brand): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(color)
    .setFooter(sessionFooterFor(viewer))
    .setTimestamp(new Date());
}
export function baseEmbed(message: Message, color: ColorResolvable = COLOR.brand): EmbedBuilder {
  return baseEmbedFor(message.author, color);
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

/**
 * v6.2 — One-stop builder/sender. Pass color + title + fields and we'll handle
 * the EmbedBuilder + footer + reply for you.  All `fields` default to inline
 * unless you explicitly set `inline: false`.
 */
export interface SendLowoEmbedOpts {
  color?: ColorResolvable;
  title?: string;
  description?: string;
  author?: { name: string; iconURL?: string };
  thumbnail?: string;
  image?: string;
  fields?: APIEmbedField[];
  files?: AttachmentBuilder[];
  components?: ActionRowBuilder<ButtonBuilder>[];
  /** For the pity / xp bar style descriptions. */
  inlineDefault?: boolean;
}
export async function sendLowoEmbed(message: Message, opts: SendLowoEmbedOpts): Promise<void> {
  const e = baseEmbed(message, opts.color ?? COLOR.brand);
  if (opts.title)       e.setTitle(opts.title);
  if (opts.description) e.setDescription(opts.description);
  if (opts.author)      e.setAuthor(opts.author);
  if (opts.thumbnail)   e.setThumbnail(opts.thumbnail);
  if (opts.image)       e.setImage(opts.image);
  if (opts.fields?.length) {
    const dflt = opts.inlineDefault ?? true;
    e.addFields(opts.fields.map((f) => ({ ...f, inline: f.inline ?? dflt })));
  }
  await message.reply({
    embeds: [e],
    ...(opts.files     ? { files: opts.files }           : {}),
    ...(opts.components ? { components: opts.components } : {}),
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

// ─── "Catch Card" — used by `lowo hunt` for caught animals (v6.2 hero) ─────
export function catchCardEmbed(
  message: Message,
  animal: Animal,
  opts: { areaTag?: string; mutationLabel?: string | null; pity?: boolean; autosold?: boolean } = {},
): EmbedBuilder {
  const flavor = RARITY_FLAVOR[animal.rarity] ?? "";
  const flagsLine: string[] = [];
  if (opts.pity)          flagsLine.push("🎯 **PITY!**");
  if (opts.autosold)      flagsLine.push("💸 *auto-sold*");
  if (opts.mutationLabel) flagsLine.push(opts.mutationLabel);

  // Hero-style description: name, area tag, divider, flavor text, flags.
  const desc = [
    `### ${animal.emoji} ${animal.name}`,
    opts.areaTag ? `*${opts.areaTag}*` : null,
    "─────────────────────",
    flavor ? `*${flavor}*` : null,
    flagsLine.length ? flagsLine.join("  •  ") : null,
  ].filter(Boolean).join("\n");

  // 2 × 2 stat grid + rarity + sell-price (all inline, code-block values).
  const fields: APIEmbedField[] = [
    { name: "Rarity",  value: `\`[ ${animal.rarity.toUpperCase()} ]\``, inline: true },
    { name: "💰 Sells", value: `${val(animal.sellPrice)} cwn`,           inline: true },
    { name: "✨ Essence", value: val(animal.essence),                    inline: true },
    { name: "❤️ HP",   value: val(animal.hp),  inline: true },
    { name: "⚔️ ATK",  value: val(animal.atk), inline: true },
    { name: "\u200b",   value: "\u200b",        inline: true }, // spacer → forces 2×2 below
    { name: "🛡️ DEF",  value: val(animal.def), inline: true },
    { name: "🔮 MAG",  value: val(animal.mag), inline: true },
    { name: "\u200b",   value: "\u200b",        inline: true },
  ];

  return baseEmbed(message, rarityColor(animal.rarity))
    .setAuthor({
      name: `✨ ${message.author.username} caught a new ${animal.rarity}!`,
      iconURL: message.author.displayAvatarURL({ size: 64 }),
    })
    .setTitle("✨ CATCH ✨")
    .setThumbnail(message.author.displayAvatarURL({ size: 256 }))
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

// ─── Generic pager (used by `lowo zoo`) ────────────────────────────────────
export const ZOO_BUTTON_PREFIX = "lowo:zoo:";
/**
 * Build a Prev / Page-info / Next / Close action row.
 *   customId format: `<prefix><page>:<targetId>:<invokerId>`
 *   prefix MUST end in ":" (e.g. "lowo:zoo:").
 */
export function pagerButtons(
  prefix: string,
  page: number,
  totalPages: number,
  targetId: string,
  invokerId: string,
): ActionRowBuilder<ButtonBuilder> {
  const row = new ActionRowBuilder<ButtonBuilder>();
  row.addComponents(
    new ButtonBuilder()
      .setCustomId(`${prefix}${Math.max(0, page - 1)}:${targetId}:${invokerId}`)
      .setEmoji("◀️").setLabel("Prev").setStyle(ButtonStyle.Secondary)
      .setDisabled(page <= 0),
    new ButtonBuilder()
      .setCustomId(`${prefix}page:${targetId}:${invokerId}`)
      .setLabel(`${page + 1} / ${totalPages}`).setStyle(ButtonStyle.Primary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId(`${prefix}${Math.min(totalPages - 1, page + 1)}:${targetId}:${invokerId}`)
      .setEmoji("▶️").setLabel("Next").setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= totalPages - 1),
    new ButtonBuilder()
      .setCustomId(`${prefix}close:${targetId}:${invokerId}`)
      .setEmoji("✖️").setStyle(ButtonStyle.Danger),
  );
  return row;
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
