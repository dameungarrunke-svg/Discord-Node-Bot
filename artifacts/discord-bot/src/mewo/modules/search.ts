import type { Message } from "discord.js";
import { EmbedBuilder } from "discord.js";

type Handler = (msg: Message, args: string[]) => Promise<void>;

function err(text: string): EmbedBuilder {
  return new EmbedBuilder().setColor(0xED4245).setDescription(`❌ ${text}`);
}

// ─── GITHUB ──────────────────────────────────────────────────────────────────

export const cmdGithub: Handler = async (msg, args) => {
  const username = args[0];
  if (!username) {
    await msg.reply({ embeds: [err("Provide a username. Usage: `mewo search github <username>`")] });
    return;
  }
  try {
    const res = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, {
      headers: { "Accept": "application/vnd.github.v3+json", "User-Agent": "MewoBot/1.0" },
    });
    if (!res.ok) {
      await msg.reply({ embeds: [err(`GitHub user \`${username}\` not found.`)] });
      return;
    }
    const d = await res.json() as {
      login: string; name: string | null; bio: string | null; avatar_url: string; html_url: string;
      public_repos: number; followers: number; following: number; created_at: string;
      location: string | null; company: string | null; blog: string | null;
    };
    const created = Math.floor(new Date(d.created_at).getTime() / 1000);
    const embed = new EmbedBuilder()
      .setColor(0x24292E)
      .setTitle(`GitHub — ${d.login}`)
      .setURL(d.html_url)
      .setThumbnail(d.avatar_url)
      .addFields(
        { name: "Name", value: d.name ?? "N/A", inline: true },
        { name: "Repos", value: `${d.public_repos}`, inline: true },
        { name: "Followers", value: `${d.followers}`, inline: true },
        { name: "Following", value: `${d.following}`, inline: true },
        { name: "Joined", value: `<t:${created}:D>`, inline: true }
      )
      .setFooter({ text: "mewo • search • GitHub" });
    if (d.bio) embed.setDescription(d.bio);
    if (d.location) embed.addFields({ name: "Location", value: d.location, inline: true });
    if (d.company) embed.addFields({ name: "Company", value: d.company, inline: true });
    if (d.blog) embed.addFields({ name: "Website", value: d.blog, inline: false });
    await msg.reply({ embeds: [embed] });
  } catch {
    await msg.reply({ embeds: [err("Could not reach GitHub API.")] });
  }
};

// ─── MINECRAFT SERVER ────────────────────────────────────────────────────────

export const cmdMinecraftServer: Handler = async (msg, args) => {
  const address = args[0];
  if (!address) {
    await msg.reply({ embeds: [err("Provide a server address. Usage: `mewo search minecraft server <address>`")] });
    return;
  }
  try {
    const res = await fetch(`https://api.mcsrvstat.us/2/${encodeURIComponent(address)}`);
    const d = await res.json() as {
      online: boolean;
      players?: { online: number; max: number };
      version?: string;
      description?: { clean: string[] } | string;
      motd?: { clean?: string[] };
    };
    if (!d.online) {
      await msg.reply({ embeds: [err(`Server \`${address}\` is **offline** or unreachable.`)] });
      return;
    }
    let motd = "N/A";
    if (typeof d.description === "string") motd = d.description;
    else if (Array.isArray(d.description?.clean) && d.description.clean.length) motd = d.description.clean.join("\n");
    else if (d.motd?.clean?.length) motd = d.motd.clean.join("\n");

    await msg.reply({
      embeds: [new EmbedBuilder()
        .setColor(0x57F287)
        .setTitle(`Minecraft Server — ${address}`)
        .setDescription(`\`\`\`${motd.slice(0, 500)}\`\`\``)
        .addFields(
          { name: "Status", value: "🟢 Online", inline: true },
          { name: "Players", value: `${d.players?.online ?? 0}/${d.players?.max ?? 0}`, inline: true },
          { name: "Version", value: d.version ?? "Unknown", inline: true }
        )
        .setFooter({ text: "mewo • search • Minecraft" })
      ],
    });
  } catch {
    await msg.reply({ embeds: [err("Could not query Minecraft server.")] });
  }
};

// ─── MINECRAFT USER ───────────────────────────────────────────────────────────

export const cmdMinecraftUser: Handler = async (msg, args) => {
  const username = args[0];
  if (!username) {
    await msg.reply({ embeds: [err("Provide a username. Usage: `mewo search minecraft user <username>`")] });
    return;
  }
  try {
    const res = await fetch(`https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(username)}`);
    if (!res.ok) {
      await msg.reply({ embeds: [err(`Minecraft user \`${username}\` not found.`)] });
      return;
    }
    const d = await res.json() as { name: string; id: string };
    const uuid = d.id;
    const skinUrl = `https://mc-heads.net/avatar/${uuid}/256`;
    await msg.reply({
      embeds: [new EmbedBuilder()
        .setColor(0x57F287)
        .setTitle(`Minecraft User — ${d.name}`)
        .setThumbnail(skinUrl)
        .addFields(
          { name: "Username", value: d.name, inline: true },
          { name: "UUID", value: `\`${uuid}\``, inline: true },
          { name: "Skin Viewer", value: `[mc-heads.net](https://mc-heads.net/player/${uuid})`, inline: false }
        )
        .setFooter({ text: "mewo • search • Minecraft" })
      ],
    });
  } catch {
    await msg.reply({ embeds: [err("Could not fetch Minecraft user data.")] });
  }
};

// ─── MINECRAFT SKIN ───────────────────────────────────────────────────────────

export const cmdMinecraftSkin: Handler = async (msg, args) => {
  const username = args[0];
  if (!username) {
    await msg.reply({ embeds: [err("Provide a username. Usage: `mewo search minecraft skin <username>`")] });
    return;
  }
  const skinUrl = `https://mc-heads.net/player/${encodeURIComponent(username)}/600`;
  await msg.reply({
    embeds: [new EmbedBuilder()
      .setColor(0x57F287)
      .setTitle(`Minecraft Skin — ${username}`)
      .setImage(skinUrl)
      .setFooter({ text: "mewo • search • Minecraft" })
    ],
  });
};

// ─── MINECRAFT RANDOM SERVER ─────────────────────────────────────────────────

export const cmdMinecraftRandomserver: Handler = async (msg) => {
  const servers = [
    "hypixel.net", "mineplex.com", "mc.cubecraft.net",
    "play.hivemc.com", "play.skyblock.net",
    "play.pixelmonrealms.com", "play.purpleprison.net",
    "play.skywars.com", "pvp.land",
  ];
  const server = servers[Math.floor(Math.random() * servers.length)];
  await msg.reply({
    embeds: [new EmbedBuilder()
      .setColor(0x57F287)
      .setTitle("Random Minecraft Server")
      .setDescription(`**${server}**`)
      .addFields({
        name: "Check it",
        value: `\`mewo search minecraft server ${server}\``,
        inline: false,
      })
      .setFooter({ text: "mewo • search • Minecraft" })
    ],
  });
};

// ─── YOUTUBE ─────────────────────────────────────────────────────────────────

export const cmdYoutube: Handler = async (msg, args) => {
  if (!args.length) {
    await msg.reply({ embeds: [err("Provide a query. Usage: `mewo search youtube <query>`")] });
    return;
  }
  const query = args.join(" ");
  try {
    const res = await fetch(
      `https://inv.nadeko.net/api/v1/search?q=${encodeURIComponent(query)}&type=video&fields=title,videoId,author,lengthSeconds,publishedText`,
      { headers: { "User-Agent": "MewoBot/1.0" } }
    );
    if (!res.ok) throw new Error("API error");
    const results = await res.json() as Array<{
      title: string; videoId: string; author: string;
      lengthSeconds: number; publishedText: string;
    }>;
    if (!results.length) {
      await msg.reply({ embeds: [err("No results found.")] });
      return;
    }
    const top = results.slice(0, 5);
    const description = top.map((v, i) => {
      const mins = Math.floor(v.lengthSeconds / 60);
      const secs = String(v.lengthSeconds % 60).padStart(2, "0");
      return `**${i + 1}.** [${v.title}](https://youtu.be/${v.videoId})\n> ${v.author} · ${mins}:${secs} · ${v.publishedText}`;
    }).join("\n\n");
    await msg.reply({
      embeds: [new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle(`YouTube — ${query}`)
        .setDescription(description)
        .setFooter({ text: "mewo • search • YouTube" })
      ],
    });
  } catch {
    await msg.reply({
      embeds: [new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle(`YouTube — ${query}`)
        .setDescription(`[Search on YouTube](https://www.youtube.com/results?search_query=${encodeURIComponent(query)})`)
        .setFooter({ text: "mewo • search • YouTube" })
      ],
    });
  }
};

// ─── STEAM ────────────────────────────────────────────────────────────────────

export const cmdSteam: Handler = async (msg, args) => {
  if (!args.length) {
    await msg.reply({ embeds: [err("Provide a game name. Usage: `mewo search steam <game>`")] });
    return;
  }
  const query = args.join(" ");
  try {
    const res = await fetch(
      `https://store.steampowered.com/api/storesearch?term=${encodeURIComponent(query)}&l=english&cc=US`
    );
    const d = await res.json() as {
      items?: Array<{
        id: number; name: string; tiny_image: string;
        price?: { final_formatted: string };
        platforms?: { windows: boolean; mac: boolean; linux: boolean };
      }>;
    };
    if (!d.items?.length) {
      await msg.reply({ embeds: [err("No Steam games found.")] });
      return;
    }
    const game = d.items[0];
    const embed = new EmbedBuilder()
      .setColor(0x1B2838)
      .setTitle(`Steam — ${game.name}`)
      .setURL(`https://store.steampowered.com/app/${game.id}`)
      .setThumbnail(game.tiny_image)
      .addFields(
        { name: "App ID", value: `${game.id}`, inline: true },
        { name: "Price", value: game.price?.final_formatted ?? "Free / N/A", inline: true }
      )
      .setFooter({ text: "mewo • search • Steam" });
    if (game.platforms) {
      const p: string[] = [];
      if (game.platforms.windows) p.push("Windows");
      if (game.platforms.mac) p.push("Mac");
      if (game.platforms.linux) p.push("Linux");
      if (p.length) embed.addFields({ name: "Platforms", value: p.join(", "), inline: true });
    }
    await msg.reply({ embeds: [embed] });
  } catch {
    await msg.reply({ embeds: [err("Could not reach Steam API.")] });
  }
};
