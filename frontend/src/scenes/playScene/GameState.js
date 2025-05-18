// src/scenes/PlayScene/GameState.js

export default class GameState {
  constructor({ players, hands, drawPile, discardPile, turnIndex = 0 }) {
    this.players     = players;
    this.hands       = hands;        // { username1: [...], username2: [...] }
    this.drawPile    = drawPile;     // array de cartas
    this.discardPile = discardPile;  // array, con 1 carta al inicio
    this.turnIndex   = turnIndex;    // 0 = players[0], 1 = players[1]
  }

  // Factory que podrías usar en el cliente tras recibir payload:
  static fromServerPayload(payload) {
    return new GameState({
      players:     payload.players,
      hands:       payload.hands,
      drawPile:    payload.drawPile,
      discardPile: payload.discardPile,
      turnIndex:   payload.turnIndex
    });
  }

  get localHand()   { return this.hands[this.players[0].username]; }
  get remoteHand()  { return this.hands[this.players[1].username]; }
  get topDiscard()  { return this.discardPile[this.discardPile.length - 1]; }

  playCard(username, cardIndex) {
    const hand = this.hands[username];
    const [card] = hand.splice(cardIndex, 1);
    this.discardPile.push(card);
    this.turnIndex = 1 - this.turnIndex;
    return card;
  }

  drawCard(username) {
    const card = this.drawPile.shift();
    this.hands[username].push(card);
    this.turnIndex = 1 - this.turnIndex;
    return card;
  }

  isLocalTurn() {
    return this.turnIndex === 0;
  }
}
