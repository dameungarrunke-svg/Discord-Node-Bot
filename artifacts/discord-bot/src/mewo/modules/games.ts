import type { Message } from "discord.js";
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from "discord.js";

type Handler = (msg: Message, args: string[]) => Promise<void>;

function err(text: string): EmbedBuilder {
  return new EmbedBuilder().setColor(0xED4245).setDescription(`❌ ${text}`);
}

// ─── ROCK PAPER SCISSORS ─────────────────────────────────────────────────────

const RPS_CHOICES = ["🪨 Rock", "📄 Paper", "✂️ Scissors"];

export const cmdRps: Handler = async (msg) => {
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId("rps_0").setLabel("Rock").setStyle(ButtonStyle.Secondary).setEmoji("🪨"),
    new ButtonBuilder().setCustomId("rps_1").setLabel("Paper").setStyle(ButtonStyle.Secondary).setEmoji("📄"),
    new ButtonBuilder().setCustomId("rps_2").setLabel("Scissors").setStyle(ButtonStyle.Secondary).setEmoji("✂️"),
  );
  const sent = await msg.reply({
    embeds: [new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle("Rock Paper Scissors")
      .setDescription("Choose your move! You have **30 seconds**.")
      .setFooter({ text: "mewo • games • vs bot" })
    ],
    components: [row],
  });
  try {
    const btn = await sent.awaitMessageComponent({
      componentType: ComponentType.Button,
      filter: i => i.user.id === msg.author.id && i.customId.startsWith("rps_"),
      time: 30_000,
    });
    const playerIdx = parseInt(btn.customId.split("_")[1]);
    const botIdx = Math.floor(Math.random() * 3);
    const outcome = (playerIdx - botIdx + 3) % 3;
    const result = outcome === 1 ? "You win! 🎉" : outcome === 2 ? "Bot wins! 🤖" : "It's a tie! 🤝";
    const color = outcome === 1 ? 0x57F287 : outcome === 2 ? 0xED4245 : 0xFEE75C;
    await btn.update({
      embeds: [new EmbedBuilder()
        .setColor(color)
        .setTitle("Rock Paper Scissors")
        .addFields(
          { name: "You", value: RPS_CHOICES[playerIdx], inline: true },
          { name: "Bot", value: RPS_CHOICES[botIdx], inline: true },
          { name: "Result", value: result, inline: false }
        )
        .setFooter({ text: "mewo • games" })
      ],
      components: [],
    });
  } catch {
    await sent.edit({
      embeds: [new EmbedBuilder().setColor(0xED4245).setTitle("Rock Paper Scissors").setDescription("You didn't choose in time!").setFooter({ text: "mewo • games" })],
      components: [],
    });
  }
};

// ─── COOKIE CLICKER ───────────────────────────────────────────────────────────

export const cmdCookie: Handler = async (msg) => {
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId("cookie_grab").setLabel("Grab the Cookie!").setStyle(ButtonStyle.Success).setEmoji("🍪"),
  );
  const sent = await msg.reply({
    embeds: [new EmbedBuilder()
      .setColor(0xFEE75C)
      .setTitle("🍪 A cookie appeared!")
      .setDescription("First one to click grabs the cookie!")
      .setFooter({ text: "mewo • games • 30 seconds" })
    ],
    components: [row],
  });
  try {
    const btn = await sent.awaitMessageComponent({
      componentType: ComponentType.Button,
      filter: i => i.customId === "cookie_grab",
      time: 30_000,
    });
    await btn.update({
      embeds: [new EmbedBuilder()
        .setColor(0x57F287)
        .setTitle("🍪 Cookie Grabbed!")
        .setDescription(`**${btn.user.username}** grabbed the cookie!`)
        .setFooter({ text: "mewo • games" })
      ],
      components: [],
    });
  } catch {
    await sent.edit({
      embeds: [new EmbedBuilder()
        .setColor(0xED4245)
        .setTitle("🍪 Cookie Expired!")
        .setDescription("Nobody grabbed the cookie in time!")
        .setFooter({ text: "mewo • games" })
      ],
      components: [],
    });
  }
};

// ─── TIC TAC TOE ─────────────────────────────────────────────────────────────

const TTT_WINS = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];

function checkWin(board: string[], p: string): boolean {
  return TTT_WINS.some(([a, b, c]) => board[a] === p && board[b] === p && board[c] === p);
}

function buildTTTRows(board: string[], gameId: string, disabled: boolean): ActionRowBuilder<ButtonBuilder>[] {
  const rows: ActionRowBuilder<ButtonBuilder>[] = [];
  for (let r = 0; r < 3; r++) {
    const row = new ActionRowBuilder<ButtonBuilder>();
    for (let c = 0; c < 3; c++) {
      const idx = r * 3 + c;
      const cell = board[idx];
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`ttt_${gameId}_${idx}`)
          .setLabel(cell === " " ? "\u200B" : cell)
          .setEmoji(cell === "X" ? "❌" : cell === "O" ? "⭕" : "⬛")
          .setStyle(cell === "X" ? ButtonStyle.Danger : cell === "O" ? ButtonStyle.Primary : ButtonStyle.Secondary)
          .setDisabled(disabled || cell !== " ")
      );
    }
    rows.push(row);
  }
  return rows;
}

export const cmdTictactoe: Handler = async (msg, args) => {
  const opponent = msg.mentions.users.first();
  if (!opponent || opponent.bot) {
    await msg.reply({ embeds: [err("Mention a user to play against. Usage: `mewo games tictactoe @user`")] });
    return;
  }
  if (opponent.id === msg.author.id) {
    await msg.reply({ embeds: [err("You can't play against yourself.")] });
    return;
  }
  const gameId = Date.now().toString(36);
  const board: string[] = Array(9).fill(" ");
  const players: Record<"X" | "O", { id: string; username: string }> = {
    X: { id: msg.author.id, username: msg.author.username },
    O: { id: opponent.id, username: opponent.username },
  };
  let turn: "X" | "O" = "X";

  const buildEmbed = () => new EmbedBuilder()
    .setColor(turn === "X" ? 0xED4245 : 0x5865F2)
    .setTitle("Tic Tac Toe")
    .setDescription(`**${players[turn].username}'s turn** (${turn === "X" ? "❌" : "⭕"})`)
    .addFields(
      { name: "❌", value: players.X.username, inline: true },
      { name: "⭕", value: players.O.username, inline: true }
    )
    .setFooter({ text: "mewo • games • 60s per turn" });

  const sent = await msg.reply({ embeds: [buildEmbed()], components: buildTTTRows(board, gameId, false) });

  const collector = sent.createMessageComponentCollector({
    componentType: ComponentType.Button,
    filter: i => i.customId.startsWith(`ttt_${gameId}_`) && (i.user.id === players.X.id || i.user.id === players.O.id),
    time: 300_000,
  });

  collector.on("collect", async (btn) => {
    if (btn.user.id !== players[turn].id) {
      await btn.reply({ content: "It's not your turn!", ephemeral: true });
      return;
    }
    const pos = parseInt(btn.customId.split("_")[2]);
    board[pos] = turn;

    if (checkWin(board, turn)) {
      collector.stop("win");
      await btn.update({
        embeds: [new EmbedBuilder()
          .setColor(turn === "X" ? 0xED4245 : 0x5865F2)
          .setTitle("Tic Tac Toe")
          .setDescription(`**${players[turn].username} wins!** (${turn === "X" ? "❌" : "⭕"})`)
          .setFooter({ text: "mewo • games" })
        ],
        components: buildTTTRows(board, gameId, true),
      });
      return;
    }
    if (!board.includes(" ")) {
      collector.stop("draw");
      await btn.update({
        embeds: [new EmbedBuilder()
          .setColor(0xFEE75C)
          .setTitle("Tic Tac Toe — Draw!")
          .setDescription("It's a tie! No moves left.")
          .setFooter({ text: "mewo • games" })
        ],
        components: buildTTTRows(board, gameId, true),
      });
      return;
    }
    turn = turn === "X" ? "O" : "X";
    await btn.update({ embeds: [buildEmbed()], components: buildTTTRows(board, gameId, false) });
  });

  collector.on("end", async (_, reason) => {
    if (reason === "win" || reason === "draw") return;
    await sent.edit({
      embeds: [new EmbedBuilder()
        .setColor(0xED4245)
        .setTitle("Tic Tac Toe — Timed Out")
        .setDescription(`Game ended — **${players[turn].username}** took too long!`)
        .setFooter({ text: "mewo • games" })
      ],
      components: buildTTTRows(board, gameId, true),
    }).catch(() => {});
  });
};

// ─── BLACKJACK ────────────────────────────────────────────────────────────────

const SUITS = ["♠️", "♥️", "♦️", "♣️"];
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

function newDeck(): string[] {
  const deck: string[] = [];
  for (const s of SUITS) for (const r of RANKS) deck.push(`${r}${s}`);
  return deck.sort(() => Math.random() - 0.5);
}

function cardVal(card: string): number {
  const r = card.replace(/[♠️♥️♦️♣️]/g, "").trim();
  if (r === "A") return 11;
  if (["J", "Q", "K"].includes(r)) return 10;
  return parseInt(r);
}

function handTotal(hand: string[]): number {
  let total = hand.reduce((s, c) => s + cardVal(c), 0);
  let aces = hand.filter(c => c.startsWith("A")).length;
  while (total > 21 && aces-- > 0) total -= 10;
  return total;
}

function handStr(hand: string[], hideSecond = false): string {
  if (hideSecond && hand.length >= 2) return `${hand[0]} 🂠`;
  return hand.join("  ");
}

export const cmdBlackjack: Handler = async (msg) => {
  const deck = newDeck();
  const player = [deck.pop()!, deck.pop()!];
  const dealer = [deck.pop()!, deck.pop()!];

  const hitBtn = new ButtonBuilder().setCustomId("bj_hit").setLabel("Hit").setStyle(ButtonStyle.Primary);
  const standBtn = new ButtonBuilder().setCustomId("bj_stand").setLabel("Stand").setStyle(ButtonStyle.Danger);
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(hitBtn, standBtn);

  const buildEmbed = (showDealer = false, status?: string, color = 0x5865F2) =>
    new EmbedBuilder()
      .setColor(color)
      .setTitle("Blackjack")
      .addFields(
        { name: `Your Hand (${handTotal(player)})`, value: handStr(player), inline: false },
        {
          name: showDealer ? `Dealer Hand (${handTotal(dealer)})` : "Dealer Hand",
          value: handStr(dealer, !showDealer),
          inline: false,
        }
      )
      .setDescription(status ?? "**Hit** to draw a card, **Stand** to hold.")
      .setFooter({ text: "mewo • games • 60s to respond" });

  if (handTotal(player) === 21) {
    await msg.reply({
      embeds: [buildEmbed(true, "**Blackjack! You win!** 🃏", 0x57F287)],
      components: [],
    });
    return;
  }

  const sent = await msg.reply({ embeds: [buildEmbed()], components: [row] });

  let gameOver = false;
  while (!gameOver) {
    let btn;
    try {
      btn = await sent.awaitMessageComponent({
        componentType: ComponentType.Button,
        filter: i => i.user.id === msg.author.id && (i.customId === "bj_hit" || i.customId === "bj_stand"),
        time: 60_000,
      });
    } catch {
      await sent.edit({ components: [] });
      return;
    }

    if (btn.customId === "bj_hit") {
      player.push(deck.pop()!);
      const pv = handTotal(player);
      if (pv > 21) {
        await btn.update({
          embeds: [buildEmbed(true, `**Bust! You got ${pv}. Dealer wins.** 💥`, 0xED4245)],
          components: [],
        });
        return;
      }
      if (pv === 21) {
        await btn.update({ embeds: [buildEmbed()], components: [] });
        gameOver = true;
      } else {
        await btn.update({ embeds: [buildEmbed()], components: [row] });
      }
    } else {
      await btn.update({ embeds: [buildEmbed()], components: [] });
      gameOver = true;
    }
  }

  while (handTotal(dealer) < 17) dealer.push(deck.pop()!);
  const pv = handTotal(player);
  const dv = handTotal(dealer);
  let result: string;
  let color: number;
  if (dv > 21 || pv > dv) { result = `**You win!** Your ${pv} beats dealer's ${dv}. 🎉`; color = 0x57F287; }
  else if (pv === dv) { result = `**Push!** Both have ${pv}. 🤝`; color = 0xFEE75C; }
  else { result = `**Dealer wins!** ${dv} beats your ${pv}. 🤖`; color = 0xED4245; }

  await sent.edit({
    embeds: [buildEmbed(true, result, color)],
    components: [],
  });
};

// ─── SNAKE (coming soon) ─────────────────────────────────────────────────────

export const cmdSnake: Handler = async (msg) => {
  await msg.reply({
    embeds: [new EmbedBuilder()
      .setColor(0x57F287)
      .setTitle("Snake")
      .setDescription("Interactive snake game is coming soon!\n\nThis will be a real-time button-controlled snake on a grid.")
      .setFooter({ text: "mewo • games • coming soon" })
    ],
  });
};
