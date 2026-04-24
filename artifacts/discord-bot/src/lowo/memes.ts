import type { Message } from "discord.js";

function pickArgs(message: Message, args: string[], n: number): string[] {
  const mentions = message.mentions.users.map(u => `**${u.username}**`);
  const text = args.filter(a => !a.startsWith("<@")).join(" ").trim();
  const parts = text.length > 0 ? text.split("|").map(s => s.trim()).filter(Boolean) : [];
  const out: string[] = [...mentions, ...parts];
  while (out.length < n) out.push("???");
  return out.slice(0, n);
}

export async function cmdSpongebobChicken(m: Message, args: string[]): Promise<void> {
  const [a, b] = pickArgs(m, args, 2);
  await m.reply(`🐔 **${a}** vs **${b}**\n\`\`\`\n   🍗 ${a}\n  /\n 🐔  →  ${b}\n\`\`\``);
}
export async function cmdSlapcar(m: Message, args: string[]): Promise<void> {
  const [a, b] = pickArgs(m, args, 2);
  await m.reply(`🚗💢 **${a}** slaps the roof of this **${b}**: "this bad boy can fit so much in it"`);
}
export async function cmdIsthisa(m: Message, args: string[]): Promise<void> {
  const [a, b] = pickArgs(m, args, 2);
  await m.reply(`🦋 **${a}**: *(pointing at ${b})*\n"Is this a... pigeon?"`);
}
export async function cmdDrake(m: Message, args: string[]): Promise<void> {
  const [a, b] = pickArgs(m, args, 2);
  await m.reply(`🙅‍♂️ Drake: NO → **${a}**\n🙆‍♂️ Drake: YES → **${b}**`);
}
export async function cmdDistractedbf(m: Message, args: string[]): Promise<void> {
  const [a, b, c] = pickArgs(m, args, 3);
  await m.reply(`👨 **${a}** *(boyfriend)* turns to look at 👩 **${c}** while ignoring 😡 **${b}** *(girlfriend)*`);
}
export async function cmdCommunismcat(m: Message, args: string[]): Promise<void> {
  const [a] = pickArgs(m, args, 1);
  await m.reply(`☭🐈 *"Our **${a}**, comrade."* — Communism Cat approves.`);
}
export async function cmdEject(m: Message, args: string[]): Promise<void> {
  const [a] = pickArgs(m, args, 1);
  await m.reply(`🚀 **${a}** was ejected.\n${Math.random() < 0.5 ? "❌ They were **NOT** an Impostor." : "✅ They **WERE** an Impostor."}`);
}
export async function cmdEmergencyMeeting(m: Message, args: string[]): Promise<void> {
  const reason = args.join(" ") || "no reason given";
  await m.reply(`🚨 **EMERGENCY MEETING** 🚨\nCalled by **${m.author.username}**\n📝 Reason: *${reason}*`);
}
export async function cmdHeadpat(m: Message): Promise<void> {
  const t = m.mentions.users.first();
  if (!t) { await m.reply("Usage: `lowo headpat @user`"); return; }
  await m.reply(`🫶 *pats* **${t.username}** *gently on the head* — good ${["bean", "cat", "puppy", "lowo"][Math.floor(Math.random()*4)]}!`);
}
export async function cmdTradeoffer(m: Message, args: string[]): Promise<void> {
  const [a, b] = pickArgs(m, args, 2);
  await m.reply(`📜 **Trade Offer**\n📥 I receive: **${a}**\n📤 You receive: **${b}**`);
}
export async function cmdWaddle(m: Message): Promise<void> {
  await m.reply(`🐧 **${m.author.username}** waddles on by... 🐧`);
}
