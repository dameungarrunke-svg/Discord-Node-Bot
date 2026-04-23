// Per-command configuration: GIF lookups + text variations.
// {user} = invoker mention, {target} = target mention.

import type { GifLookup } from "./gifService.js";

export type CommandKind = "social" | "troll" | "relationship" | "answer" | "meme" | "game" | "ls" | "bonus";

export interface FunCmd {
  name: string;
  description: string;
  kind: CommandKind;
  /** True if the command takes a target user. */
  needsTarget?: boolean;
  /** True if a target mention is allowed (defaulting to the invoker). */
  optionalTarget?: boolean;
  gif: GifLookup;
  texts: string[];
  /** Optional special handler key (game logic / random pickers). */
  special?: string;
  emoji?: string;
}

const T = (xs: string[]) => xs;

// ─── SOCIAL ────────────────────────────────────────────────────────────────────
const SOCIAL: FunCmd[] = [
  { name: "hug", emoji: "🤗", description: "Hug someone", kind: "social", needsTarget: true,
    gif: { endpoints: ["hug","cuddle","glomp"], queries: ["anime girl hug","anime hug cute","kawaii hug","anime cuddle girl"] },
    texts: T([
      "{user} hugs {target} tightly 💖",
      "{user} gives a warm hug to {target}",
      "{target} got hugged by {user}!",
      "{user} can't stop hugging {target}",
      "{user} wraps {target} in a cozy hug",
      "Awww — {user} squeezes {target} like a plushie",
      "{user} pulls {target} in for the softest hug",
    ]) },
  { name: "slap", emoji: "🖐️", description: "Slap someone", kind: "social", needsTarget: true,
    gif: { endpoints: ["slap","bonk","kick"], queries: ["anime girl slap","anime slap","kawaii slap"] },
    texts: T([
      "{user} slaps {target} 😤",
      "{target} just got slapped by {user}!",
      "{user} delivers a clean slap to {target}",
      "{user} smacks {target} into next week",
      "{target} caught hands from {user}",
      "Oof — {user} slapped {target} so hard the chat lagged",
    ]) },
  { name: "kiss", emoji: "💋", description: "Kiss someone", kind: "social", needsTarget: true,
    gif: { endpoints: ["kiss","peck","blush"], queries: ["anime kiss","anime girl kiss","kawaii kiss"] },
    texts: T([
      "{user} kisses {target} 💋",
      "{user} plants a soft kiss on {target}",
      "{target} got a sweet kiss from {user}",
      "{user} steals a kiss from {target}",
      "{user} blushes and kisses {target}",
    ]) },
  { name: "pat", emoji: "✋", description: "Pat someone", kind: "social", needsTarget: true,
    gif: { endpoints: ["pat","happy","smile"], queries: ["anime headpat","anime girl pat","kawaii pat"] },
    texts: T([
      "{user} pats {target} on the head ✋",
      "Pat pat — {user} headpats {target}",
      "{target} gets the softest pats from {user}",
      "{user} approves of {target} and pats them",
      "Good {target}! — pats from {user}",
    ]) },
  { name: "cuddle", emoji: "🫂", description: "Cuddle someone", kind: "social", needsTarget: true,
    gif: { endpoints: ["cuddle","hug","handhold"], queries: ["anime cuddle","anime girl cuddle"] },
    texts: T([
      "{user} cuddles up to {target} 🫂",
      "{user} won't let go of {target}",
      "{target} is being cuddled by {user}",
      "{user} curls up next to {target}",
    ]) },
  { name: "poke", emoji: "👉", description: "Poke someone", kind: "social", needsTarget: true,
    gif: { endpoints: ["poke","stare","wink"], queries: ["anime poke","anime girl poke"] },
    texts: T([
      "{user} pokes {target} 👉",
      "*poke poke* — {user} bothering {target} again",
      "{user} won't stop poking {target}",
      "{target} got poked by {user}",
    ]) },
  { name: "bite", emoji: "😬", description: "Bite someone", kind: "social", needsTarget: true,
    gif: { endpoints: ["bite","nom","bully"], queries: ["anime bite","anime girl bite"] },
    texts: T([
      "{user} bites {target} 😬",
      "Ouch! {user} just bit {target}",
      "{target} got chomped by {user}",
      "{user} sinks teeth into {target}",
    ]) },
  { name: "highfive", emoji: "🙌", description: "High-five someone", kind: "social", needsTarget: true,
    gif: { endpoints: ["highfive","happy","wave"], queries: ["anime highfive","anime girl high five"] },
    texts: T([
      "{user} high-fives {target} 🙌",
      "Nice — {user} and {target} share a high five",
      "{user} hits {target} with a clean high five",
    ]) },
  { name: "handhold", emoji: "🤝", description: "Hold hands with someone", kind: "social", needsTarget: true,
    gif: { endpoints: ["handhold","blush","cuddle"], queries: ["anime hand hold","anime holding hands"] },
    texts: T([
      "{user} holds {target}'s hand 🤝",
      "{user} and {target} are walking hand in hand…",
      "{user} shyly grabs {target}'s hand",
    ]) },
  { name: "stare", emoji: "👀", description: "Stare at someone", kind: "social", needsTarget: true,
    gif: { endpoints: ["stare","smug","wink"], queries: ["anime stare","anime girl staring"] },
    texts: T([
      "{user} stares deeply at {target} 👀",
      "{user} won't stop looking at {target}…",
      "{target} feels {user}'s gaze burning",
    ]) },
];

// ─── TROLL ─────────────────────────────────────────────────────────────────────
const TROLL: FunCmd[] = [
  { name: "roast", emoji: "🔥", description: "Roast someone", kind: "troll", needsTarget: true,
    gif: { endpoints: ["smug","bully","laugh"], queries: ["anime roast","anime girl smug"] },
    texts: T([
      "{target}, even your loading screen has more personality 🔥",
      "{target}, your ping is lower than your kill count",
      "{target} runs faster from fights than from responsibilities",
      "{target}, you're built like a tutorial enemy",
      "{target}, you're the reason the team needs a backup plan",
    ]) },
  { name: "insult", emoji: "💢", description: "Insult someone (playfully)", kind: "troll", needsTarget: true,
    gif: { endpoints: ["bully","smug"], queries: ["anime girl angry","anime insult"] },
    texts: T([
      "{target}, NPC behaviour detected 💢",
      "{target}, even Discord rate-limits your vibes",
      "{target}, please uninstall life",
      "{target}, the airpods on your shelf had more rizz than you",
    ]) },
  { name: "toxicrate", emoji: "☢️", description: "Rate someone's toxicity", kind: "troll", needsTarget: true,
    gif: { endpoints: ["smug","laugh"], queries: ["anime girl evil","anime smug"] },
    special: "rate100", texts: T([
      "{target}'s toxicity level: **{n}/100** ☢️",
      "Toxic-meter for {target}: **{n}%**",
    ]) },
  { name: "cancel", emoji: "🚫", description: "Cancel someone", kind: "troll", needsTarget: true,
    gif: { endpoints: ["smug","facepalm","bully"], queries: ["anime cancel","anime girl point"] },
    texts: T([
      "{target} has been cancelled 🚫",
      "{user} is officially cancelling {target}. Pack it up.",
      "Breaking: {target} has been cancelled by {user}",
    ]) },
  { name: "ratio", emoji: "📉", description: "Ratio someone", kind: "troll", needsTarget: true,
    gif: { endpoints: ["smug","laugh"], queries: ["anime smirk","anime girl smug"] },
    texts: T([
      "{target} ratio + L + you fell off 📉",
      "+ ratio + {target} could never",
      "Ratio {target}. No appeals.",
    ]) },
  { name: "clown", emoji: "🤡", description: "Clown someone", kind: "troll", needsTarget: true,
    gif: { endpoints: ["laugh","smug"], queries: ["anime clown","anime girl laughing"] },
    texts: T([
      "🤡 {target} the clown has arrived",
      "Honk honk — {target} is performing today",
      "{target} just clowned themselves",
    ]) },
  { name: "expose", emoji: "🕵️", description: "Expose someone", kind: "troll", needsTarget: true,
    gif: { endpoints: ["smug","stare"], queries: ["anime detective","anime girl gasp"] },
    texts: T([
      "🕵️ {user} has exposed {target}",
      "Receipts dropped — {target} is finished",
      "{target}'s alt account has been revealed",
    ]) },
  { name: "skillissue", emoji: "🎮", description: "Call out a skill issue", kind: "troll", needsTarget: true,
    gif: { endpoints: ["smug","facepalm"], queries: ["anime gaming rage","anime smug"] },
    texts: T([
      "{target} — skill issue 🎮",
      "Maybe try aiming, {target}",
      "Server isn't lagging, {target} is just bad",
    ]) },
  { name: "noobrate", emoji: "🥚", description: "Rate someone's noob level", kind: "troll", needsTarget: true,
    gif: { endpoints: ["laugh","smug"], queries: ["anime confused","anime facepalm"] },
    special: "rate100", texts: T([
      "{target}'s noob level: **{n}/100** 🥚",
      "Newbie meter for {target}: **{n}%**",
    ]) },
  { name: "sus", emoji: "🤨", description: "Call someone sus", kind: "troll", needsTarget: true,
    gif: { endpoints: ["stare","smug"], queries: ["anime sus","anime girl side eye"] },
    texts: T([
      "{target} is acting kinda sus 🤨",
      "Sus alert — {target}",
      "I'm voting {target} this round",
    ]) },
];

// ─── RELATIONSHIP ──────────────────────────────────────────────────────────────
const RELATIONSHIP: FunCmd[] = [
  { name: "love", emoji: "❤️", description: "Show love", kind: "relationship", needsTarget: true,
    gif: { endpoints: ["kiss","hug","blush"], queries: ["anime love","anime girl heart"] },
    texts: T([
      "{user} ❤️ {target}",
      "{user} loves {target} more than anything",
      "{user} confesses their love to {target}",
    ]) },
  { name: "marry", emoji: "💍", description: "Propose to someone", kind: "relationship", needsTarget: true,
    gif: { endpoints: ["kiss","blush","handhold"], queries: ["anime wedding","anime proposal"] },
    texts: T([
      "💍 {user} proposes to {target}!",
      "{user} kneels and asks {target} to marry them",
      "Wedding bells! {user} just married {target}",
    ]) },
  { name: "divorce", emoji: "💔", description: "Divorce someone", kind: "relationship", needsTarget: true,
    gif: { endpoints: ["cry","facepalm","slap"], queries: ["anime breakup","anime sad girl"] },
    texts: T([
      "💔 {user} divorced {target}. It's over.",
      "{user} sends the divorce papers to {target}",
      "{target} is now single, courtesy of {user}",
    ]) },
  { name: "crush", emoji: "💘", description: "Reveal a crush", kind: "relationship", needsTarget: true,
    gif: { endpoints: ["blush","wink","kiss"], queries: ["anime crush","anime blush"] },
    texts: T([
      "💘 {user} has a crush on {target}",
      "{user} can't stop thinking about {target}",
      "{user} secretly likes {target}",
    ]) },
  { name: "ship", emoji: "🚢", description: "Ship two users", kind: "relationship", needsTarget: true,
    gif: { endpoints: ["kiss","handhold","blush"], queries: ["anime couple","anime ship"] },
    special: "rate100", texts: T([
      "{user} 🚢 {target} — compatibility: **{n}%**",
      "Shipping {user} × {target} → **{n}%** match",
    ]) },
  { name: "rizz", emoji: "😎", description: "Rate someone's rizz", kind: "relationship", needsTarget: true, optionalTarget: true,
    gif: { endpoints: ["smug","wink"], queries: ["anime rizz","anime smooth"] },
    special: "rate100", texts: T([
      "{target}'s rizz level: **{n}/100** 😎",
      "Rizz meter for {target}: **{n}%**",
    ]) },
  { name: "simp", emoji: "🥺", description: "Call someone a simp", kind: "relationship", needsTarget: true,
    gif: { endpoints: ["blush","cry","cuddle"], queries: ["anime simp","anime blush"] },
    texts: T([
      "🥺 {target} is being a simp again",
      "{target} dropped a 50-line paragraph in DMs",
      "Simp detected: {target}",
    ]) },
  { name: "date", emoji: "🌹", description: "Ask someone on a date", kind: "relationship", needsTarget: true,
    gif: { endpoints: ["handhold","blush","kiss"], queries: ["anime date","anime couple"] },
    texts: T([
      "🌹 {user} takes {target} on a date",
      "{user} and {target} went on a cute date",
      "{user} asked {target} out — they said yes!",
    ]) },
  { name: "gf", emoji: "👧", description: "Get a random gf", kind: "relationship", optionalTarget: true,
    gif: { endpoints: ["blush","wink","smile"], queries: ["anime girlfriend","anime girl waifu"] },
    special: "pickName", texts: T([
      "{user}'s new gf is **{pick}** 👧",
      "Congrats {user} — your gf is **{pick}**",
    ]) },
  { name: "bf", emoji: "👦", description: "Get a random bf", kind: "relationship", optionalTarget: true,
    gif: { endpoints: ["blush","smile","wink"], queries: ["anime boyfriend","anime boy"] },
    special: "pickName", texts: T([
      "{user}'s new bf is **{pick}** 👦",
      "Congrats {user} — your bf is **{pick}**",
    ]) },
];

// ─── AI / FUN ──────────────────────────────────────────────────────────────────
const ANSWER: FunCmd[] = [
  { name: "ask", emoji: "🔮", description: "Ask anything", kind: "answer",
    gif: { endpoints: ["think","stare","smug"], queries: ["anime thinking","anime girl think"] },
    special: "askPick", texts: T([
      "{pick}",
    ]) },
  { name: "eightball", emoji: "🎱", description: "Ask the magic 8-ball", kind: "answer",
    gif: { endpoints: ["think","wink"], queries: ["anime 8 ball","anime fortune"] },
    special: "eightball", texts: T(["🎱 {pick}"]) },
  { name: "advice", emoji: "💡", description: "Get random advice", kind: "answer",
    gif: { endpoints: ["smile","think"], queries: ["anime wise","anime advice"] },
    special: "advice", texts: T(["💡 {pick}"]) },
  { name: "truth", emoji: "🧐", description: "Get a truth question", kind: "answer",
    gif: { endpoints: ["stare","blush"], queries: ["anime truth or dare"] },
    special: "truth", texts: T(["🧐 Truth: {pick}"]) },
  { name: "dare", emoji: "🔥", description: "Get a dare", kind: "answer",
    gif: { endpoints: ["smug","laugh"], queries: ["anime dare","anime mischief"] },
    special: "dare", texts: T(["🔥 Dare: {pick}"]) },
  { name: "confession", emoji: "📜", description: "Random confession", kind: "answer",
    gif: { endpoints: ["blush","cry"], queries: ["anime confession","anime blush"] },
    special: "confession", texts: T(["📜 {pick}"]) },
  { name: "pickup", emoji: "💌", description: "Get a pickup line", kind: "answer", optionalTarget: true,
    gif: { endpoints: ["wink","smug","blush"], queries: ["anime pickup line","anime wink"] },
    special: "pickup", texts: T(["💌 {target}, {pick}"]) },
  { name: "compliment", emoji: "🌟", description: "Compliment someone", kind: "answer", optionalTarget: true,
    gif: { endpoints: ["smile","blush","happy"], queries: ["anime compliment","anime smile"] },
    special: "compliment", texts: T(["🌟 {target}, {pick}"]) },
  { name: "chat", emoji: "💬", description: "Get a random chat line", kind: "answer",
    gif: { endpoints: ["smile","wave","happy"], queries: ["anime talking","anime wave"] },
    special: "chat", texts: T(["💬 {pick}"]) },
];

// ─── MEME ──────────────────────────────────────────────────────────────────────
const MEME: FunCmd[] = [
  { name: "meme", emoji: "📸", description: "Random meme", kind: "meme",
    gif: { endpoints: ["laugh","smug"], queries: ["anime meme","funny anime"] },
    texts: T(["📸 Certified meme moment", "When the meme just hits", "Meme delivered."]) },
  { name: "shitpost", emoji: "💩", description: "Random shitpost", kind: "meme",
    gif: { endpoints: ["cringe","laugh"], queries: ["anime shitpost","cursed anime"] },
    texts: T(["💩 shitpost incoming", "this is fine.", "posting this at 3am"]) },
  { name: "randomfact", emoji: "📚", description: "Random fact", kind: "meme",
    gif: { endpoints: ["think","smile"], queries: ["anime book","anime fact"] },
    special: "fact", texts: T(["📚 Fun fact: {pick}"]) },
  { name: "joke", emoji: "😂", description: "Tell a joke", kind: "meme",
    gif: { endpoints: ["laugh","happy"], queries: ["anime laugh","anime girl laugh"] },
    special: "joke", texts: T(["😂 {pick}"]) },
  { name: "darkjoke", emoji: "🦇", description: "Dark joke", kind: "meme",
    gif: { endpoints: ["smug","laugh"], queries: ["anime dark","anime smirk"] },
    special: "darkjoke", texts: T(["🦇 {pick}"]) },
  { name: "brainrot", emoji: "🧠", description: "Brainrot energy", kind: "meme",
    gif: { endpoints: ["cringe","facepalm"], queries: ["anime brainrot","cursed anime"] },
    special: "brainrot", texts: T(["🧠 {pick}"]) },
  { name: "quote", emoji: "📖", description: "Random anime quote", kind: "meme",
    gif: { endpoints: ["smile","stare"], queries: ["anime quote","anime aesthetic"] },
    special: "quote", texts: T(["📖 \"{pick}\""]) },
  { name: "copypasta", emoji: "🍝", description: "Random copypasta line", kind: "meme",
    gif: { endpoints: ["laugh","smug"], queries: ["anime copypasta"] },
    special: "copypasta", texts: T(["🍝 {pick}"]) },
  { name: "triggered", emoji: "💥", description: "Get triggered", kind: "meme", optionalTarget: true,
    gif: { endpoints: ["bully","kick","slap"], queries: ["anime triggered","anime angry"] },
    texts: T(["💥 {target} is triggered!", "RAGE MODE: {target}"]) },
  { name: "cringe", emoji: "😬", description: "Cringe at something", kind: "meme", optionalTarget: true,
    gif: { endpoints: ["cringe","facepalm"], queries: ["anime cringe","anime facepalm"] },
    texts: T(["😬 {target} is cringe", "{user} cringes at {target}"]) },
];

// ─── GAMES ─────────────────────────────────────────────────────────────────────
const GAMES: FunCmd[] = [
  { name: "coinflip", emoji: "🪙", description: "Flip a coin", kind: "game",
    gif: { endpoints: ["happy","smile"], queries: ["anime coin flip"] },
    special: "coinflip", texts: T(["🪙 {pick}"]) },
  { name: "dice", emoji: "🎲", description: "Roll a dice", kind: "game",
    gif: { endpoints: ["happy","smug"], queries: ["anime dice roll"] },
    special: "dice", texts: T(["🎲 You rolled a **{pick}**"]) },
  { name: "rps", emoji: "✊", description: "Play rock paper scissors", kind: "game",
    gif: { endpoints: ["happy","smug"], queries: ["anime rock paper scissors"] },
    special: "rps", texts: T(["✊ {pick}"]) },
  { name: "guess", emoji: "🔢", description: "Bot guesses 1–10", kind: "game",
    gif: { endpoints: ["think","smug"], queries: ["anime guess"] },
    special: "guess", texts: T(["🔢 {pick}"]) },
  { name: "fight", emoji: "⚔️", description: "Fight someone", kind: "game", needsTarget: true,
    gif: { endpoints: ["punch","kick","slap"], queries: ["anime fight","anime battle"] },
    special: "fight", texts: T(["⚔️ {pick}"]) },
  { name: "duel", emoji: "🗡️", description: "Duel someone", kind: "game", needsTarget: true,
    gif: { endpoints: ["punch","kick","slap"], queries: ["anime duel","anime sword fight"] },
    special: "fight", texts: T(["🗡️ {pick}"]) },
  { name: "gamble", emoji: "🎰", description: "Gamble your luck", kind: "game",
    gif: { endpoints: ["smug","laugh"], queries: ["anime casino","anime gambling"] },
    special: "gamble", texts: T(["🎰 {pick}"]) },
  { name: "slots", emoji: "🎰", description: "Spin the slots", kind: "game",
    gif: { endpoints: ["happy","smug"], queries: ["anime slots"] },
    special: "slots", texts: T(["🎰 {pick}"]) },
  { name: "trivia", emoji: "❓", description: "Random trivia question", kind: "game",
    gif: { endpoints: ["think","smile"], queries: ["anime trivia","anime quiz"] },
    special: "trivia", texts: T(["❓ {pick}"]) },
  { name: "clickspeed", emoji: "🖱️", description: "Random click speed", kind: "game",
    gif: { endpoints: ["happy","smug"], queries: ["anime click","anime gamer"] },
    special: "clickspeed", texts: T(["🖱️ {user}'s click speed: **{n} CPS**"]) },
];

// ─── LS CUSTOM ─────────────────────────────────────────────────────────────────
const LS: FunCmd[] = [
  { name: "raidcall", emoji: "📢", description: "Call a raid", kind: "ls",
    gif: { endpoints: ["happy","smug","wave"], queries: ["anime battle cry","anime warrior girl"] },
    texts: T([
      "📢 RAID CALL by {user} — get in voice!",
      "📢 {user}: Squad up! Raid is starting.",
      "📢 LS RAID: assemble! — {user}",
    ]) },
  { name: "teamup", emoji: "🤝", description: "Team up with someone", kind: "ls", needsTarget: true,
    gif: { endpoints: ["highfive","handhold","happy"], queries: ["anime teamwork","anime friends"] },
    texts: T([
      "🤝 {user} teamed up with {target}",
      "{user} and {target} are squadding up",
      "Duo locked: {user} × {target}",
    ]) },
  { name: "lstarget", emoji: "🎯", description: "Mark a target", kind: "ls", needsTarget: true,
    gif: { endpoints: ["smug","stare","shoot"], queries: ["anime target","anime sniper"] },
    texts: T([
      "🎯 Target locked: {target}",
      "{user} marks {target} for elimination",
      "🎯 {target} is now top priority",
    ]) },
  { name: "backup", emoji: "🛡️", description: "Call for backup", kind: "ls",
    gif: { endpoints: ["wave","happy"], queries: ["anime backup","anime soldier girl"] },
    texts: T([
      "🛡️ {user} is calling for backup!",
      "Need backup ASAP — {user}",
      "🛡️ Cover {user}, they're going in",
    ]) },
  { name: "clutch", emoji: "💯", description: "Clutch moment", kind: "ls", optionalTarget: true,
    gif: { endpoints: ["smug","happy"], queries: ["anime clutch","anime gaming win"] },
    texts: T([
      "💯 {target} just CLUTCHED IT",
      "Insane clutch by {target}",
      "{target} carried that round",
    ]) },
  { name: "rankme", emoji: "📊", description: "Rate your overall vibe", kind: "ls", optionalTarget: true,
    gif: { endpoints: ["smug","wink"], queries: ["anime rank","anime score"] },
    special: "rate100", texts: T(["📊 {target}'s overall score: **{n}/100**"]) },
  { name: "lsrate", emoji: "⭐", description: "Rate someone as an LS member", kind: "ls", optionalTarget: true,
    gif: { endpoints: ["smug","happy"], queries: ["anime rating"] },
    special: "rate100", texts: T(["⭐ {target}'s LS rating: **{n}/100**"]) },
  { name: "toxicmode", emoji: "☣️", description: "Toggle (fake) toxic mode", kind: "ls", optionalTarget: true,
    gif: { endpoints: ["smug","laugh"], queries: ["anime evil","anime smirk"] },
    texts: T([
      "☣️ Toxic mode: ENABLED for {target}",
      "{target} entered toxic mode 😈",
      "Warning: {target} is in full villain arc",
    ]) },
  { name: "warcry", emoji: "🔊", description: "Battle cry", kind: "ls",
    gif: { endpoints: ["happy","laugh"], queries: ["anime battle cry","anime shout"] },
    texts: T([
      "🔊 {user}: FOR LAST STAND!",
      "🔊 {user} unleashes a war cry!",
      "🔊 LSSS LET'S GOOO — {user}",
    ]) },
  { name: "laststand", emoji: "🏴", description: "Make your last stand", kind: "ls",
    gif: { endpoints: ["smug","punch","stare"], queries: ["anime last stand","anime hero pose"] },
    texts: T([
      "🏴 {user} makes their LAST STAND",
      "{user}: I won't go down without a fight",
      "🏴 The final stand of {user} begins",
    ]) },
];

// ─── BONUS ─────────────────────────────────────────────────────────────────────
const BONUS: FunCmd[] = [
  { name: "ego", emoji: "👑", description: "Rate ego level", kind: "bonus", optionalTarget: true,
    gif: { endpoints: ["smug","wink"], queries: ["anime ego","anime smug"] },
    special: "rate100", texts: T(["👑 {target}'s ego: **{n}/100**"]) },
  { name: "aura", emoji: "✨", description: "Check someone's aura", kind: "bonus", optionalTarget: true,
    gif: { endpoints: ["smug","happy"], queries: ["anime aura","anime glow"] },
    special: "auraNum", texts: T(["✨ {target}'s aura: **{pick}**"]) },
  { name: "drip", emoji: "💧", description: "Rate someone's drip", kind: "bonus", optionalTarget: true,
    gif: { endpoints: ["smug","wink"], queries: ["anime drip","anime cool"] },
    special: "rate100", texts: T(["💧 {target}'s drip: **{n}/100**"]) },
  { name: "npc", emoji: "🤖", description: "Call someone an NPC", kind: "bonus", optionalTarget: true,
    gif: { endpoints: ["facepalm","stare"], queries: ["anime npc","anime stare"] },
    texts: T([
      "🤖 {target} is just an NPC fr",
      "{target} runs on the same 3 lines of dialogue",
      "Confirmed NPC behavior: {target}",
    ]) },
  { name: "maincharacter", emoji: "🌟", description: "Main character moment", kind: "bonus", optionalTarget: true,
    gif: { endpoints: ["smug","happy"], queries: ["anime main character","anime hero"] },
    texts: T([
      "🌟 {target} is the main character",
      "Camera pans to {target}…",
      "{target} entered the chat → main character mode ON",
    ]) },
  { name: "villain", emoji: "😈", description: "Villain arc", kind: "bonus", optionalTarget: true,
    gif: { endpoints: ["smug","laugh"], queries: ["anime villain","anime evil girl"] },
    texts: T([
      "😈 {target} entered villain arc",
      "{target}'s villain origin story has begun",
      "Watch out — {target} is the antagonist now",
    ]) },
  { name: "glaze", emoji: "🍯", description: "Glaze someone", kind: "bonus", optionalTarget: true,
    gif: { endpoints: ["blush","smile","happy"], queries: ["anime praise","anime blush"] },
    texts: T([
      "🍯 {target} is literally THE GOAT",
      "{target} carries this server fr 🍯",
      "Bow down — {target} is on a different level",
    ]) },
  { name: "mid", emoji: "📉", description: "Call something mid", kind: "bonus", optionalTarget: true,
    gif: { endpoints: ["facepalm","smug"], queries: ["anime mid","anime meh"] },
    texts: T([
      "📉 {target} is so mid",
      "{target} = mid energy",
      "Forgettable. {target} is mid.",
    ]) },
  { name: "peak", emoji: "🗻", description: "Call something peak", kind: "bonus", optionalTarget: true,
    gif: { endpoints: ["happy","smile"], queries: ["anime peak","anime wow"] },
    texts: T([
      "🗻 {target} is peak fiction",
      "Absolute peak: {target}",
      "{target} is the definition of peak",
    ]) },
  { name: "fallen", emoji: "🍂", description: "You fell off", kind: "bonus", optionalTarget: true,
    gif: { endpoints: ["facepalm","cry"], queries: ["anime fall","anime sad"] },
    texts: T([
      "🍂 {target} has fallen off",
      "It's over for {target}",
      "{target}'s prime is behind them",
    ]) },
];

export const ALL_FUN_COMMANDS: FunCmd[] = [
  ...SOCIAL, ...TROLL, ...RELATIONSHIP, ...ANSWER,
  ...MEME, ...GAMES, ...LS, ...BONUS,
];

// ─── Special data tables ──────────────────────────────────────────────────────
export const SPECIAL_LISTS = {
  eightball: [
    "Yes, definitely.","Without a doubt.","Most likely.","Outlook good.","Yes.",
    "Reply hazy, try again.","Ask again later.","Cannot predict now.","Don't count on it.",
    "My reply is no.","Very doubtful.","Outlook not so good.","Concentrate and ask again.",
  ],
  advice: [
    "Drink water. Right now.","Touch grass for 10 minutes a day.","Stop overthinking it.",
    "Save before you spend.","Sleep is more important than that one extra game.",
    "If it costs your peace, it's too expensive.","Reply to your mom.","Stretch.",
    "Backup your data.","Block them. Move on.",
  ],
  truth: [
    "What's the cringiest message you've ever sent?","Last person you stalked on Instagram?",
    "Biggest lie you've told in this server?","Who's your secret crush?",
    "Last embarrassing thing you did in voice?","Have you ever rage quit and lied about wifi?",
    "Who in this server would you simp for?","What's a secret no one here knows about you?",
  ],
  dare: [
    "Change your name to 'sussy baka' for 1 hour.","DM the last person you texted 'do you miss me?'",
    "Send a screenshot of your last YouTube video to chat.","Use only emojis for the next 5 messages.",
    "Speak only in third person in voice for 5 minutes.","Compliment 3 random people in this server.",
    "Post a selfie pretending to be sad.","Type with your eyes closed for 1 message.",
  ],
  confession: [
    "I check my phone even when I know there's nothing.","I rage quit and blamed lag.",
    "I muted that one friend.","I read your message and forgot to reply on purpose.",
    "I've used 'lol' without laughing 1000 times.","I pretend to lag when I die.",
  ],
  pickup: [
    "are you a Discord ping? because you got my full attention.",
    "if you were a server, I'd boost you to level 3.",
    "are you Wi-Fi? because I'm feeling a connection.",
    "are you 5GB of mobile data? because I can't lose you.",
    "are you my Discord notification? because you light up my day.",
  ],
  compliment: [
    "you're the reason vc is alive.","your aura is unmatched today.",
    "your gameplay is actually clean.","you make this server better just by being here.",
    "you're built different.","your vibes carry the squad.",
  ],
  chat: [
    "anyone wanna queue?","vc when?","ngl this server is peak rn",
    "who's grinding tonight?","raid stories — go.","unpopular opinion: drop one",
  ],
  fact: [
    "Honey never spoils.","Octopuses have three hearts.","Bananas are berries; strawberries aren't.",
    "Sharks existed before trees.","A day on Venus is longer than its year.",
    "Wombat poop is cube-shaped.","Sea otters hold hands while sleeping.",
  ],
  joke: [
    "Why did the gamer bring string to the raid? To tie up loose ends.",
    "I told my Wi-Fi a secret. Now everyone knows.",
    "Why don't programmers like nature? Too many bugs.",
    "My bot has trust issues. It only takes verified inputs.",
    "I would tell you a UDP joke but you might not get it.",
  ],
  darkjoke: [
    "I bought my friend an elephant for his room. He said thanks. I said don't mention it.",
    "I have a stepladder. Never knew my real ladder.",
    "My playlist is so dark even Spotify recommends therapy.",
    "I asked the librarian for a book on paranoia. She whispered, 'It's right behind you.'",
  ],
  brainrot: [
    "skibidi rizz cap aura ohio gyatt — confirmed brainrot.",
    "I fanum-taxed your XP, let him cook.",
    "Erm what the sigma — that was straight up Ohio behavior.",
    "Bro is NOT the GOAT, bro is the 🐐… no wait, that's the same thing.",
  ],
  quote: [
    "The world isn't perfect. But it's there for us, doing the best it can.",
    "Whatever you lose, you'll find it again. But what you throw away you'll never get back.",
    "Power comes in response to a need, not a desire.",
    "If you don't take risks, you can't create a future.",
  ],
  copypasta: [
    "I have studied the blade for 10 years and you're telling me to *touch grass*?",
    "This is not a joke. I am genuinely concerned about your skill issue.",
    "Average gamer vs Average raid enjoyer — there is no comparison.",
    "Bro really thought he was him. He is not him.",
  ],
  fight: [
    "{user} hits {target} for 999 dmg — KO!",
    "{target} dodged but {user} crit anyway — GG.",
    "{user} and {target} traded blows — {user} wins by 1 HP.",
    "{target} ran out of mana. {user} wins.",
    "{user} clutched the 1v1 vs {target}.",
  ],
  rps: [
    "Bot played 🪨 — you lose.","Bot played 📄 — you win!","Bot played ✂️ — draw.",
    "Bot played 🪨 — draw.","Bot played 📄 — you lose.","Bot played ✂️ — you win!",
  ],
  gamble: [
    "You won 250 coins!","You lost everything 💀","Jackpot! +1000",
    "House wins. -100","You broke even, somehow.","Lucky! +500",
  ],
  trivia: [
    "Q: What's the chemical symbol for gold? — A: Au",
    "Q: How many hearts does an octopus have? — A: 3",
    "Q: What year was Discord released? — A: 2015",
    "Q: Largest planet in the solar system? — A: Jupiter",
  ],
  gfNames: [
    "Hatsune Miku","Asuna","Rem","Zero Two","Marin Kitagawa","Yor Forger","Mai Sakurajima","Nezuko","Megumin","Anya",
  ],
  bfNames: [
    "Levi","Gojo","Itadori","Bakugo","Tanjiro","Eren","Loid Forger","Light","Roronoa Zoro","Sukuna",
  ],
  aura: [
    "+1000 ✨","+500","-100 (skill issue)","-9999 (NPC aura)","INFINITE 🌌","mid","peak","sigma 🗿","rizzler","fallen 🍂",
  ],
  askPick: [
    "Yes — go for it.","No, don't.","100% certified.","Outlook unclear, try again.",
    "Bro, ask your group chat.","The stars say yes.","Definitely not today.",
  ],
};
