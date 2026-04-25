import type { Message } from "discord.js";
import { EmbedBuilder } from "discord.js";
import { getUser, updateUser, flush, type UserData } from "./storage.js";
import { ANIMAL_BY_ID, ANIMALS } from "./data.js";

// ─── Tolerant animal lookup (id or display name) ──────────────────────────────
const norm = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const ANIMAL_LOOKUP: Record<string, string> = (() => {
  const m: Record<string, string> = {};
  for (const a of ANIMALS) { m[norm(a.id)] = a.id; m[norm(a.name)] = a.id; }
  return m;
})();
function resolveAnimalId(q: string): string | null {
  if (!q) return null;
  return ANIMAL_LOOKUP[norm(q)] ?? null;
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface TradeOffer {
  cowoncy: number;
  essence: number;
  animals: Record<string, number>;
  weaponIds: string[]; // store actual weapon.id (uuid-ish) so dismantle/equip shifts don't break us
}

interface TradeSession {
  id: string;
  channelId: string;
  userIds: [string, string];
  offers: Record<string, TradeOffer>;
  confirms: Record<string, boolean>;
  messageId: string | null;
  expiresAt: number;
  timer: NodeJS.Timeout;
}

const TRADE_TIMEOUT_MS = 60_000;
const sessions = new Map<string, TradeSession>();
const userToSession = new Map<string, string>();

let counter = 0;
const newSessionId = (): string => `t${Date.now().toString(36)}_${++counter}`;
const emptyOffer = (): TradeOffer => ({ cowoncy: 0, essence: 0, animals: {}, weaponIds: [] });

function endSession(sId: string): void {
  const s = sessions.get(sId);
  if (!s) return;
  clearTimeout(s.timer);
  for (const uid of s.userIds) userToSession.delete(uid);
  sessions.delete(sId);
}

function bumpExpiry(s: TradeSession, onExpire: () => void): void {
  clearTimeout(s.timer);
  s.expiresAt = Date.now() + TRADE_TIMEOUT_MS;
  s.timer = setTimeout(onExpire, TRADE_TIMEOUT_MS);
}

function resetConfirms(s: TradeSession): void {
  for (const uid of s.userIds) s.confirms[uid] = false;
}

function offerIsEmpty(o: TradeOffer): boolean {
  return o.cowoncy === 0 && o.essence === 0
    && Object.values(o.animals).every((v) => v <= 0)
    && o.weaponIds.length === 0;
}

// ─── Embed rendering ──────────────────────────────────────────────────────────
function fmtOffer(userId: string, o: TradeOffer): string {
  const lines: string[] = [];
  if (o.cowoncy > 0) lines.push(`💰 ${o.cowoncy.toLocaleString()} cowoncy`);
  if (o.essence > 0) lines.push(`✨ ${o.essence.toLocaleString()} essence`);
  for (const [aid, c] of Object.entries(o.animals)) {
    if (c <= 0) continue;
    const a = ANIMAL_BY_ID[aid];
    lines.push(`${a?.emoji ?? "❓"} ${a?.name ?? aid} ×${c}`);
  }
  if (o.weaponIds.length) {
    const u = getUser(userId);
    for (const wid of o.weaponIds) {
      const w = u.weapons.find((x) => x.id === wid);
      if (w) lines.push(`🗡️ \`${wid.slice(0, 8)}\` *(${w.rarity})* ATK+${w.mods.atk} DEF+${w.mods.def} MAG+${w.mods.mag}`);
      else lines.push(`🗡️ \`${wid.slice(0, 8)}\` *(no longer owned!)*`);
    }
  }
  return lines.length ? lines.join("\n") : "_(empty)_";
}

function buildEmbed(s: TradeSession, footer?: string): EmbedBuilder {
  const [a, b] = s.userIds;
  const aStatus = s.confirms[a] ? "✅ Confirmed" : "⏳ Adding…";
  const bStatus = s.confirms[b] ? "✅ Confirmed" : "⏳ Adding…";
  const left = Math.max(0, Math.ceil((s.expiresAt - Date.now()) / 1000));
  const e = new EmbedBuilder()
    .setTitle("🦊 Lowo Trade")
    .setDescription([
      "**How to trade**",
      "• `lowo trade add cowoncy <amt>` / `add essence <amt>`",
      "• `lowo trade add animal <name> [count]`",
      "• `lowo trade add weapon <inventoryIdx>`",
      "• `lowo trade remove cowoncy|essence <amt|all>`",
      "• `lowo trade remove animal <name> [count]` / `remove weapon <idx>`",
      "• `lowo trade clear` (empty your side)",
      "• `lowo trade confirm` when ready • `lowo trade cancel` to abort",
      `_Times out after **${left}s** of inactivity. Editing your offer resets confirmations._`,
    ].join("\n"))
    .addFields(
      { name: `${aStatus} • <@${a}>`, value: fmtOffer(a, s.offers[a]).slice(0, 1024), inline: true },
      { name: `${bStatus} • <@${b}>`, value: fmtOffer(b, s.offers[b]).slice(0, 1024), inline: true },
    )
    .setColor(s.confirms[a] && s.confirms[b] ? 0x57f287 : 0x5865f2);
  if (footer) e.setFooter({ text: footer });
  return e;
}

async function refreshEmbed(message: Message, s: TradeSession, footer?: string): Promise<void> {
  const ch = message.channel;
  if (!("send" in ch)) return;
  const embed = buildEmbed(s, footer);
  try {
    if (s.messageId) {
      const existing = await ch.messages.fetch(s.messageId).catch(() => null);
      if (existing) { await existing.edit({ embeds: [embed] }); return; }
    }
    const sent = await ch.send({ embeds: [embed] });
    s.messageId = sent.id;
  } catch (err) {
    console.error("[LOWO TRADE] embed refresh failed", err);
  }
}

// ─── Validation & atomic swap ─────────────────────────────────────────────────
function validateOfferOwnership(userId: string, o: TradeOffer): string | null {
  const u = getUser(userId);
  if (o.cowoncy > u.cowoncy) return `<@${userId}> no longer has ${o.cowoncy.toLocaleString()} cowoncy.`;
  if (o.essence > u.essence) return `<@${userId}> no longer has ${o.essence.toLocaleString()} essence.`;
  for (const [aid, c] of Object.entries(o.animals)) {
    if ((u.zoo[aid] ?? 0) < c) {
      const a = ANIMAL_BY_ID[aid];
      return `<@${userId}> no longer has ${c}× ${a?.emoji ?? ""} ${a?.name ?? aid}.`;
    }
  }
  const seen = new Set<string>();
  for (const wid of o.weaponIds) {
    if (seen.has(wid)) return `<@${userId}> listed weapon \`${wid.slice(0, 8)}\` twice.`;
    seen.add(wid);
    if (!u.weapons.find((w) => w.id === wid)) return `<@${userId}> no longer has weapon \`${wid.slice(0, 8)}\`.`;
  }
  return null;
}

function executeSwap(s: TradeSession): { ok: boolean; error?: string } {
  const [aId, bId] = s.userIds;
  const aOffer = s.offers[aId];
  const bOffer = s.offers[bId];

  // Final ownership check (the "Inventory Freeze")
  const errA = validateOfferOwnership(aId, aOffer);
  if (errA) return { ok: false, error: errA };
  const errB = validateOfferOwnership(bId, bOffer);
  if (errB) return { ok: false, error: errB };

  // Snapshot for rollback (deep clone)
  const aSnap: UserData = JSON.parse(JSON.stringify(getUser(aId)));
  const bSnap: UserData = JSON.parse(JSON.stringify(getUser(bId)));

  // Resolve weapon objects from current state BEFORE mutating
  const aUser = getUser(aId);
  const bUser = getUser(bId);
  const aWeaponObjs = aOffer.weaponIds.map((wid) => aUser.weapons.find((w) => w.id === wid)).filter((w): w is NonNullable<typeof w> => !!w);
  const bWeaponObjs = bOffer.weaponIds.map((wid) => bUser.weapons.find((w) => w.id === wid)).filter((w): w is NonNullable<typeof w> => !!w);

  try {
    applyOfferDelta(aId, aOffer, bOffer, bWeaponObjs);
    applyOfferDelta(bId, bOffer, aOffer, aWeaponObjs);
    flush(); // single fsync of both updates
    return { ok: true };
  } catch (err) {
    // Rollback: overwrite each user's record with the snapshot
    console.error("[LOWO TRADE] swap failed; rolling back", err);
    updateUser(aId, (x) => { Object.assign(x, aSnap); });
    updateUser(bId, (x) => { Object.assign(x, bSnap); });
    flush();
    return { ok: false, error: "Internal error during swap; both sides rolled back." };
  }
}

function applyOfferDelta(
  userId: string,
  give: TradeOffer,
  receive: TradeOffer,
  receivedWeapons: Array<{ id: string; rarity: string; mods: { atk: number; def: number; mag: number } }>,
): void {
  updateUser(userId, (x) => {
    // GIVE
    x.cowoncy -= give.cowoncy;
    x.essence -= give.essence;
    for (const [aid, c] of Object.entries(give.animals)) {
      x.zoo[aid] = (x.zoo[aid] ?? 0) - c;
      if (x.zoo[aid] <= 0) delete x.zoo[aid];
    }
    for (const wid of give.weaponIds) {
      const idx = x.weapons.findIndex((w) => w.id === wid);
      if (idx < 0) continue;
      x.weapons.splice(idx, 1);
      // Rebase equipped indexes (same logic as dismantle)
      for (const k of Object.keys(x.equipped)) {
        const v = parseInt(x.equipped[k], 10);
        if (v === idx) delete x.equipped[k];
        else if (v > idx) x.equipped[k] = String(v - 1);
      }
    }
    // RECEIVE
    x.cowoncy += receive.cowoncy;
    x.essence += receive.essence;
    for (const [aid, c] of Object.entries(receive.animals)) {
      x.zoo[aid] = (x.zoo[aid] ?? 0) + c;
      if (!x.dex.includes(aid)) x.dex.push(aid);
    }
    for (const w of receivedWeapons) {
      x.weapons.push({ id: w.id, rarity: w.rarity, mods: { ...w.mods } });
    }
  });
}

// ─── Public command ──────────────────────────────────────────────────────────
export async function cmdTrade(message: Message, args: string[]): Promise<void> {
  const sub = args[0]?.toLowerCase();

  // Open new trade: `lowo trade @user`
  if (!sub || sub.startsWith("<@")) {
    const target = message.mentions.users.first();
    if (!target) { await message.reply("Usage: `lowo trade @user` — opens a trade."); return; }
    if (target.id === message.author.id) { await message.reply("❌ You can't trade with yourself."); return; }
    if (target.bot) { await message.reply("❌ You can't trade with a bot."); return; }
    if (userToSession.has(message.author.id)) { await message.reply("❌ You're already in a trade. Finish or `lowo trade cancel` first."); return; }
    if (userToSession.has(target.id)) { await message.reply(`❌ **${target.username}** is already in a trade.`); return; }

    const sId = newSessionId();
    const s: TradeSession = {
      id: sId,
      channelId: message.channelId,
      userIds: [message.author.id, target.id],
      offers: { [message.author.id]: emptyOffer(), [target.id]: emptyOffer() },
      confirms: { [message.author.id]: false, [target.id]: false },
      messageId: null,
      expiresAt: Date.now() + TRADE_TIMEOUT_MS,
      timer: setTimeout(() => { /* placeholder, replaced by bumpExpiry */ }, 0),
    };
    clearTimeout(s.timer);
    sessions.set(sId, s);
    userToSession.set(message.author.id, sId);
    userToSession.set(target.id, sId);
    bumpExpiry(s, () => handleExpire(message, sId));
    await refreshEmbed(message, s, `Trade opened — ${message.author.username} ↔ ${target.username}.`);
    return;
  }

  // All other subs require an active session belonging to the author
  const sId = userToSession.get(message.author.id);
  const s = sId ? sessions.get(sId) : null;
  if (!s) { await message.reply("❌ You're not in an active trade. Open one with `lowo trade @user`."); return; }
  if (s.channelId !== message.channelId) { await message.reply(`❌ This trade is happening in <#${s.channelId}>.`); return; }

  // Bump inactivity timer on every interaction
  bumpExpiry(s, () => handleExpire(message, s.id));

  const me = message.author.id;
  const them = s.userIds.find((u) => u !== me)!;

  if (sub === "cancel" || sub === "abort") {
    endSession(s.id);
    const ch = message.channel;
    if ("send" in ch && s.messageId) {
      const existing = await ch.messages.fetch(s.messageId).catch(() => null);
      if (existing) {
        const final = buildEmbed(s, "❌ Trade cancelled.").setColor(0xed4245);
        await existing.edit({ embeds: [final] }).catch(() => {});
      }
    }
    await message.reply(`❌ Trade cancelled by **${message.author.username}**.`);
    return;
  }

  if (sub === "view") {
    await refreshEmbed(message, s);
    return;
  }

  if (sub === "clear") {
    s.offers[me] = emptyOffer();
    resetConfirms(s);
    await refreshEmbed(message, s, `${message.author.username} cleared their offer.`);
    return;
  }

  if (sub === "confirm" || sub === "accept") {
    if (offerIsEmpty(s.offers[s.userIds[0]]) && offerIsEmpty(s.offers[s.userIds[1]])) {
      await message.reply("❌ Both offers are empty. Add something first.");
      return;
    }
    const errMe = validateOfferOwnership(me, s.offers[me]);
    if (errMe) { await message.reply(`❌ ${errMe}`); return; }
    s.confirms[me] = true;

    if (s.confirms[me] && s.confirms[them]) {
      const result = executeSwap(s);
      if (!result.ok) {
        resetConfirms(s);
        await refreshEmbed(message, s, `⚠️ ${result.error ?? "Swap failed."} Confirmations reset.`);
        return;
      }
      // Success — finalize embed and end session
      const finalEmbed = buildEmbed(s, "✅ Trade executed.").setColor(0x57f287);
      const ch = message.channel;
      if ("send" in ch && s.messageId) {
        const existing = await ch.messages.fetch(s.messageId).catch(() => null);
        if (existing) await existing.edit({ embeds: [finalEmbed] }).catch(() => {});
      }
      endSession(s.id);
      await message.reply(`✅ **Trade complete!** <@${s.userIds[0]}> ↔ <@${s.userIds[1]}>`);
      return;
    }
    await refreshEmbed(message, s, `${message.author.username} confirmed. Waiting for <@${them}>.`);
    return;
  }

  if (sub === "add" || sub === "remove") {
    const what = args[1]?.toLowerCase();
    const rest = args.slice(2);
    if (!what) {
      await message.reply(`Usage: \`lowo trade ${sub} cowoncy <amt> | essence <amt> | animal <name> [n] | weapon <idx>\``);
      return;
    }
    const hadConfirm = s.confirms[me] || s.confirms[them];

    let actionLabel = "";
    if (what === "cowoncy" || what === "money" || what === "bal") {
      const amtStr = rest[0]?.toLowerCase();
      if (sub === "remove" && (!amtStr || amtStr === "all")) {
        s.offers[me].cowoncy = 0;
        actionLabel = "removed all cowoncy";
      } else {
        const amt = parseInt(amtStr ?? "", 10);
        if (!Number.isFinite(amt) || amt <= 0) { await message.reply(`Usage: \`lowo trade ${sub} cowoncy <amount>\``); return; }
        if (sub === "add") {
          const u = getUser(me);
          const newTotal = s.offers[me].cowoncy + amt;
          if (u.cowoncy < newTotal) { await message.reply(`❌ You only have ${u.cowoncy.toLocaleString()} cowoncy (already offering ${s.offers[me].cowoncy.toLocaleString()}).`); return; }
          s.offers[me].cowoncy = newTotal;
          actionLabel = `added ${amt.toLocaleString()} cowoncy`;
        } else {
          s.offers[me].cowoncy = Math.max(0, s.offers[me].cowoncy - amt);
          actionLabel = `removed ${amt.toLocaleString()} cowoncy`;
        }
      }
    } else if (what === "essence" || what === "ess") {
      const amtStr = rest[0]?.toLowerCase();
      if (sub === "remove" && (!amtStr || amtStr === "all")) {
        s.offers[me].essence = 0;
        actionLabel = "removed all essence";
      } else {
        const amt = parseInt(amtStr ?? "", 10);
        if (!Number.isFinite(amt) || amt <= 0) { await message.reply(`Usage: \`lowo trade ${sub} essence <amount>\``); return; }
        if (sub === "add") {
          const u = getUser(me);
          const newTotal = s.offers[me].essence + amt;
          if (u.essence < newTotal) { await message.reply(`❌ You only have ${u.essence.toLocaleString()} essence (already offering ${s.offers[me].essence.toLocaleString()}).`); return; }
          s.offers[me].essence = newTotal;
          actionLabel = `added ${amt.toLocaleString()} essence`;
        } else {
          s.offers[me].essence = Math.max(0, s.offers[me].essence - amt);
          actionLabel = `removed ${amt.toLocaleString()} essence`;
        }
      }
    } else if (what === "animal" || what === "pet") {
      let count = 1;
      let nameTokens = rest;
      const last = rest[rest.length - 1];
      if (last && /^\d+$/.test(last)) { count = Math.max(1, parseInt(last, 10)); nameTokens = rest.slice(0, -1); }
      const id = resolveAnimalId(nameTokens.join(" "));
      if (!id) { await message.reply(`Usage: \`lowo trade ${sub} animal <name> [count]\` — see \`lowo lowodex\`.`); return; }
      const a = ANIMAL_BY_ID[id];
      if (sub === "add") {
        const u = getUser(me);
        const inOffer = s.offers[me].animals[id] ?? 0;
        const need = inOffer + count;
        if ((u.zoo[id] ?? 0) < need) { await message.reply(`❌ You only own ${u.zoo[id] ?? 0}× ${a.emoji} **${a.name}** (already offering ${inOffer}).`); return; }
        s.offers[me].animals[id] = need;
        actionLabel = `added ${count}× ${a.name}`;
      } else {
        const have = s.offers[me].animals[id] ?? 0;
        if (have <= 0) { await message.reply(`❌ You have no ${a.emoji} **${a.name}** in your offer.`); return; }
        const removeN = Math.min(have, count);
        s.offers[me].animals[id] = have - removeN;
        if (s.offers[me].animals[id] === 0) delete s.offers[me].animals[id];
        actionLabel = `removed ${removeN}× ${a.name}`;
      }
    } else if (what === "weapon" || what === "w") {
      const idxStr = rest[0];
      const idx = parseInt(idxStr ?? "", 10);
      if (!Number.isFinite(idx)) { await message.reply(`Usage: \`lowo trade ${sub} weapon <inventoryIdx>\` — see \`lowo weapon\`.`); return; }
      if (sub === "add") {
        const u = getUser(me);
        const w = u.weapons[idx];
        if (!w) { await message.reply(`❌ No weapon at index \`${idx}\`.`); return; }
        if (s.offers[me].weaponIds.includes(w.id)) { await message.reply(`❌ That weapon is already in your offer.`); return; }
        s.offers[me].weaponIds.push(w.id);
        actionLabel = `added weapon \`${idx}\``;
      } else {
        const u = getUser(me);
        const targetByIdx = u.weapons[idx]?.id ?? null;
        if (targetByIdx && s.offers[me].weaponIds.includes(targetByIdx)) {
          s.offers[me].weaponIds = s.offers[me].weaponIds.filter((id) => id !== targetByIdx);
          actionLabel = `removed weapon \`${idx}\``;
        } else if (idx >= 0 && idx < s.offers[me].weaponIds.length) {
          s.offers[me].weaponIds.splice(idx, 1);
          actionLabel = `removed offer slot \`${idx}\``;
        } else {
          await message.reply(`❌ No matching weapon to remove.`);
          return;
        }
      }
    } else {
      await message.reply(`Usage: \`lowo trade ${sub} cowoncy|essence|animal|weapon …\``);
      return;
    }

    if (hadConfirm) resetConfirms(s);
    await refreshEmbed(message, s, `${message.author.username} ${actionLabel}.${hadConfirm ? " Confirmations reset." : ""}`);
    return;
  }

  await message.reply(`Unknown trade sub: \`${sub}\`. Use \`add | remove | confirm | cancel | clear | view\`.`);
}

async function handleExpire(message: Message, sId: string): Promise<void> {
  const s = sessions.get(sId);
  if (!s) return;
  endSession(sId);
  const ch = message.channel;
  try {
    if ("send" in ch) {
      if (s.messageId) {
        const existing = await ch.messages.fetch(s.messageId).catch(() => null);
        if (existing) {
          const finalEmbed = buildEmbed(s, "⏰ Trade timed out.").setColor(0x99aab5);
          await existing.edit({ embeds: [finalEmbed] }).catch(() => {});
        }
      }
      await ch.send(`⏰ Trade between <@${s.userIds[0]}> and <@${s.userIds[1]}> timed out.`).catch(() => {});
    }
  } catch (err) {
    console.error("[LOWO TRADE] expire handler", err);
  }
}
