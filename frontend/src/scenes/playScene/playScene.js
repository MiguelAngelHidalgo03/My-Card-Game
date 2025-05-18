import Phaser from 'phaser';
import socket from '../../utils/sockets';

import GameState from './GameState.js';
import registerSocketHandlers from './SocketHandlers.js';
import mountDebugGUI from './DebugGUI.js';

export default class PlayScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PlayScene' });
  }

  init(data) {
    // Estado de partida recibido desde el servidor o GameCanvas
    this.code = data.code;
    this.gameSettings = data.gameSettings;
    this.allPlayers = data.players || [];
    this.userId = data.userId;
    this.clientId = data.clientId;
    this.username = data.username;
    this.avatar = data.avatar;
    this.isHost = data.isHost;
    this.mySocketId = data.mySocketId;
    this.debugMode = data.debugMode === true;

    // Datos del mazo y manos sincronizados
    this.drawPile = data.drawPile;
    this.discardPile = data.discardPile;
    this.hands = data.hands;
    this.turnIndex = data.turnIndex;

    // Identificar jugador local y remoto
    this.localPlayer = this.allPlayers.find(p =>
      (this.userId && p.userId === this.userId) ||
      (!this.userId && p.clientId === this.clientId)
    );
    this.remotePlayer = this.allPlayers.find(p => p !== this.localPlayer);
  }

  preload() {
  // Si ya existe en cache, no lo recargamos
  if (!this.textures.exists('cards')) {
    this.load.multiatlas(
      'cards',
      '/assests/cards/card.json',
      '/assests/cards/'
    );
  }
}
  create() {
    if (!this.localPlayer || !this.remotePlayer) {
      console.error('[PlayScene] falta jugador');
      return;
    }

    // ── Debug params ─────────────────────────────────────────────────
    this.debug = {
      bgColor: 0x000000,
      cardY: this.scale.height - 150,
      spacing: 0,
      cardScale: 0.3,
      cardTint: 0xffffff,
      rivalY: 100,
      rivalSpacing: 0,
      rivalScale: 0.2,
      rivalTint: 0xdddddd,
      discardX: this.scale.width / 2,
      discardY: this.scale.height / 2,
      discardScale: 0.3,
      discardTint: 0xffffff,
      drawX: 335.872,
      drawY: this.scale.height / 2,
      drawScale: 0.25,
      drawTint: 0xffffff,
      surrenderX: this.scale.width - 120,
      surrenderY: this.scale.height / 2,
      surrenderFontSize: 18,
      surrenderPaddingX: 10,
      surrenderPaddingY: 5
    };

    // ── Transformar manos de playerId a username ────────────────────────
    const handsByUsername = {};
    this.allPlayers.forEach(player => {
      const pid = player.playerId;
      const userHand = this.hands[pid] || [];
      handsByUsername[player.username] = userHand;
    });

    // ── Estado de juego sincronizado ───────────────────────────────────
    this.gameState = GameState.fromServerPayload({
      // Pasamos jugadores en orden local → remoto
      players: [this.localPlayer, this.remotePlayer],
      hands: handsByUsername,
      drawPile: this.drawPile,
      discardPile: this.discardPile,
      turnIndex: this.turnIndex
    });

    // ── Construcción del tablero ──────────────────────────────────────
    this.createBoard();
    this.updateHandsAndLayout();

    // ── Manejadores de Socket.IO ─────────────────────────────────────
    registerSocketHandlers(this, this.gameState);

    // ── Debug GUI ─────────────────────────────────────────────────────
    if (this.debugMode) {
      this.gui = mountDebugGUI(this, this.debug, this.applyLayout.bind(this));
    }

    // ── Limpieza al cerrar ─────────────────────────────────────────────
    this.events.once('shutdown', this.shutdown, this);
  }

  createBoard() {
    // Textos de jugadores
    this.add.text(this.scale.width / 2, 20, `Rival: ${this.remotePlayer.username}`, { fontSize: '24px', color: '#fff' })
      .setOrigin(0.5);
    this.add.text(this.scale.width / 2, this.scale.height - 20, `Tú: ${this.localPlayer.username}`, { fontSize: '24px', color: '#fff' })
      .setOrigin(0.5);

    // Carta de descarte
    this.discard = this.add.image(0, 0, 'cards', this.gameState.topDiscard.frame)
      .setOrigin(0.5)
      .setTint(this.debug.discardTint);

    // Mazo de robo
    this.drawPile = this.add.image(0, 0, 'cards', 'Reverso_Carta.svg')
      .setOrigin(0.5)
      .setTint(this.debug.drawTint)
      .setInteractive({ cursor: 'pointer' })
      .on('pointerup', () => this.handleDrawCard());

    // Botón rendirse
    this.surrenderBtn = this.add.text(this.debug.surrenderX, this.debug.surrenderY, 'Rendirse', {
      fontSize: `${this.debug.surrenderFontSize}px`,
      backgroundColor: '#f00',
      padding: { x: this.debug.surrenderPaddingX, y: this.debug.surrenderPaddingY },
      color: '#fff'
    })
      .setOrigin(0.5)
      .setInteractive({ cursor: 'pointer' })
      .on('pointerup', () => {
        socket.emit('end-game', {
          code: this.code,
          winnerPlayerId: this.remotePlayer.playerId
        });
      });
  }

  updateHandsAndLayout() {
    // Destruir sprites previos
    (this.cardSprites || []).forEach(s => s.destroy());
    (this.rivalSprites || []).forEach(s => s.destroy());
    this.cardSprites = [];
    this.rivalSprites = [];

    // Mano local
    this.gameState.localHand.forEach((card, idx) => {
      const img = this.add.image(0, 0, 'cards', card.frame)
        .setOrigin(0.5)
        .setTint(this.debug.cardTint)
        .setInteractive({ cursor: 'pointer' })
        .on('pointerup', () => this.handlePlayCard(card, idx));
      this.cardSprites.push(img);
    });

    // Mano rival (mostrar reverso)
    this.gameState.remoteHand.forEach(() => {
      const img = this.add.image(0, 0, 'cards', 'Reverso_Carta.svg')
        .setOrigin(0.5)
        .setTint(this.debug.rivalTint);
      this.rivalSprites.push(img);
    });

    // Actualizar carta de descarte
    this.discard.setTexture('cards', this.gameState.topDiscard.frame);

    this.applyLayout();
  }

  applyLayout() {
    this.cameras.main.setBackgroundColor(this.debug.bgColor);

    // Distribución mano local
    if (this.cardSprites.length) {
      const CW = this.cardSprites[0].width * this.debug.cardScale;
      const CH = this.cardSprites[0].height * this.debug.cardScale;
      const totalW = this.cardSprites.length * CW + (this.cardSprites.length - 1) * this.debug.spacing;
      const startX = (this.scale.width - totalW) / 2 + CW / 2;
      this.cardSprites.forEach((s, i) =>
        s.setDisplaySize(CW, CH).setPosition(startX + i * (CW + this.debug.spacing), this.debug.cardY)
      );
    }

    // Distribución mano rival
    if (this.rivalSprites.length) {
      const rW = this.rivalSprites[0].width * this.debug.rivalScale;
      const rH = this.rivalSprites[0].height * this.debug.rivalScale;
      const totalRW = this.rivalSprites.length * rW + (this.rivalSprites.length - 1) * this.debug.rivalSpacing;
      const rStartX = (this.scale.width - totalRW) / 2 + rW / 2;
      this.rivalSprites.forEach((s, i) =>
        s.setDisplaySize(rW, rH).setPosition(rStartX + i * (rW + this.debug.rivalSpacing), this.debug.rivalY)
      );
    }

    // Posicionar descarte y mazo
    this.discard
      .setDisplaySize(this.discard.width * this.debug.discardScale, this.discard.height * this.debug.discardScale)
      .setPosition(this.debug.discardX, this.debug.discardY);

    this.drawPile
      .setDisplaySize(this.drawPile.width * this.debug.drawScale, this.drawPile.height * this.debug.drawScale)
      .setPosition(this.debug.drawX, this.debug.drawY);
  }

  handlePlayCard(card, idx) {
    if (!this.gameState.isLocalTurn()) return;
    const played = this.gameState.playCard(this.localPlayer.username, idx);
    socket.emit('card-played', { by: this.localPlayer.username, cardFrame: played.frame });
    this.updateHandsAndLayout();
  }

  handleDrawCard() {
    if (!this.gameState.isLocalTurn()) return;
    const drawn = this.gameState.drawCard(this.localPlayer.username);
    socket.emit('card-drawn', { by: this.localPlayer.username, cardFrame: drawn.frame });
    this.updateHandsAndLayout();
  }

  shutdown() {
    socket.removeAllListeners('reconnected');
    socket.removeAllListeners('player-joined');
    socket.removeAllListeners('game-ended');
    if (this.gui) this.gui.destroy();
  }
}