// src/scenes/WinScene.js
import Phaser from 'phaser';
import socket from '../utils/sockets';

const PALETTE = {
  winner:  0xD2F562,
  loser:   0x11A4A2,
  text:    '#fff',
  bg:      0x000000,
  shadow:  0x333333,
  gold:    0xffd700,
  confetti: [0xD2F562, 0xF5A267, 0x11A4A2, 0xC868F5, 0xffffff, 0xffe066],
};

export default class WinScene extends Phaser.Scene {
  constructor() {
    super({ key: 'WinScene' });
    this.withScenePlayers = [];
  }

  init(data) {
    this.winnerName   = data.winnerName;
    this.code         = data.code;
    this.players      = data.players || [];
    this.gameSettings = data.gameSettings;
    this.mySocketId   = data.mySocketId;
  }

  preload() {
    if (this.players) {
      this.players.forEach(p => {
        if (p.avatar && !this.textures.exists('avatar-' + p.playerId)) {
          this.load.image('avatar-' + p.playerId, p.avatar, { crossOrigin: 'anonymous' });
        }
      });
    }
  }

  create() {
    const { width, height } = this.scale;
    socket.emit('set-where', this.code, 'withscene');

   this.gameStartedListener = (payload) => {
  this.scene.start('LoadingScene', {
    ...payload,
    mySocketId: this.mySocketId,
    debugMode: this.sys.game.config.physics.arcade?.debug || false,
    isMobile: window.innerWidth < 1024 || navigator.maxTouchPoints > 0
  });
};
    socket.on('game-started', this.gameStartedListener);

    this.events.once('shutdown', () => {
      socket.off('game-started', this.gameStartedListener);
      socket.off('players-list', this.playersListListener);
      socket.emit('set-where', this.code, 'lobby');
    });

    this.bgRect = this.add.rectangle(0, 0, width, height, PALETTE.bg, 0.90)
      .setOrigin(0);

    this.updateScaleVars();

    this.panelGroup = this.add.container(width/2, height/2).setDepth(10);

    this.panelBg = this.add.rectangle(
      0, 0, this.panelW, this.panelH,
      this.isWinner() ? PALETTE.winner : PALETTE.loser, 0.22 // más translúcido para depuración
    )
      .setStrokeStyle(this.panelStroke, this.isWinner() ? PALETTE.gold : PALETTE.loser)
      .setOrigin(0.5)
      .setDepth(10);
    this.panelGroup.add(this.panelBg);

    // Icono
    const iconKey = this.isWinner() ? '🏆' : '😢';
    const iconColor = this.isWinner() ? '#ffd700' : '#11A4A2';
    this.icon = this.add.text(0, this.iconY, iconKey, {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: `${this.iconFontSize}px`,
      color: iconColor,
      stroke: '#000', strokeThickness: 7,
      shadow: { offsetX: 0, offsetY: 8, color: '#000', blur: 16, fill: true }
    }).setOrigin(0.5).setDepth(11);
    this.panelGroup.add(this.icon);

    // Panel jugadores (centrado)
    this.playerPanelsGroup = this.add.container(0, this.avatarPanelY).setDepth(12);
    this.panelGroup.add(this.playerPanelsGroup);

    // Mensaje central
    this.title = this.add.text(0, this.titleY, '', {
      fontSize: `${this.titleFontSize}px`,
      fontFamily: 'Arial Black, Arial, sans-serif',
      color: PALETTE.text,
      align: 'center',
      wordWrap: { width: this.panelW * 0.9, useAdvancedWrap: true },
      stroke: '#000', strokeThickness: 7,
      shadow: { offsetX: 0, offsetY: 3, color: '#000', blur: 10, fill: true }
    }).setOrigin(0.5).setDepth(13).setAlpha(0.97);

    // Botón lobby
    this.lobbyBtn = this.add.text(0, this.lobbyBtnY, 'Volver al Lobby', {
      fontSize: `${this.lobbyBtnFontSize}px`,
      backgroundColor: this.isWinner() ? '#4CAF50' : '#2196F3',
      padding: { x: this.btnPadX, y: this.btnPadY },
      color: '#fff',
      fontFamily: 'Arial Black, Arial, sans-serif',
      borderRadius: 22,
      shadow: { offsetX: 0, offsetY: 3, color: '#000', blur: 8, fill: true }
    })
      .setOrigin(0.5).setDepth(15).setInteractive({ useHandCursor: true });
    this.panelGroup.add(this.lobbyBtn);

    this.rematchBtn = null;
    this.waitMsg = null;

    // Código sala abajo
    this.codeTxt = this.add.text(
      width/2, height - this.codePadY,
      `Código de sala: ${this.code}`,
      { fontSize: `${this.codeFontSize}px`, color: '#CCCCCC', fontFamily: 'Arial' }
    ).setOrigin(0.5).setDepth(20).setInteractive({ useHandCursor: true });

    this.codeTxt.on('pointerdown', () => {
      navigator.clipboard?.writeText(this.code);
      this.codeTxt.setText('¡Código copiado!');
      this.time.delayedCall(1200, () =>
        this.codeTxt.setText(`Código de sala: ${this.code}`));
    });

    this.lobbyBtn.on('pointerdown', () => {
      socket.emit('set-where', this.code, 'lobby');
      window.localStorage.removeItem('lobbyState');
      this.game.events.emit('go-to-lobby');
    });

    this.playersListListener = (list) => {
      this.withScenePlayers = list.filter(p => p.where === 'withscene');
      this.updatePlayersPanel();
    };
    socket.on('players-list', this.playersListListener);

    this.withScenePlayers = this.players.filter(p => p.where === 'withscene');
if (this.withScenePlayers.length === 0) {
  this.withScenePlayers = this.players;
}
this.updatePlayersPanel();
    this.updatePlayersPanel();

    this.panelGroup.setScale(0.92).setAlpha(0);
    this.tweens.add({
      targets: this.panelGroup,
      scale: 1,
      alpha: 1,
      duration: 480,
      ease: 'Back.Out'
    });

    if (this.isWinner()) this.launchConfetti(width, height);
    else this.launchSoftParticles(width, height);

    this.scale.on('resize', this.handleResize, this);
    window._phaserActiveScene = this.scene.key;
window.dispatchEvent(new Event('phaser-scene-changed'));
  }

  updateScaleVars() {
    const { width, height } = this.scale;
    const n = Math.max(2, this.withScenePlayers?.length || this.players?.length || 2);

    // Panel dimensiones, más compacto si pocos jugadores
    const minPanelH = n <= 2 ? 220 : 320;
    this.panelW = Math.max(340, Math.min(700, width * 0.62, height * 0.92));
    this.panelH = Math.max(minPanelH, Math.min(480, height * 0.62, width * 0.85));
    this.panelStroke = Math.max(4, Math.min(10, Math.floor(this.panelW * 0.014)));

    // Márgenes proporcionales
    const marginY = Math.max(14, Math.floor(this.panelH * 0.04));

    // Avatares: límite estricto y responsivo (nunca más del 32% del ancho entre todos, ni 16% del alto, ni 56px)
    const maxAvatarW = (this.panelW * 0.32) / n;
    const maxAvatarH = this.panelH * 0.16;
    this.avatarSize = Math.min(186, maxAvatarW, maxAvatarH);

    // Espacio para nombres debajo del avatar (máximo 14px)
    this.avatarNameOffsetY = Math.max(8, Math.min(this.avatarSize * 0.18, 14));

    // Cálculo de bloque avatares+nombres
    const avatarBlockH = this.avatarSize + this.avatarNameOffsetY + 8; // 8px margen extra

    // Icono central arriba, nunca solapa
    this.iconFontSize = Math.min(this.panelH * 0.11, this.panelW * 0.13, 48);

    // Título y botón
    this.titleFontSize = Math.min(this.panelH * 0.09, 28);
    this.lobbyBtnFontSize = Math.min(this.panelH * 0.07, 22);
    this.codeFontSize = Math.max(11, Math.floor(this.panelH * 0.045));
    this.codePadY = Math.max(12, Math.floor(height * 0.025));
    this.btnPadX = Math.max(10, Math.floor(this.panelW * 0.06));
    this.btnPadY = Math.max(5, Math.floor(this.panelH * 0.03));

    // Vertical: Calcula desde arriba, todo aireado y compacto
    let y = -this.panelH / 2 + marginY;

    this.iconY = y + this.iconFontSize / 2;
    y += this.iconFontSize + Math.max(8, this.panelH * 0.015);

    const avatarTopMargin = Math.max(18, Math.floor(this.panelH * 0.06));
this.avatarPanelY = y + avatarBlockH / 2 + avatarTopMargin;
    y += avatarBlockH + Math.max(8, this.panelH * 0.015);

    this.titleY = y + this.titleFontSize / 2;
    y += this.titleFontSize + Math.max(8, this.panelH * 0.015);

    this.lobbyBtnY = y + this.lobbyBtnFontSize / 3 + this.btnPadY + 80; // +24 píxeles extra

    // Si se sale del panel, ajusta todo hacia arriba
    const bottomY = this.lobbyBtnY + this.lobbyBtnFontSize / 2 + this.btnPadY + marginY;
    if (bottomY > this.panelH / 2) {
      const overflow = bottomY - this.panelH / 2;
      this.iconY -= overflow / 3;
      this.avatarPanelY -= overflow / 3;
      this.titleY -= overflow / 3;
      this.lobbyBtnY -= overflow / 3;
    }
  }

  isWinner() {
    const me = this.players.find(p => p.socketId === this.mySocketId);
    return me && me.username === this.winnerName;
  }

  updatePlayersPanel() {
    if (!this.playerPanelsGroup) return;
    this.playerPanelsGroup.removeAll(true);

    const width = this.scale.width;
    const n = this.withScenePlayers.length;
    const isHorizontal = width > 420;
    const avatarSize = this.avatarSize;
    const nameOffset = this.avatarNameOffsetY;
    const btnSeparation = this.lobbyBtnFontSize + 32; // Más separación

    const gap = isHorizontal && n > 1
      ? avatarSize +50
      : avatarSize;

    // Renderiza primero los avatares, luego los nombres (ambos en el mismo bucle, pero el nombre SIEMPRE encima)
   this.withScenePlayers.forEach((p, i) => {
  const x = isHorizontal
    ? (-(gap * (n - 1)) / 2) + i * gap
    : 0;
  const y = 0;

  // Sub-container por jugador
  const playerContainer = this.add.container(x, y);

  let avatarKey = p.avatar && this.textures.exists('avatar-' + p.playerId)
    ? 'avatar-' + p.playerId : null;

  let avatarObj;
  if (avatarKey) {
    avatarObj = this.add.image(0, 0, avatarKey)
      .setDisplaySize(avatarSize, avatarSize)
      .setOrigin(0.5);
  } else {
    avatarObj = this.add.circle(0, 0, avatarSize / 2,
      p.username === this.winnerName ? PALETTE.winner : PALETTE.loser, 0.26)
      .setStrokeStyle(3, p.isHost ? PALETTE.gold : (p.username === this.winnerName ? PALETTE.winner : PALETTE.loser));
    // Inicial
    const initialText = this.add.text(0, 0, p.username?.charAt(0).toUpperCase(), {
      fontSize: Math.floor(avatarSize / 1.5) + 'px',
      fontFamily: 'Arial Black, Arial, sans-serif',
      color: PALETTE.text, stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5);
    playerContainer.add(avatarObj);
    playerContainer.add(initialText);
  }
  // Añade avatar primero
  playerContainer.add(avatarObj);

  // Nombre SIEMPRE debajo del avatar
  const nameText = this.add.text(0, avatarSize / 2 + nameOffset, p.username, {
    fontSize: Math.max(12, Math.floor(avatarSize * 0.26)) + 'px',
    fontFamily: 'Arial Black, Arial, sans-serif',
    color: '#fff',
    align: 'center',
    stroke: '#000', strokeThickness: 2,
    wordWrap: { width: Math.max(avatarSize * 1.1, 60) }
  }).setOrigin(0.5);
  playerContainer.add(nameText);

  // Corona si es host
  if (p.isHost) {
    const crown = this.add.text(0, -avatarSize / 4 - Math.floor(avatarSize * 0.18), '👑', {
  fontSize: Math.floor(avatarSize / 3) + 'px'
}).setOrigin(0.5);
    playerContainer.add(crown);
  }

  // Añade el subcontainer al grupo principal
  this.playerPanelsGroup.add(playerContainer);
});

    // Mensaje central
    let msg = '';
    if (this.withScenePlayers.length < 2) {
      msg = 'Tu rival ha abandonado la sala.\nVuelve al lobby para continuar.';
    } else {
      msg = this.isWinner()
        ? `¡HAS GANADO!\n${this.getMyName()}, eres el campeón 👑`
        : `¡HAS PERDIDO!\nGanador: ${this.winnerName}`;
    }
    this.title.setText(msg);

    if (this.rematchBtn) { this.rematchBtn.destroy(); this.rematchBtn = null; }
    if (this.waitMsg) { this.waitMsg.destroy(); this.waitMsg = null; }

    const myPlayer = this.withScenePlayers.find(p => p.socketId === this.mySocketId);
    const isHost = myPlayer && myPlayer.isHost;
    if (this.withScenePlayers.length === 2 && isHost) {
  this.rematchBtn = this.add.text(
    0,
    this.lobbyBtnY - btnSeparation, // Más espacio arriba del botón lobby
    'Nueva Partida',
    {
      fontSize: Math.floor(this.lobbyBtnFontSize * 0.93) + 'px',
      backgroundColor: '#FFD700',
      color: '#000',
      fontFamily: 'Arial Black, Arial, sans-serif',
      padding: { x: this.btnPadX, y: this.btnPadY },
      borderRadius: 18,
      shadow: { offsetX: 0, offsetY: 2, color: '#111', blur: 6, fill: true }
    }
  )
    .setOrigin(0.5)
    .setDepth(16)
    .setInteractive({ useHandCursor: true });
      this.rematchBtn.on('pointerover', () => {
        this.tweens.add({
          targets: this.rematchBtn,
          scale: 1.09,
          duration: 120,
          ease: 'Back.Out'
        });
      });
      this.rematchBtn.on('pointerout', () => {
        this.tweens.add({
          targets: this.rematchBtn,
          scale: 1,
          duration: 90,
          ease: 'Back.In'
        });
      });
      this.rematchBtn.on('pointerdown', () => {
  if (this.withScenePlayers.length === 2) {
    socket.emit('start-game', this.code, this.gameSettings);
    window.location.reload(); // <-- Añade esto aquí
  }
});
      this.panelGroup.add(this.rematchBtn);
    } else if (this.withScenePlayers.length === 2) {
      this.waitMsg = this.add.text(0, this.lobbyBtnY - this.lobbyBtnFontSize - 13,
        'Esperando al host para nueva partida…', {
          fontSize: Math.floor(this.lobbyBtnFontSize * 0.74) + 'px',
          color: '#eeeeee',
          fontFamily: 'Arial',
          fontStyle: 'italic'
        }
      ).setOrigin(0.5).setDepth(15);
      this.tweens.add({
        targets: this.waitMsg,
        alpha: { from: 0.7, to: 1 },
        duration: 700,
        yoyo: true,
        repeat: -1
      });
      this.panelGroup.add(this.waitMsg);
    }
  }

  handleResize(gameSize) {
    const { width, height } = gameSize;
    const btnSeparation = this.lobbyBtnFontSize + 32;
    this.bgRect.setSize(width, height);
    this.updateScaleVars();

    this.panelGroup.setPosition(width / 2, height / 2);
    if (this.panelBg) this.panelBg.setSize(this.panelW, this.panelH).setStrokeStyle(this.panelStroke, this.isWinner() ? PALETTE.gold : PALETTE.loser);
    if (this.icon) this.icon.setY(this.iconY).setFontSize(this.iconFontSize + 'px');
    if (this.playerPanelsGroup) this.playerPanelsGroup.setY(this.avatarPanelY);
    if (this.title) this.title.setY(this.titleY).setFontSize(this.titleFontSize + 'px');
    if (this.lobbyBtn) this.lobbyBtn.setY(this.lobbyBtnY).setFontSize(this.lobbyBtnFontSize + 'px');
   if (this.rematchBtn)
  this.rematchBtn.setY(this.lobbyBtnY - btnSeparation)
    .setFontSize(Math.floor(this.lobbyBtnFontSize * 0.93) + 'px');if (this.waitMsg) this.waitMsg.setY(this.lobbyBtnY - this.lobbyBtnFontSize - 13).setFontSize(Math.floor(this.lobbyBtnFontSize * 0.74) + 'px');
    if (this.codeTxt) {
      this.codeTxt.setY(height - this.codePadY).setFontSize(this.codeFontSize + 'px');
    }
    this.updatePlayersPanel();
  }

  getMyName() {
    const me = this.players.find(p => p.socketId === this.mySocketId);
    return me ? me.username : '';
  }

  launchConfetti(width, height) {
    for (let i = 0; i < 40; i++) {
      const color = Phaser.Utils.Array.GetRandom(PALETTE.confetti);
      const x = Phaser.Math.Between(20, width - 20);
      const y = Phaser.Math.Between(-90, -30);
      const rect = this.add.rectangle(x, y, Phaser.Math.Between(8, 20), Phaser.Math.Between(16, 30), color, 0.88)
        .setRotation(Phaser.Math.FloatBetween(-0.3, 0.3))
        .setDepth(2)
        .setAlpha(0.93);
      this.tweens.add({
        targets: rect,
        y: height + 80,
        angle: Phaser.Math.Between(220, 660),
        duration: Phaser.Math.Between(1800, 3000),
        ease: 'Cubic.In',
        delay: Phaser.Math.Between(0, 250),
        onComplete: () => rect.destroy()
      });
    }
  }

  launchSoftParticles(width, height) {
    for (let i = 0; i < 16; i++) {
      const color = Phaser.Utils.Array.GetRandom([PALETTE.loser, 0xcccccc, 0x999999]);
      const x = Phaser.Math.Between(60, width - 60);
      const y = Phaser.Math.Between(0, height);
      const circ = this.add.circle(x, y, Phaser.Math.Between(22, 36), color, 0.09)
        .setDepth(1)
        .setAlpha(0.8);
      this.tweens.add({
        targets: circ,
        scale: Phaser.Math.FloatBetween(0.7, 1.18),
        alpha: { from: 0.8, to: 0.38 },
        duration: Phaser.Math.Between(2100, 4200),
        yoyo: true,
        repeat: -1
      });
    }
  }
}