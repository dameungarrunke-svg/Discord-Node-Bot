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
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    await msg.reply({
      embeds: [new EmbedBuilder()
        .setColor(0xFEE75C)
        .setTitle("ChatGPT — Setup Required")
        .setDescription("Set `OPENAI_API_KEY` in your Railway environment variables to enable this command.\n\nGet a key at [platform.openai.com](https://platform.openai.com/api-keys).")
        .setFooter({ text: "mewo • ai" })
      ],
    });
    return;
  }
  const prompt = args.join(" ");
  const typing = await msg.reply({
    embeds: [new EmbedBuilder().setColor(0x00B4FF).setDescription("💭 Thinking...")]
  });
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
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
        .setTitle("ChatGPT")
        .addFields(
          { name: "Question", value: prompt.slice(0, 1024), inline: false },
          { name: "Answer", value: reply.slice(0, 1024), inline: false }
        )
        .setFooter({ text: `mewo • ai • GPT-4o Mini • ${usage.chatgpt + 1}/${AI_DAILY_LIMIT} daily` })
      ],
    });
  } catch (e) {
    await typing.edit({ embeds: [err(`OpenAI error: ${(e as Error).message}`)] });
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
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    await msg.reply({
      embeds: [new EmbedBuilder()
        .setColor(0xFEE75C)
        .setTitle("LLaMA — Setup Required")
        .setDescription("Set `GROQ_API_KEY` in your Railway environment variables to enable this command.\n\nGet a **free** key at [console.groq.com](https://console.groq.com).")
        .setFooter({ text: "mewo • ai" })
      ],
    });
    return;
  }
  const prompt = args.join(" ");
  const typing = await msg.reply({
    embeds: [new EmbedBuilder().setColor(0x00B4FF).setDescription("🦙 Thinking with LLaMA...")]
  });
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
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
        .setTitle("LLaMA 3.1")
        .addFields(
          { name: "Question", value: prompt.slice(0, 1024), inline: false },
          { name: "Answer", value: reply.slice(0, 1024), inline: false }
        )
        .setFooter({ text: `mewo • ai • LLaMA-3.1-8b-instant • ${usage.llama + 1}/${AI_DAILY_LIMIT} daily` })
      ],
    });
  } catch (e) {
    await typing.edit({ embeds: [err(`Groq error: ${(e as Error).message}`)] });
  }
};

export const cmdAiUsage: Handler = async (msg) => {
  const usage = getAiUsage(msg.author.id);
  const bar = (used: number, max: number) => {
    const filled = Math.round((used / max) * 10);
    return `\`${"█".repeat(filled)}${"░".repeat(10 - filled)}\` ${used}/${max}`;
  };
  await msg.reply({
    embeds: [new EmbedBuilder()
      .setColor(0x00B4FF)
      .setTitle("AI Usage — Today")
      .addFields(
        { name: "ChatGPT (GPT-4o Mini)", value: bar(usage.chatgpt, AI_DAILY_LIMIT), inline: false },
        { name: "LLaMA 3.1 (Groq)", value: bar(usage.llama, AI_DAILY_LIMIT), inline: false },
        { name: "Resets", value: "Daily at **midnight UTC**", inline: false }
      )
      .setFooter({ text: "mewo • ai" })
    ],
  });
};

export const cmdOcr: Handler = async (msg) => {
  await msg.reply({
    embeds: [new EmbedBuilder()
      .setColor(0x00B4FF)
      .setTitle("OCR — Extract Text from Image")
      .setDescription(
        "This feature requires an OCR API key.\n\n" +
        "Set `OCR_API_KEY` from [ocr.space](https://ocr.space/ocrapi) (free tier available) in your Railway environment variables."
      )
      .setFooter({ text: "mewo • ai • coming soon" })
    ],
  });
};

export const cmdScreenshot: Handler = async (msg) => {
  await msg.reply({
    embeds: [new EmbedBuilder()
      .setColor(0x00B4FF)
      .setTitle("Website Screenshot")
      .setDescription("Headless browser screenshots require an external API.\n\nThis feature is coming soon.")
      .setFooter({ text: "mewo • ai • coming soon" })
    ],
  });
};

export const cmdDownload: Handler = async (msg) => {
  await msg.reply({
    embeds: [new EmbedBuilder()
      .setColor(0x00B4FF)
      .setTitle("Media Download")
      .setDescription("Media download from external sites is coming soon.")
      .setFooter({ text: "mewo • ai • coming soon" })
    ],
  });
};
