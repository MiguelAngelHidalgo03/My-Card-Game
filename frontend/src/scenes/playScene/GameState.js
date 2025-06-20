// src/scenes/PlayScene/GameState.js

export default class GameState {
  constructor({ players, hands, drawPile, discardPile, turnIndex = 0, currentPlayerId, chosenColor, lastColorChooser, pendingPenalty }) {
    this.players = players;
    this.hands = hands;        // { username1: [...], username2: [...] }
    this.drawPile = drawPile;     // array de cartas
    this.discardPile = discardPile;  // array, con 1 carta al inicio
    this.turnIndex = turnIndex;
    this.currentPlayerId = currentPlayerId;
    this.chosenColor = chosenColor || null;
    this.lastColorChooser = lastColorChooser || null;
    this.pendingPenalty = pendingPenalty || null;
    // console.log('[GameState] Construido con currentPlayerId:', currentPlayerId);
  }

  // Factory que podrías usar en el cliente tras recibir payload:
  static fromServerPayload(payload = {}) {
    if (!payload || typeof payload !== 'object') {
      console.warn('[GameState.fromServerPayload] Payload vacío o inválido:', payload);
      return new GameState({});
    }
    return new GameState({
      players: payload.players || [],
      hands: payload.hands || {},
      drawPile: payload.drawPile || [],
      discardPile: payload.discardPile || [],
      turnIndex: payload.turnIndex ?? 0,
      currentPlayerId: payload.currentPlayerId ?? null,
      chosenColor: payload.chosenColor ?? null,
      lastColorChooser: payload.lastColorChooser ?? null,
      pendingPenalty: payload.pendingPenalty ?? null
    });
  }

  // get localHand()   { return this.hands[this.players[0].username]; }
  // get remoteHand()  { return this.hands[this.players[1].username]; }
  get localHand() {
    return this.hands?.[this.players[0]?.playerId] || [];
  }
  get remoteHand() {
    return this.hands?.[this.players[1]?.playerId] || [];
  }
  get topDiscard() { return this.discardPile[this.discardPile.length - 1]; }

  playCard(username, cardIndex) {
    // Busca el playerId correspondiente al username
    const player = this.players.find(p => p.username === username);
    if (!player) throw new Error(`No player found for username: ${username}`);
    const playerId = player.playerId;

    const hand = this.hands[playerId];
    const [card] = hand.splice(cardIndex, 1);
    this.discardPile.push(card);
    this.turnIndex = 1 - this.turnIndex;
    return card;
  }

  drawCard(username, cardFrame) {
    const player = this.players.find(p => p.username === username);
    if (!player) throw new Error(`No player found for username: ${username}`);
    const playerId = player.playerId;

    // Si el backend te pasa el frame, busca la carta en el mazo por frame
    let card;
    if (cardFrame) {
      card = this.drawPile.find(c => c.frame === cardFrame) || { frame: cardFrame };
    } else {
      card = this.drawPile.shift();
    }
    this.hands[playerId].push(card);
    return card;
  }

  // Opcional: para la UI
  isCardPlayable(card, topDiscard) {
    // console.log('[isCardPlayable] card:', card, 'topDiscard:', topDiscard, 'chosenColor:', this.chosenColor);
    const c = this.parseCardFrame(card.frame);
    const t = this.parseCardFrame(topDiscard.frame);

    if (c.type === 'wild' || c.type === '+4') return true;

    let topColor = t.color;
    if ((t.type === 'wild' || t.type === '+4') && this.chosenColor) {
      topColor = this.chosenColor;
    }
    // Normaliza a minúsculas
    const cardColor = (c.color || '').toLowerCase();
    const compareColor = (topColor || '').toLowerCase();

    return cardColor === compareColor || c.value === t.value;
  }
  hasPlayableCard(hand, topDiscard) {
    return hand.some(card => this.isCardPlayable(card, topDiscard));
  }
  isLocalTurn(localPlayerId) {
    return this.currentPlayerId === localPlayerId;
  }


  parseCardFrame(frame) {
    if (frame === 'cambia_color.svg') return { type: 'wild' };
    if (frame === 'mas4.svg') return { type: '+4' };
    const match = frame.match(/^([A-Za-z]+)_([A-Za-z0-9]+)\.svg$/);
    if (match) {
      const color = match[1];
      const value = match[2];
      if (value === 'mas2') return { color, type: '+2', value };
      if (value === 'Bloqueo' || value === 'Skip') return { color, type: 'skip', value };
      return { color, value };
    }
    return {};
  }
}
