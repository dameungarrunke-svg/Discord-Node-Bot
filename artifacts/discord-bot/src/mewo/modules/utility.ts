import type { Message } from "discord.js";
import { EmbedBuilder } from "discord.js";
import dns from "node:dns/promises";
import { getEmbedColor, setEmbedColor, getTimezone, setTimezone } from "../store.js";

type Handler = (msg: Message, args: string[]) => Promise<void>;

function err(text: string): EmbedBuilder {
  return new EmbedBuilder().setColor(0xED4245).setDescription(`❌ ${text}`);
}

export const cmdBase64Encode: Handler = async (msg, args) => {
  if (!args.length) {
    await msg.reply({ embeds: [err("Provide text. Usage: `mewo base64 encode <text>`")] });
    return;
  }
  const text = args.join(" ");
  const encoded = Buffer.from(text, "utf-8").toString("base64");
  await msg.reply({
    embeds: [new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle("Base64 Encode")
      .addFields(
        { name: "Input", value: `\`\`\`${text.slice(0, 1000)}\`\`\``, inline: false },
        { name: "Output", value: `\`\`\`${encoded.slice(0, 1000)}\`\`\``, inline: false }
      )
      .setFooter({ text: "mewo • utility" })
    ],
  });
};

export const cmdBase64Decode: Handler = async (msg, args) => {
  if (!args.length) {
    await msg.reply({ embeds: [err("Provide a Base64 string. Usage: `mewo base64 decode <string>`")] });
    return;
  }
  const text = args.join(" ").trim();
  try {
    const decoded = Buffer.from(text, "base64").toString("utf-8");
    await msg.reply({
      embeds: [new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle("Base64 Decode")
        .addFields(
          { name: "Input", value: `\`\`\`${text.slice(0, 1000)}\`\`\``, inline: false },
          { name: "Output", value: `\`\`\`${decoded.slice(0, 1000)}\`\`\``, inline: false }
        )
        .setFooter({ text: "mewo • utility" })
      ],
    });
  } catch {
    await msg.reply({ embeds: [err("Invalid Base64 string.")] });
  }
};

export const cmdAvatar: Handler = async (msg) => {
  const target = msg.mentions.users.first() ?? msg.author;
  const av = target.displayAvatarURL({ size: 4096 });
  await msg.reply({
    embeds: [new EmbedBuilder()
      .setColor(getEmbedColor(msg.author.id))
      .setTitle(`${target.username}'s Avatar`)
      .setImage(av)
      .addFields({
        name: "Links",
        value: [
          `[PNG](${target.displayAvatarURL({ extension: "png", size: 4096 })})`,
          `[WEBP](${target.displayAvatarURL({ extension: "webp", size: 4096 })})`,
          `[JPG](${target.displayAvatarURL({ extension: "jpg", size: 4096 })})`,
        ].join(" | "),
        inline: false,
      })
      .setFooter({ text: "mewo • utility" })
    ],
  });
};

export const cmdBanner: Handler = async (msg) => {
  const target = msg.mentions.users.first() ?? msg.author;
  try {
    const fetched = await msg.client.users.fetch(target.id, { force: true });
    const bannerUrl = fetched.bannerURL({ size: 4096 });
    if (!bannerUrl) {
      await msg.reply({ embeds: [err(`**${target.username}** has no banner set.`)] });
      return;
    }
    await msg.reply({
      embeds: [new EmbedBuilder()
        .setColor(getEmbedColor(msg.author.id))
        .setTitle(`${target.username}'s Banner`)
        .setImage(bannerUrl)
        .setFooter({ text: "mewo • utility" })
      ],
    });
  } catch {
    await msg.reply({ embeds: [err("Could not fetch banner.")] });
  }
};

export const cmdPing: Handler = async (msg) => {
  const start = Date.now();
  const sent = await msg.reply({
    embeds: [new EmbedBuilder().setColor(0xFEE75C).setDescription("Pinging...")]
  });
  const latency = Date.now() - start;
  const ws = msg.client.ws.ping;
  await sent.edit({
    embeds: [new EmbedBuilder()
      .setColor(latency < 100 ? 0x57F287 : latency < 200 ? 0xFEE75C : 0xED4245)
      .setTitle("Pong!")
      .addFields(
        { name: "Message Latency", value: `${latency}ms`, inline: true },
        { name: "WebSocket Latency", value: `${ws}ms`, inline: true }
      )
      .setFooter({ text: "mewo • utility" })
    ],
  });
};

export const cmdDiscordUser: Handler = async (msg, args) => {
  const target = msg.mentions.users.first()
    ?? (args[0] ? await msg.client.users.fetch(args[0]).catch(() => null) : null)
    ?? msg.author;
  if (!target) {
    await msg.reply({ embeds: [err("User not found.")] });
    return;
  }
  const fetched = await msg.client.users.fetch(target.id, { force: true }).catch(() => target);
  const created = Math.floor(fetched.createdTimestamp / 1000);
  const bannerUrl = fetched.bannerURL({ size: 2048 });
  const embed = new EmbedBuilder()
    .setColor(getEmbedColor(msg.author.id))
    .setTitle(`Discord User — ${fetched.username}`)
    .setThumbnail(fetched.displayAvatarURL({ size: 256 }))
    .addFields(
      { name: "Username", value: fetched.username, inline: true },
      { name: "ID", value: fetched.id, inline: true },
      { name: "Bot", value: fetched.bot ? "Yes" : "No", inline: true },
      { name: "Account Created", value: `<t:${created}:D> (<t:${created}:R>)`, inline: false }
    )
    .setFooter({ text: "mewo • utility" });
  if (bannerUrl) embed.setImage(bannerUrl);
  await msg.reply({ embeds: [embed] });
};

export const cmdTimezoneSet: Handler = async (msg, args) => {
  if (!args.length) {
    await msg.reply({ embeds: [err("Provide a timezone. Usage: `mewo timezone set <timezone>`\nExample: `mewo timezone set America/New_York`")] });
    return;
  }
  const tz = args[0];
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz }).format(new Date());
  } catch {
    await msg.reply({ embeds: [err(`Invalid timezone \`${tz}\`. Use IANA format like \`America/New_York\` or \`Europe/London\`.`)] });
    return;
  }
  setTimezone(msg.author.id, tz);
  const now = new Date().toLocaleString("en-US", { timeZone: tz, dateStyle: "full", timeStyle: "short" });
  await msg.reply({
    embeds: [new EmbedBuilder()
      .setColor(0x57F287)
      .setTitle("Timezone Set")
      .addFields(
        { name: "Timezone", value: tz, inline: true },
        { name: "Current Time", value: now, inline: false }
      )
      .setFooter({ text: "mewo • utility" })
    ],
  });
};

export const cmdTimezoneView: Handler = async (msg, args) => {
  const target = msg.mentions.users.first();
  let tz: string;
  let label: string;
  if (target) {
    tz = getTimezone(target.id);
    label = `${target.username}'s Timezone`;
  } else if (args[0]) {
    tz = args[0];
    label = `Timezone — ${tz}`;
  } else {
    tz = getTimezone(msg.author.id);
    label = "Your Timezone";
  }
  try {
    const now = new Date().toLocaleString("en-US", { timeZone: tz, dateStyle: "full", timeStyle: "long" });
    await msg.reply({
      embeds: [new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(label)
        .addFields(
          { name: "Timezone", value: tz, inline: true },
          { name: "Current Time", value: now, inline: false }
        )
        .setFooter({ text: "mewo • utility" })
      ],
    });
  } catch {
    await msg.reply({ embeds: [err(`Invalid timezone \`${tz}\`.`)] });
  }
};

export const cmdQrGenerate: Handler = async (msg, args) => {
  if (!args.length) {
    await msg.reply({ embeds: [err("Provide text or URL. Usage: `mewo qr generate <text>`")] });
    return;
  }
  const text = args.join(" ");
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(text)}&margin=10`;
  await msg.reply({
    embeds: [new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle("QR Code")
      .setDescription(`Content: \`${text.slice(0, 200)}\``)
      .setImage(qrUrl)
      .setFooter({ text: "mewo • utility" })
    ],
  });
};

export const cmdConvertId2User: Handler = async (msg, args) => {
  const id = args[0];
  if (!id || !/^\d{17,20}$/.test(id)) {
    await msg.reply({ embeds: [err("Provide a valid Discord user ID. Usage: `mewo convert discordid2user <id>`")] });
    return;
  }
  try {
    const user = await msg.client.users.fetch(id);
    const created = Math.floor(user.createdTimestamp / 1000);
    await msg.reply({
      embeds: [new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle("Discord ID → User")
        .setThumbnail(user.displayAvatarURL())
        .addFields(
          { name: "ID", value: id, inline: true },
          { name: "Username", value: user.username, inline: true },
          { name: "Bot", value: user.bot ? "Yes" : "No", inline: true },
          { name: "Created", value: `<t:${created}:D>`, inline: false }
        )
        .setFooter({ text: "mewo • utility" })
      ],
    });
  } catch {
    await msg.reply({ embeds: [err("User not found or invalid ID.")] });
  }
};

export const cmdConvertUser2Id: Handler = async (msg) => {
  const target = msg.mentions.users.first();
  if (!target) {
    await msg.reply({ embeds: [err("Mention a user. Usage: `mewo convert discorduser2id @user`")] });
    return;
  }
  await msg.reply({
    embeds: [new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle("Discord User → ID")
      .setThumbnail(target.displayAvatarURL())
      .addFields(
        { name: "Username", value: target.username, inline: true },
        { name: "ID", value: `\`${target.id}\``, inline: true }
      )
      .setFooter({ text: "mewo • utility" })
    ],
  });
};

export const cmdIpLookup: Handler = async (msg, args) => {
  const ip = args[0];
  if (!ip) {
    await msg.reply({ embeds: [err("Provide an IP address. Usage: `mewo ip lookup <ip>`")] });
    return;
  }
  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`);
    const d = await res.json() as Record<string, string | number | boolean | null>;
    if (d["error"]) {
      await msg.reply({ embeds: [err(`Could not find info for \`${ip}\`.`)] });
      return;
    }
    await msg.reply({
      embeds: [new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(`IP Lookup — ${ip}`)
        .addFields(
          { name: "Country", value: String(d["country_name"] ?? "N/A"), inline: true },
          { name: "Region", value: String(d["region"] ?? "N/A"), inline: true },
          { name: "City", value: String(d["city"] ?? "N/A"), inline: true },
          { name: "ISP / Org", value: String(d["org"] ?? "N/A"), inline: false },
          { name: "Timezone", value: String(d["timezone"] ?? "N/A"), inline: true },
          { name: "Coordinates", value: `${d["latitude"]}, ${d["longitude"]}`, inline: true }
        )
        .setFooter({ text: "mewo • utility" })
      ],
    });
  } catch {
    await msg.reply({ embeds: [err("Could not look up that IP address.")] });
  }
};

export const cmdDomainLookup: Handler = async (msg, args) => {
  const domain = args[0];
  if (!domain) {
    await msg.reply({ embeds: [err("Provide a domain. Usage: `mewo domain lookup <domain>`")] });
    return;
  }
  try {
    const [aRecs, mxRecs, nsRecs, txtRecs] = await Promise.allSettled([
      dns.resolve4(domain),
      dns.resolveMx(domain),
      dns.resolveNs(domain),
      dns.resolveTxt(domain),
    ]);
    const fields: Array<{ name: string; value: string; inline: boolean }> = [];
    if (aRecs.status === "fulfilled") fields.push({ name: "A Records", value: aRecs.value.join("\n") || "None", inline: true });
    if (nsRecs.status === "fulfilled") fields.push({ name: "NS Records", value: nsRecs.value.slice(0, 5).join("\n") || "None", inline: true });
    if (mxRecs.status === "fulfilled") fields.push({ name: "MX Records", value: mxRecs.value.slice(0, 3).map(m => `${m.exchange} (${m.priority})`).join("\n") || "None", inline: false });
    if (txtRecs.status === "fulfilled") fields.push({ name: "TXT Records (first 3)", value: txtRecs.value.slice(0, 3).map(t => t.join("")).join("\n").slice(0, 1024) || "None", inline: false });
    if (!fields.length) {
      await msg.reply({ embeds: [err(`No DNS records found for \`${domain}\`.`)] });
      return;
    }
    await msg.reply({
      embeds: [new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(`DNS Lookup — ${domain}`)
        .addFields(fields)
        .setFooter({ text: "mewo • utility" })
      ],
    });
  } catch {
    await msg.reply({ embeds: [err(`Could not resolve \`${domain}\`. Check the domain name.`)] });
  }
};

export const cmdTranslate: Handler = async (msg, args) => {
  if (args.length < 2) {
    await msg.reply({ embeds: [err("Usage: `mewo translate <lang_code> <text>`\nExample: `mewo translate es Hello world`\nCodes: en fr de es ja ko ru pt ar zh")] });
    return;
  }
  const to = args[0].toLowerCase();
  const text = args.slice(1).join(" ");
  try {
    const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 500))}&langpair=en|${to}`);
    const d = await res.json() as { responseData?: { translatedText?: string }; responseStatus?: number };
    if (!d.responseData?.translatedText || d.responseStatus !== 200) {
      await msg.reply({ embeds: [err("Translation failed. Check the language code (e.g., `es`, `fr`, `de`, `ja`, `ko`).")] });
      return;
    }
    await msg.reply({
      embeds: [new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle("Translation")
        .addFields(
          { name: "Original (EN)", value: text.slice(0, 1024), inline: false },
          { name: `Translated (${to.toUpperCase()})`, value: d.responseData.translatedText.slice(0, 1024), inline: false }
        )
        .setFooter({ text: "mewo • utility • via MyMemory" })
      ],
    });
  } catch {
    await msg.reply({ embeds: [err("Translation service is unavailable.")] });
  }
};

export const cmdMe: Handler = async (msg) => {
  const target = msg.mentions.users.first() ?? msg.author;
  const member = msg.guild?.members.cache.get(target.id);
  const created = Math.floor(target.createdTimestamp / 1000);
  const joined = member?.joinedTimestamp ? Math.floor(member.joinedTimestamp / 1000) : null;
  const embed = new EmbedBuilder()
    .setColor(getEmbedColor(msg.author.id))
    .setTitle(`Info — ${target.username}`)
    .setThumbnail(target.displayAvatarURL({ size: 256 }))
    .addFields(
      { name: "Username", value: target.username, inline: true },
      { name: "ID", value: target.id, inline: true },
      { name: "Bot", value: target.bot ? "Yes" : "No", inline: true },
      { name: "Account Created", value: `<t:${created}:D> (<t:${created}:R>)`, inline: false }
    )
    .setFooter({ text: "mewo • utility" });
  if (joined) embed.addFields({ name: "Joined Server", value: `<t:${joined}:D> (<t:${joined}:R>)`, inline: false });
  if (member?.roles.cache.size) {
    const roles = [...member.roles.cache.values()]
      .filter(r => r.id !== msg.guild?.id)
      .map(r => `<@&${r.id}>`)
      .join(", ")
      .slice(0, 1024);
    if (roles) embed.addFields({ name: "Roles", value: roles, inline: false });
  }
  await msg.reply({ embeds: [embed] });
};

export const cmdAbout: Handler = async (msg) => {
  await msg.reply({
    embeds: [new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle("About — mewo")
      .setThumbnail(msg.client.user.displayAvatarURL())
      .setDescription(
        "**mewo** is a powerful multi-purpose prefix command system built for Last Stand Management.\n\n" +
        "Featuring AI, roleplay GIFs, interactive games, utility tools, server tags, and more — all delivered in clean, professional embeds."
      )
      .addFields(
        { name: "Prefix", value: "`mewo`", inline: true },
        { name: "Modules", value: "8", inline: true },
        { name: "Commands", value: "100+", inline: true },
        { name: "Setup", value: "`mewo enable` in any channel\nRequires **Manage Channels**", inline: false }
      )
      .setFooter({ text: "mewo • utility" })
    ],
  });
};

export const cmdInvite: Handler = async (msg) => {
  const inv = `https://discord.com/oauth2/authorize?client_id=${msg.client.user.id}&permissions=8&scope=bot+applications.commands`;
  await msg.reply({
    embeds: [new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle("Invite the bot")
      .setDescription(`[Click here to invite Last Stand Management](${inv})`)
      .setFooter({ text: "mewo • utility" })
    ],
  });
};

export const cmdCustomizeColor: Handler = async (msg, args) => {
  const hex = args[0]?.replace("#", "");
  if (!hex) {
    const current = getEmbedColor(msg.author.id).toString(16).padStart(6, "0");
    await msg.reply({
      embeds: [new EmbedBuilder()
        .setColor(getEmbedColor(msg.author.id))
        .setTitle("Your Embed Color")
        .setDescription(
          `Current color: \`#${current.toUpperCase()}\`\n\n` +
          "To change it: `mewo customize color <hex>`\n" +
          "Example: `mewo customize color FF0080`"
        )
        .setFooter({ text: "mewo • customize" })
      ],
    });
    return;
  }
  if (!/^[0-9A-Fa-f]{6}$/.test(hex)) {
    await msg.reply({ embeds: [err("Invalid hex color. Use 6 hex characters, e.g. `5865F2` or `#FF0080`.")] });
    return;
  }
  setEmbedColor(msg.author.id, hex);
  const parsed = parseInt(hex, 16);
  await msg.reply({
    embeds: [new EmbedBuilder()
      .setColor(parsed)
      .setTitle("Color Updated!")
      .setDescription(`Your embed color is now \`#${hex.toUpperCase()}\``)
      .setFooter({ text: "mewo • customize" })
    ],
  });
};
