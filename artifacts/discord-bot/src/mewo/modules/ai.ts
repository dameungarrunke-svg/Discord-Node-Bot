import type { Message } from "discord.js";
import { EmbedBuilder } from "discord.js";
import { getAiUsage, incrementAiUsage } from "../store.js";

type Handler = (msg: Message, args: string[]) => Promise<void>;

function err(text: string): EmbedBuilder {
  return new EmbedBuilder().setColor(0xED4245).setDescription(`❌ ${text}`);
}

const AI_DAILY_LIMIT = 25;

export const cmdChatgpt: Handler = async (msg, args) => {
  if (!args.length) {
    await msg.reply({ embeds: [err("Provide a prompt. Usage: `mewo ai chatgpt <prompt>`")] });
    return;
  }
  const usage = getAiUsage(msg.author.id);
  if (usage.chatgpt >= AI_DAILY_LIMIT) {
    await msg.reply({ embeds: [err(`Daily limit reached (${AI_DAILY_LIMIT} requests). Resets at midnight UTC.`)] });
    return;
  }
  const openaiKey   = process.env.OPENAI_API_KEY;
  const sambaKey    = process.env.SAMBANOVA_API_KEY;
  const groqKey     = process.env.GROQ_API_KEY;
  if (!openaiKey && !sambaKey && !groqKey) {
    await msg.reply({
      embeds: [new EmbedBuilder()
        .setColor(0xFEE75C)
        .setTitle("AI Chat — Setup Required")
        .setDescription(
          "Add at least one of these to your Railway environment variables:\n\n" +
          "**Free (recommended):** `SAMBANOVA_API_KEY` — Get a free key at [cloud.sambanova.ai](https://cloud.sambanova.ai) (uses Llama 3.3 70B)\n" +
          "**Free alt:** `GROQ_API_KEY` — Get a free key at [console.groq.com](https://console.groq.com) (uses LLaMA 3.1 8B)\n" +
          "**Paid:** `OPENAI_API_KEY` — [platform.openai.com](https://platform.openai.com/api-keys) (uses GPT-4o Mini)"
        )
        .setFooter({ text: "mewo • ai" })
      ],
    });
    return;
  }
  const prompt = args.join(" ");

  let apiUrl: string;
  let model: string;
  let authKey: string;
  let label: string;
  let thinkingText: string;

  if (openaiKey) {
    apiUrl = "https://api.openai.com/v1/chat/completions";
    model  = "gpt-4o-mini";
    authKey = openaiKey;
    label  = "AI Chat — GPT-4o Mini";
    thinkingText = "💭 Thinking with ChatGPT...";
  } else if (sambaKey) {
    apiUrl = "https://api.sambanova.ai/v1/chat/completions";
    model  = "Meta-Llama-3.3-70B-Instruct";
    authKey = sambaKey;
    label  = "AI Chat — Llama 3.3 70B (SambaNova)";
    thinkingText = "🦙 Thinking with Llama 3.3...";
  } else {
    apiUrl = "https://api.groq.com/openai/v1/chat/completions";
    model  = "llama-3.1-8b-instant";
    authKey = groqKey!;
    label  = "AI Chat — LLaMA 3.1 (Groq)";
    thinkingText = "🦙 Thinking with LLaMA...";
  }

  const typing = await msg.reply({
    embeds: [new EmbedBuilder().setColor(0x00B4FF).setDescription(thinkingText)]
  });
  try {
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authKey}` },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1000,
      }),
    });
    const data = await res.json() as {
      choices?: Array<{ message: { content: string } }>;
      error?: { message: string };
    };
    if (data.error) throw new Error(data.error.message);
    const reply = data.choices?.[0]?.message?.content ?? "No response.";
    incrementAiUsage(msg.author.id, "chatgpt");
    await typing.edit({
      embeds: [new EmbedBuilder()
        .setColor(0x00B4FF)
        .setTitle(label)
        .addFields(
          { name: "Question", value: prompt.slice(0, 1024), inline: false },
          { name: "Answer",   value: reply.slice(0, 1024),  inline: false }
        )
        .setFooter({ text: `mewo • ai • ${model} • ${usage.chatgpt + 1}/${AI_DAILY_LIMIT} daily` })
      ],
    });
  } catch (e) {
    await typing.edit({ embeds: [err(`AI error: ${(e as Error).message}`)] });
  }
};

export const cmdLlama: Handler = async (msg, args) => {
  if (!args.length) {
    await msg.reply({ embeds: [err("Provide a prompt. Usage: `mewo ai llama <prompt>`")] });
    return;
  }
  const usage = getAiUsage(msg.author.id);
  if (usage.llama >= AI_DAILY_LIMIT) {
    await msg.reply({ embeds: [err(`Daily limit reached (${AI_DAILY_LIMIT} requests). Resets at midnight UTC.`)] });
    return;
  }
  const sambaKey = process.env.SAMBANOVA_API_KEY;
  const groqKey  = process.env.GROQ_API_KEY;
  if (!sambaKey && !groqKey) {
    await msg.reply({
      embeds: [new EmbedBuilder()
        .setColor(0xFEE75C)
        .setTitle("LLaMA — Setup Required")
        .setDescription(
          "Set one of these in your Railway environment variables:\n\n" +
          "**Recommended (free):** `SAMBANOVA_API_KEY` — [cloud.sambanova.ai](https://cloud.sambanova.ai) (Llama 3.3 70B)\n" +
          "**Alt (free):** `GROQ_API_KEY` — [console.groq.com](https://console.groq.com) (LLaMA 3.1 8B)"
        )
        .setFooter({ text: "mewo • ai" })
      ],
    });
    return;
  }
  const prompt = args.join(" ");

  let apiUrl: string;
  let model: string;
  let authKey: string;
  let label: string;

  if (sambaKey) {
    apiUrl  = "https://api.sambanova.ai/v1/chat/completions";
    model   = "Meta-Llama-3.3-70B-Instruct";
    authKey = sambaKey;
    label   = "Llama 3.3 70B (SambaNova)";
  } else {
    apiUrl  = "https://api.groq.com/openai/v1/chat/completions";
    model   = "llama-3.1-8b-instant";
    authKey = groqKey!;
    label   = "LLaMA 3.1 8B (Groq)";
  }

  const typing = await msg.reply({
    embeds: [new EmbedBuilder().setColor(0x00B4FF).setDescription("🦙 Thinking with LLaMA...")]
  });
  try {
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authKey}` },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1000,
      }),
    });
    const data = await res.json() as {
      choices?: Array<{ message: { content: string } }>;
      error?: { message: string };
    };
    if (data.error) throw new Error(data.error.message);
    const reply = data.choices?.[0]?.message?.content ?? "No response.";
    incrementAiUsage(msg.author.id, "llama");
    await typing.edit({
      embeds: [new EmbedBuilder()
        .setColor(0x00B4FF)
        .setTitle(`LLaMA — ${label}`)
        .addFields(
          { name: "Question", value: prompt.slice(0, 1024), inline: false },
          { name: "Answer",   value: reply.slice(0, 1024),  inline: false }
        )
        .setFooter({ text: `mewo • ai • ${model} • ${usage.llama + 1}/${AI_DAILY_LIMIT} daily` })
      ],
    });
  } catch (e) {
    await typing.edit({ embeds: [err(`AI error: ${(e as Error).message}`)] });
  }
};

export const cmdAiUsage: Handler = async (msg) => {
  const usage = getAiUsage(msg.author.id);
  const bar = (used: number, max: number) => {
    const filled = Math.round((used / max) * 10);
    return `\`${"█".repeat(filled)}${"░".repeat(10 - filled)}\` ${used}/${max}`;
  };
  const chatLabel = process.env.OPENAI_API_KEY
    ? "ChatGPT (GPT-4o Mini)"
    : process.env.SAMBANOVA_API_KEY
      ? "AI Chat (Llama 3.3 70B — SambaNova)"
      : "AI Chat (LLaMA 3.1 — Groq)";
  const llamaLabel = process.env.SAMBANOVA_API_KEY
    ? "LLaMA (Llama 3.3 70B — SambaNova)"
    : "LLaMA 3.1 (Groq)";
  await msg.reply({
    embeds: [new EmbedBuilder()
      .setColor(0x00B4FF)
      .setTitle("AI Usage — Today")
      .addFields(
        { name: chatLabel,              value: bar(usage.chatgpt,  AI_DAILY_LIMIT), inline: false },
        { name: llamaLabel,             value: bar(usage.llama,    AI_DAILY_LIMIT), inline: false },
        { name: "DeepSeek-V3.2 (SambaNova)", value: bar(usage.deepseek, AI_DAILY_LIMIT), inline: false },
        { name: "Resets",               value: "Daily at **midnight UTC**",          inline: false }
      )
      .setFooter({ text: "mewo • ai" })
    ],
  });
};

export const cmdDeepseek: Handler = async (msg, args) => {
  if (!args.length) {
    await msg.reply({ embeds: [err("Provide a prompt. Usage: `mewo ai deepseek <prompt>`")] });
    return;
  }
  const usage = getAiUsage(msg.author.id);
  if (usage.deepseek >= AI_DAILY_LIMIT) {
    await msg.reply({ embeds: [err(`Daily limit reached (${AI_DAILY_LIMIT} requests). Resets at midnight UTC.`)] });
    return;
  }
  const sambaKey = process.env.SAMBANOVA_API_KEY;
  if (!sambaKey) {
    await msg.reply({
      embeds: [new EmbedBuilder()
        .setColor(0xFEE75C)
        .setTitle("DeepSeek — Setup Required")
        .setDescription(
          "Set `SAMBANOVA_API_KEY` in your Railway environment variables to enable this command.\n\n" +
          "Get a **free** key at [cloud.sambanova.ai](https://cloud.sambanova.ai)."
        )
        .setFooter({ text: "mewo • ai" })
      ],
    });
    return;
  }
  const prompt = args.join(" ");
  const typing = await msg.reply({
    embeds: [new EmbedBuilder().setColor(0x4B5CC4).setDescription("🧠 Thinking with DeepSeek...")]
  });
  try {
    const res = await fetch("https://api.sambanova.ai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${sambaKey}` },
      body: JSON.stringify({
        model: "DeepSeek-V3-0324",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1500,
      }),
    });
    const data = await res.json() as {
      choices?: Array<{ message: { content: string } }>;
      error?: { message: string };
    };
    if (data.error) throw new Error(data.error.message);
    const reply = data.choices?.[0]?.message?.content ?? "No response.";
    incrementAiUsage(msg.author.id, "deepseek");
    await typing.edit({
      embeds: [new EmbedBuilder()
        .setColor(0x4B5CC4)
        .setTitle("DeepSeek-V3 — SambaNova (Free)")
        .addFields(
          { name: "Prompt", value: prompt.slice(0, 1024), inline: false },
          { name: "Answer", value: reply.slice(0, 1024),  inline: false }
        )
        .setFooter({ text: `mewo • ai • DeepSeek-V3-0324 via SambaNova • ${usage.deepseek + 1}/${AI_DAILY_LIMIT} daily` })
      ],
    });
  } catch (e) {
    await typing.edit({ embeds: [err(`DeepSeek error: ${(e as Error).message}`)] });
  }
};

export const cmdOcr: Handler = async (msg) => {
  const attachment = msg.attachments.first();
  if (!attachment) {
    await msg.reply({ embeds: [err("Attach an image to extract text from. Usage: `mewo ai ocr` + image attachment")] });
    return;
  }
  const key = process.env.OCR_API_KEY ?? "K81768361488957";
  const thinking = await msg.reply({
    embeds: [new EmbedBuilder().setColor(0x00B4FF).setDescription("🔍 Extracting text...")]
  });
  try {
    const res = await fetch(
      `https://api.ocr.space/parse/imageurl?apikey=${key}&url=${encodeURIComponent(attachment.url)}&language=eng&isOverlayRequired=false`,
      { headers: { "User-Agent": "MewoBot/1.0" } }
    );
    const data = await res.json() as {
      ParsedResults?: Array<{ ParsedText: string }>;
      IsErroredOnProcessing?: boolean;
      ErrorMessage?: string | string[];
    };
    if (data.IsErroredOnProcessing) {
      const msg2 = Array.isArray(data.ErrorMessage) ? data.ErrorMessage.join(" ") : data.ErrorMessage ?? "Unknown error";
      await thinking.edit({ embeds: [err(`OCR failed: ${msg2}`)] });
      return;
    }
    const text = data.ParsedResults?.[0]?.ParsedText?.trim();
    if (!text) {
      await thinking.edit({ embeds: [err("No text found in the image.")] });
      return;
    }
    await thinking.edit({
      embeds: [new EmbedBuilder()
        .setColor(0x00B4FF)
        .setTitle("OCR — Extracted Text")
        .setThumbnail(attachment.url)
        .setDescription(`\`\`\`\n${text.slice(0, 2000)}\n\`\`\``)
        .setFooter({ text: "mewo • ai • OCR.space" })
      ],
    });
  } catch (e) {
    await thinking.edit({ embeds: [err(`OCR error: ${(e as Error).message}`)] });
  }
};

export const cmdScreenshot: Handler = async (msg, args) => {
  if (!args.length) {
    await msg.reply({ embeds: [err("Provide a URL. Usage: `mewo ai screenshot <url>`")] });
    return;
  }
  let url = args[0];
  if (!url.startsWith("http")) url = "https://" + url;
  const thinking = await msg.reply({
    embeds: [new EmbedBuilder().setColor(0x00B4FF).setDescription("📸 Taking screenshot...")]
  });
  try {
    const screenshotUrl = `https://image.thum.io/get/width/1280/crop/720/noanimate/${encodeURIComponent(url)}`;
    const check = await fetch(screenshotUrl, { method: "HEAD" });
    if (!check.ok) throw new Error("Screenshot service unavailable");
    await thinking.edit({
      embeds: [new EmbedBuilder()
        .setColor(0x00B4FF)
        .setTitle("Website Screenshot")
        .setURL(url)
        .setDescription(`📸 **[${url}](${url})**`)
        .setImage(screenshotUrl)
        .setFooter({ text: "mewo • ai • thum.io" })
      ],
    });
  } catch (e) {
    await thinking.edit({ embeds: [err(`Screenshot failed: ${(e as Error).message}`)] });
  }
};

export const cmdDownload: Handler = async (msg, args) => {
  if (!args.length) {
    await msg.reply({ embeds: [err("Provide a URL. Usage: `mewo ai download <url>`\nSupports YouTube, TikTok, Twitter, Instagram, Reddit, and more.")] });
    return;
  }
  const url = args[0];
  const thinking = await msg.reply({
    embeds: [new EmbedBuilder().setColor(0x00B4FF).setDescription("⬇️ Processing download...")]
  });
  try {
    const res = await fetch("https://api.cobalt.tools/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({ url, videoQuality: "720", filenameStyle: "pretty" }),
    });
    if (!res.ok) throw new Error(`cobalt returned ${res.status}`);
    const data = await res.json() as {
      status: string;
      url?: string;
      filename?: string;
      error?: { code?: string };
      picker?: Array<{ url: string; thumb?: string }>;
    };
    if (data.status === "error") {
      throw new Error(data.error?.code ?? "Unknown cobalt error");
    }
    if (data.status === "picker" && data.picker?.length) {
      const links = data.picker.slice(0, 5).map((p, i) => `[Media ${i + 1}](${p.url})`).join("\n");
      await thinking.edit({
        embeds: [new EmbedBuilder()
          .setColor(0x00B4FF)
          .setTitle("Media Download — Multiple Files")
          .setDescription(`**${url}**\n\n${links}\n\n> Right-click → Save as to download`)
          .setFooter({ text: "mewo • ai • cobalt.tools" })
        ],
      });
      return;
    }
    if (data.url) {
      await thinking.edit({
        embeds: [new EmbedBuilder()
          .setColor(0x57F287)
          .setTitle("Media Download — Ready")
          .setDescription(`**[Click here to download](${data.url})**\n\n\`${url}\`\n\n> Link expires in a few minutes. Download quickly!`)
          .setFooter({ text: "mewo • ai • cobalt.tools" })
        ],
      });
      return;
    }
    throw new Error("No download URL returned");
  } catch (e) {
    await thinking.edit({ embeds: [err(`Download failed: ${(e as Error).message}`)] });
  }
};

export const cmdGrokImagine: Handler = async (msg, args) => {
  if (!args.length) {
    await msg.reply({ embeds: [err("Provide a prompt. Usage: `mewo ai imagine <prompt>`")] });
    return;
  }
  const prompt = args.join(" ");
  const thinking = await msg.reply({
    embeds: [new EmbedBuilder().setColor(0x00B4FF).setDescription("🎨 Generating image... (free, no key needed)")]
  });
  try {
    const encoded = encodeURIComponent(prompt);
    const seed = Math.floor(Math.random() * 999999);
    const imageUrl = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&seed=${seed}&nologo=true&enhance=true`;
    const check = await fetch(imageUrl, { method: "HEAD" });
    if (!check.ok) throw new Error("Image service unavailable");
    await thinking.edit({
      embeds: [new EmbedBuilder()
        .setColor(0x00B4FF)
        .setTitle("AI Image Generation")
        .setDescription(`> ${prompt}`)
        .setImage(imageUrl)
        .setFooter({ text: "mewo • ai • Pollinations.ai (free)" })
      ],
    });
  } catch (e) {
    await thinking.edit({ embeds: [err(`Image generation failed: ${(e as Error).message}`)] });
  }
};

export const cmdPerplexity: Handler = async (msg, args) => {
  if (!args.length) {
    await msg.reply({ embeds: [err("Provide a query. Usage: `mewo ai perplexity <query>`")] });
    return;
  }
  const key = process.env.PERPLEXITY_API_KEY;
  if (!key) {
    await msg.reply({
      embeds: [new EmbedBuilder()
        .setColor(0xFEE75C)
        .setTitle("Perplexity — Setup Required")
        .setDescription("Set `PERPLEXITY_API_KEY` in your Railway environment variables.\n\nGet a key at [perplexity.ai](https://www.perplexity.ai/settings/api).")
        .setFooter({ text: "mewo • ai" })
      ],
    });
    return;
  }
  const query = args.join(" ");
  const thinking = await msg.reply({
    embeds: [new EmbedBuilder().setColor(0x20B2AA).setDescription("🔎 Searching the web...")]
  });
  try {
    const res = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
      body: JSON.stringify({
        model: "sonar",
        messages: [{ role: "user", content: query }],
        max_tokens: 800,
      }),
    });
    const data = await res.json() as {
      choices?: Array<{ message: { content: string } }>;
      citations?: string[];
      error?: { message: string };
    };
    if (data.error) throw new Error(data.error.message);
    const answer = data.choices?.[0]?.message?.content ?? "No answer.";
    const citations = data.citations?.slice(0, 3) ?? [];
    const embed = new EmbedBuilder()
      .setColor(0x20B2AA)
      .setTitle("Perplexity Web Search")
      .addFields({ name: "Query", value: query.slice(0, 256), inline: false })
      .setDescription(answer.slice(0, 2000))
      .setFooter({ text: "mewo • ai • Perplexity Sonar" });
    if (citations.length) {
      embed.addFields({ name: "Sources", value: citations.map((c, i) => `[${i + 1}] ${c}`).join("\n").slice(0, 1024), inline: false });
    }
    await thinking.edit({ embeds: [embed] });
  } catch (e) {
    await thinking.edit({ embeds: [err(`Perplexity error: ${(e as Error).message}`)] });
  }
};

export const cmdTtsOpenai: Handler = async (msg, args) => {
  if (!args.length) {
    await msg.reply({ embeds: [err("Provide text. Usage: `mewo ai tts openai <text>`")] });
    return;
  }
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    await msg.reply({
      embeds: [new EmbedBuilder()
        .setColor(0xFEE75C)
        .setTitle("TTS (OpenAI) — Setup Required")
        .setDescription("Set `OPENAI_API_KEY` in your Railway environment variables.")
        .setFooter({ text: "mewo • ai" })
      ],
    });
    return;
  }
  const text = args.join(" ").slice(0, 4096);
  const thinking = await msg.reply({
    embeds: [new EmbedBuilder().setColor(0x00B4FF).setDescription("🔊 Generating speech...")]
  });
  try {
    const res = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
      body: JSON.stringify({ model: "tts-1", voice: "alloy", input: text }),
    });
    if (!res.ok) {
      const e = await res.json() as { error?: { message: string } };
      throw new Error(e.error?.message ?? `HTTP ${res.status}`);
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    await thinking.delete().catch(() => {});
    await msg.reply({
      embeds: [new EmbedBuilder()
        .setColor(0x00B4FF)
        .setTitle("Text to Speech — OpenAI")
        .setDescription(`> ${text.slice(0, 300)}`)
        .setFooter({ text: "mewo • ai • OpenAI TTS • voice: alloy" })
      ],
      files: [{ attachment: buffer, name: "speech.mp3" }],
    });
  } catch (e) {
    await thinking.edit({ embeds: [err(`TTS error: ${(e as Error).message}`)] });
  }
};

export const cmdTtsElevenlabs: Handler = async (msg, args) => {
  if (!args.length) {
    await msg.reply({ embeds: [err("Provide text. Usage: `mewo ai tts elevenlabs <text>`")] });
    return;
  }
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) {
    await msg.reply({
      embeds: [new EmbedBuilder()
        .setColor(0xFEE75C)
        .setTitle("TTS (ElevenLabs) — Setup Required")
        .setDescription("Set `ELEVENLABS_API_KEY` in your Railway environment variables.\n\nGet a free key at [elevenlabs.io](https://elevenlabs.io).")
        .setFooter({ text: "mewo • ai" })
      ],
    });
    return;
  }
  const text = args.join(" ").slice(0, 2500);
  const voiceId = process.env.ELEVENLABS_VOICE_ID ?? "21m00Tcm4TlvDq8ikWAM";
  const thinking = await msg.reply({
    embeds: [new EmbedBuilder().setColor(0x9B59B6).setDescription("🎙️ Generating speech with ElevenLabs...")]
  });
  try {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": key,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
      },
      body: JSON.stringify({ text, model_id: "eleven_monolingual_v1", voice_settings: { stability: 0.5, similarity_boost: 0.75 } }),
    });
    if (!res.ok) {
      const e = await res.json() as { detail?: { message?: string } };
      throw new Error(e.detail?.message ?? `HTTP ${res.status}`);
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    await thinking.delete().catch(() => {});
    await msg.reply({
      embeds: [new EmbedBuilder()
        .setColor(0x9B59B6)
        .setTitle("Text to Speech — ElevenLabs")
        .setDescription(`> ${text.slice(0, 300)}`)
        .setFooter({ text: "mewo • ai • ElevenLabs" })
      ],
      files: [{ attachment: buffer, name: "speech.mp3" }],
    });
  } catch (e) {
    await thinking.edit({ embeds: [err(`ElevenLabs error: ${(e as Error).message}`)] });
  }
};

export const cmdDeepGeolocate: Handler = async (msg, args) => {
  if (!args.length) {
    await msg.reply({ embeds: [err("Provide an IP address or domain. Usage: `mewo ai deepgeolocate <ip/domain>`")] });
    return;
  }
  const target = args[0];
  const thinking = await msg.reply({
    embeds: [new EmbedBuilder().setColor(0x00B4FF).setDescription("🌍 Running deep geolocation analysis...")]
  });
  try {
    const [r1, r2, r3] = await Promise.allSettled([
      fetch(`https://ipapi.co/${target}/json/`).then(r => r.json()),
      fetch(`https://ip-api.com/json/${target}?fields=status,country,regionName,city,zip,lat,lon,timezone,isp,org,as,mobile,proxy,hosting,query`).then(r => r.json()),
      fetch(`https://ipinfo.io/${target}/json`).then(r => r.json()),
    ]);

    const d1 = r1.status === "fulfilled" ? r1.value as Record<string, unknown> : null;
    const d2 = r2.status === "fulfilled" ? r2.value as Record<string, unknown> : null;
    const d3 = r3.status === "fulfilled" ? r3.value as Record<string, unknown> : null;

    const pick = (...vals: unknown[]) => vals.find(v => v && String(v) !== "N/A" && String(v) !== "undefined" && String(v) !== "") ?? "N/A";

    const country = pick(d1?.["country_name"], d2?.["country"], d3?.["country"]);
    const region = pick(d1?.["region"], d2?.["regionName"], d3?.["region"]);
    const city = pick(d1?.["city"], d2?.["city"], d3?.["city"]);
    const isp = pick(d1?.["org"], d2?.["isp"], d3?.["org"]);
    const asn = pick(d1?.["asn"], d2?.["as"], d3?.["org"]);
    const tz = pick(d1?.["timezone"], d2?.["timezone"], d3?.["timezone"]);
    const lat = pick(d1?.["latitude"], d2?.["lat"]);
    const lon = pick(d1?.["longitude"], d2?.["lon"]);
    const postal = pick(d1?.["postal"], d2?.["zip"], d3?.["postal"]);
    const mobile = d2?.["mobile"] ?? "Unknown";
    const proxy = d2?.["proxy"] ?? "Unknown";
    const hosting = d2?.["hosting"] ?? "Unknown";

    const mapsUrl = lat !== "N/A" && lon !== "N/A"
      ? `[View on Map](https://www.google.com/maps?q=${lat},${lon})`
      : "N/A";

    const sources = [r1.status === "fulfilled" ? "ipapi.co" : null, r2.status === "fulfilled" ? "ip-api.com" : null, r3.status === "fulfilled" ? "ipinfo.io" : null]
      .filter(Boolean).join(", ");

    await thinking.edit({
      embeds: [new EmbedBuilder()
        .setColor(0x00B4FF)
        .setTitle(`🌍 Deep Geolocation — ${target}`)
        .addFields(
          { name: "Country", value: String(country), inline: true },
          { name: "Region", value: String(region), inline: true },
          { name: "City", value: String(city), inline: true },
          { name: "Postal Code", value: String(postal), inline: true },
          { name: "Coordinates", value: lat !== "N/A" ? `${lat}, ${lon}` : "N/A", inline: true },
          { name: "Map", value: mapsUrl, inline: true },
          { name: "ISP", value: String(isp), inline: false },
          { name: "ASN", value: String(asn), inline: true },
          { name: "Timezone", value: String(tz), inline: true },
          { name: "Mobile", value: String(mobile), inline: true },
          { name: "Proxy/VPN", value: String(proxy), inline: true },
          { name: "Hosting/DC", value: String(hosting), inline: true },
        )
        .setFooter({ text: `mewo • ai • Deep Geolocation • Sources: ${sources}` })
      ],
    });
  } catch (e) {
    await thinking.edit({ embeds: [err(`Geolocation failed: ${(e as Error).message}`)] });
  }
};
