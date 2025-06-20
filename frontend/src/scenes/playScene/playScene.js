import Phaser from 'phaser';
import socket from '../../utils/sockets';

import GameState from './GameState.js';
import registerSocketHandlers from './SocketHandlers.js';
import mountDebugGUI from './DebugGUI.js';

import BoardRenderer from './modules/BoardRenderer.js';
import HandView from './modules/HandView.js';
import PlayerPanel from './modules/PlayerPanel.js';
import TurnManager from './modules/TurnManager.js';
// import GameLogic from './modules/GameLogic.js';

import ChatManager from './modules/ChatManager.js';

export default class PlayScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PlayScene' });

    // variables de instancia
    this.board = null;
    this.handView = null;
    this.playerPanel = null;
    this.turnManager = null;
    this.logic = null;
    this.chat = null;
    this.gameState = null;
    this.activeToasts = [];
    this.debug = {};
    this.handOffset = 0;
    // Detecta si es mobile (puedes mejorar esta lógica si tienes un método mejor)
    this.isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);

    // Asigna unoBtnOffsets según el dispositivo
    this.unoBtnOffsets = this.isMobile
      ? {
        'above-hand': { x: 0, y: -100 }
      }
      : {
        'right-discard': { x: 300, y: 0 },
        'above-hand': { x: 0, y: -100 },
        'left-draw': { x: -300, y: 0 }
      };

  }

  recalculateDebugLayout() {
    const scaleFactor = this.isMobile ? 0.5 : 0.8;
    const scaleFactorScale = this.isMobile ? 0.45 : 0.85;
    const scaleFactorY = this.isMobile ? 1 : 0.6;
    const surrenderFactorY = this.isMobile ? 0.65 : 0.6;
    const cardMobileFactor = this.isMobile ? 1.05 : 1;
    const rivalMobileFactor = this.isMobile ? 1.1 : 1;
    const width = this.scale.width;
    const height = this.scale.height;
    const surrenderFactor = this.isMobile ? 0 : 120;
    const surrenderFactorX = this.isMobile ? 0.85 : 1;
    const surrenderFactor2 = this.isMobile ? 3 : 1;
    const scaleFactorFont = this.isMobile ? 0.9 : 1;

    // Defaults (escritorio)
    let cardOverlap = 60;
    let rivalOverlap = 90;
    let cardScale = 0.20;
    let rivalScale = 0.20;
    let avatarSize = 48;
    let panelOffsetY = 150;
    let drawX = width / 3.2;
    let surrenderFontSize = 24;
    let maxVisibleCards = 10;

    // < 700px
    if (width < 700) {
      cardOverlap = 30;
      rivalOverlap = 30;
      cardScale = 0.20;
      rivalScale = 0.20;
      avatarSize = 36;
      panelOffsetY = 80;
      drawX = width / 3.8;
      surrenderFontSize = 18;
      maxVisibleCards = 7;
    }
    // < 500px
    if (width < 500) {
      cardOverlap = 25;
      rivalOverlap = 30;
      cardScale = 0.20;
      rivalScale = 0.20;
      avatarSize = 28;
      panelOffsetY = 140;
      drawX = width / 4.5;
      surrenderFontSize = 14;
      maxVisibleCards = 5;
    }
    // < 400px
    if (width < 400) {
      cardOverlap = 20;
      rivalOverlap = 30;
      cardScale = 0.18;
      rivalScale = 0.18;
      avatarSize = 20;
      panelOffsetY = 80;
      drawX = width / 5.2;
      surrenderFontSize = 10;
      maxVisibleCards = 4;
    }

    this.debug = {
      cardOverlap: cardOverlap * cardMobileFactor,
      bgColor: 0x000000,
      cardY: height / 1.28, // Mano local
      cardScale: cardScale * scaleFactorScale,
      cardTint: 0xffffff,
      rivalY: height / 4.5, // Mano rival
      rivalOverlap: rivalOverlap * rivalMobileFactor,
      rivalScale: rivalScale * scaleFactorScale,
      rivalTint: 0xeeeeee,
      discardX: width / 2,
      discardY: height / 2,
      discardScale: 0.22 * scaleFactor,
      discardTint: 0xffffff,
      drawX: drawX,
      drawY: height / 2,
      drawScale: 0.23 * scaleFactor,
      drawTint: 0xffffff,
      surrenderX: (width * surrenderFactorX) - surrenderFactor,
      surrenderY: height * surrenderFactorY,
      surrenderFontSize: surrenderFontSize * scaleFactorFont,
      surrenderPaddingX: 10 * scaleFactorFont,
      surrenderPaddingY: 5 * scaleFactorFont,
      panelOffsetY: panelOffsetY * scaleFactorY,
      avatarSize: avatarSize * scaleFactor,
      highlightStroke: 4,
      highlightColorLocal: 0x00ff00,
      highlightColorRemote: 0xff0000,
      liftOffset: 60,
      liftDuration: 600,
      arrowMargin: 0,
      arrowBaseGap: this.isMobile ? 50 : 100,
      maxVisibleCards: maxVisibleCards
    };
  }

  init(data) {
    Object.assign(this, data);
    this.allPlayers = data.players || [];
    this.localPlayer = this.allPlayers.find(p =>
      (data.userId && p.userId === data.userId) ||
      (!data.userId && p.clientId === data.clientId)
    );
    this.remotePlayer = this.allPlayers.find(p => p !== this.localPlayer);

    // Fallback si localPlayer es undefined
    if (!this.localPlayer) {
      this.localPlayer = this.allPlayers[0];
      this.remotePlayer = this.allPlayers[1];
      console.warn('No se pudo determinar el jugador local, usando el primero de la lista');
    }
    // console.log('[PlayScene:init] data.userId:', data.userId, 'data.clientId:', data.clientId);
    console.log('[PlayScene:init] allPlayers:', this.allPlayers.map(p => ({
      username: p.username,
      userId: p.userId,
      clientId: p.clientId,
      playerId: p.playerId
    })));
    // console.log('[PlayScene:init] localPlayer:', this.localPlayer);
    // console.log('[PlayScene:init] remotePlayer:', this.remotePlayer);
    // console.log('[PlayScene:init] playerId:', this.playerId);
    // FUERZA EL ORDEN: local primero, rival después
    const players = [this.localPlayer, this.remotePlayer];

    this.playerId = this.localPlayer.playerId;

    // Calcula debug antes de preload/create
    this.recalculateDebugLayout();

    // Estado de juego local inmediato
    this.gameState = GameState.fromServerPayload({
      players,
      hands: data.hands,
      drawPile: data.drawPile,
      discardPile: data.discardPile,
      turnIndex: data.turnIndex,
      currentPlayerId: data.currentPlayerId,
      chosenColor: data.chosenColor
    });
  }
  preload() { }
  create() {
    
    // Al principio del constructor o en create():
    this.isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const scaleFactor = this.isMobile ? 0.5 : 1;
    this.input.enabled = !this.isAnimating;
    this.recalculateDebugLayout();

    if (!this.chat) {
      this.chat = new ChatManager(this);
      this.chat.setupListeners();
    }

    this.board = new BoardRenderer(this);
    this.board.create();


    const { width, height } = this.scale;
    const btnWidth = 180 * scaleFactor;
    const btnHeight = 56 * scaleFactor;
    const btnRadius = 18;
    const btnX = this.debug.surrenderX;
    const btnY = this.debug.surrenderY + 40;

    // Botón principal "Rendirse"
    const surrenderGraphics = this.add.graphics();
    surrenderGraphics.fillStyle(0xff5555, 1);
    surrenderGraphics.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, btnRadius);
    surrenderGraphics.lineStyle(4, 0xaa2222, 1);
    surrenderGraphics.strokeRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, btnRadius);
    surrenderGraphics.setAlpha(0.92);

    const surrenderText = this.add.text(0, 0, 'Rendirse', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: `${this.debug.surrenderFontSize}px`,
      fontStyle: 'bold',
      color: '#fff',
      align: 'center',
      stroke: '#000',
      strokeThickness: 4,
      shadow: {
        offsetX: 0,
        offsetY: 3,
        color: '#aa2222',
        blur: 8,
        fill: true
      }
    }).setOrigin(0.5);

    const surrenderZone = this.add.zone(0, 0, btnWidth, btnHeight)
      .setOrigin(0.5)
      .setInteractive();

    this.surrenderBtn = this.add.container(btnX, btnY, [surrenderGraphics, surrenderText, surrenderZone])
      .setSize(btnWidth, btnHeight)
      .setDepth(1000);

    surrenderZone
      .on('pointerover', () => surrenderGraphics.setAlpha(1))
      .on('pointerout', () => surrenderGraphics.setAlpha(0.92))
      .on('pointerdown', () => surrenderGraphics.setAlpha(0.7))
      .on('pointerup', () => {
        surrenderGraphics.setAlpha(1);
        this.showSurrenderModal();
      });

    // --- Modal de confirmación ---
    this.showSurrenderModal = () => {
      if (this.surrenderModal) return;

      const modalWidth = 400;
      const modalHeight = 220;
      const modalBg = this.add.graphics();
      modalBg.fillStyle(0x222222, 0.96);
      modalBg.fillRoundedRect(-modalWidth / 2, -modalHeight / 2, modalWidth, modalHeight, 24);
      modalBg.lineStyle(4, 0xff5555, 1);
      modalBg.strokeRoundedRect(-modalWidth / 2, -modalHeight / 2, modalWidth, modalHeight, 24);

      const modalText = this.add.text(0, -40, '¿Seguro que quieres rendirte?\nEsta acción no se puede deshacer.', {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '22px',
        color: '#fff',
        align: 'center',
        wordWrap: { width: modalWidth - 40 }
      }).setOrigin(0.5);

      // Botón "Sí, rendirse"
      const yesBtnBg = this.add.graphics();
      yesBtnBg.fillStyle(0xff5555, 1);
      yesBtnBg.fillRoundedRect(-70, -22, 140, 44, 12);
      yesBtnBg.setAlpha(0.92);

      const yesBtnText = this.add.text(0, 0, 'Sí, rendirse', {
        fontSize: '20px',
        fontFamily: 'Arial Black, Arial, sans-serif',
        color: '#fff',
        fontStyle: 'bold',
        align: 'center'
      }).setOrigin(0.5);

      const yesBtnZone = this.add.zone(0, 0, 140, 44)
        .setOrigin(0.5)
        .setInteractive({ cursor: 'pointer' });

      const yesBtn = this.add.container(-80, 50, [yesBtnBg, yesBtnText, yesBtnZone]);

      yesBtnZone
        .on('pointerover', () => yesBtnBg.setAlpha(1))
        .on('pointerout', () => yesBtnBg.setAlpha(0.92))
        .on('pointerdown', () => yesBtnBg.setAlpha(0.7))
        .on('pointerup', () => {
          yesBtnBg.setAlpha(1);
          socket.emit('end-game', {
            code: this.code,
            winnerPlayerId: this.remotePlayer.playerId
          });
          this.hideSurrenderModal();
        });

      // Botón "Cancelar"
      const cancelBtnBg = this.add.graphics();
      cancelBtnBg.fillStyle(0x444444, 1);
      cancelBtnBg.fillRoundedRect(-70, -22, 140, 44, 12);
      cancelBtnBg.setAlpha(0.92);

      const cancelBtnText = this.add.text(0, 0, 'Cancelar', {
        fontSize: '20px',
        fontFamily: 'Arial Black, Arial, sans-serif',
        color: '#fff',
        fontStyle: 'bold',
        align: 'center'
      }).setOrigin(0.5);

      const cancelBtnZone = this.add.zone(0, 0, 140, 44)
        .setOrigin(0.5)
        .setInteractive({ cursor: 'pointer' });

      const cancelBtn = this.add.container(80, 50, [cancelBtnBg, cancelBtnText, cancelBtnZone]);

      cancelBtnZone
        .on('pointerover', () => cancelBtnBg.setAlpha(1))
        .on('pointerout', () => cancelBtnBg.setAlpha(0.92))
        .on('pointerdown', () => cancelBtnBg.setAlpha(0.7))
        .on('pointerup', () => {
          cancelBtnBg.setAlpha(1);
          this.hideSurrenderModal();
        });

      this.surrenderModal = this.add.container(width / 2, height / 2, [modalBg, modalText, yesBtn, cancelBtn])
        .setDepth(2000);

      // Bloquea input detrás del modal
      // this.input.enabled = false;
    };

    this.hideSurrenderModal = () => {
      if (this.surrenderModal) {
        this.surrenderModal.destroy();
        this.surrenderModal = null;
        // this.input.enabled = true;
      }
    };

    // montar GUI de debug SI toca
    if (this.debugMode) {
      this.gui = mountDebugGUI(this, this.debug, () => this.applyLayout());
    }
    if (this.gameState) {
      if (!this.handView) this.handView = new HandView(this, this.gameState);
      if (!this.playerPanel) this.playerPanel = new PlayerPanel(this, this.gameState);
      if (!this.turnManager) this.turnManager = new TurnManager(this, this.gameState);

      this.handView.updateHandsAndLayout();
      if (this.playerPanel) this.playerPanel.updateCount();
      if (this.turnManager) this.turnManager.update();
    }

    // registro todos los handlers (incluye game-bged donde se crea board/mano/panel/turno)
    registerSocketHandlers(this, this.gameState, this.logic);

    // Opcional: escucha resize para recalcular layout
    this.scale.on('resize', () => {
      this.recalculateDebugLayout();
      this.applyLayout();
    });

    this.events.once('shutdown', () => {
      // detener todas las animaciones pendientes
      this.tweens.killAll();
      // destruir sprites de mano y rival
      (this.cardSprites || []).forEach(s => s.destroy());
      (this.rivalSprites || []).forEach(s => s.destroy());
      // quitar listeners de resize
      this.scale.off('resize');
      // limpiar GUI
      if (this.gui) this.gui.destroy();
      // desconectar sockets
      socket.off(); // o listar cada evento con socket.off('card-played')…
    });
      window._phaserActiveScene = this.scene.key;
window.dispatchEvent(new Event('phaser-scene-changed'));
  }

  update() {
    // todo el “update” real se hace desde TurnManager via socket
  }

  applyLayout() {
    // reubica elementos de tablero tras cambio en debug
    if (this.board) this.board.applyLayout();
    if (this.handView) this.handView.layout();
    if (this.playerPanel) this.playerPanel.updateCount();
  }
  applyGameState(gameState) {
    if (!this.scene || !this.textures.exists('cards')) {
      console.warn('[PlayScene] Escena o textura cards no lista, ignorando applyGameState');
      return;
    }
    (this.cardSprites || []).forEach(s => s.destroy());
    (this.rivalSprites || []).forEach(s => s.destroy());
    this.cardSprites = [];
    this.rivalSprites = [];
    this.gameState = gameState;
    if (this.handView) this.handView.gameState = this.gameState;
    if (this.playerPanel) this.playerPanel.gameState = this.gameState;
    if (this.turnManager) this.turnManager.gameState = this.gameState;
    if (this.board) {
      this.board.applyLayout();
      if (this.board.updateDiscard) this.board.updateDiscard(null); // <-- Añade esto
    }
    if (this.handView) this.handView.updateHandsAndLayout();
    if (this.playerPanel) this.playerPanel.updateCount();
    if (this.turnManager) this.turnManager.update();
    this.isAnimating = false;
    this.input.enabled = true;
    // console.log('[FRONTEND] applyGameState: localHand', this.gameState.localHand);
  }
  showUnoButton(playerId, position) {
    if (this.unoBtn) return;
    if (this.isMobile) {
      position = 'above-hand';
    }
    this.unoBtnPosition = position;
    this.unoBtnPlayerId = playerId;
    const isLocalUno = playerId === this.playerId;
    const label = isLocalUno ? '¡UNO!' : 'UNO';

    // Colores y estilos visuales
    const bgColor = isLocalUno ? '#1aff1a' : '#ff3333';
    const borderColor = isLocalUno ? 0x00ff00 : 0xff0000;
    const textColor = '#fff';
    const shadowColor = isLocalUno ? '#00ff00' : '#ff0000';

    let x, y;
    const d = this.debug;

    // Selecciona la posición según el tipo
    if (position === 'right-discard') {
      x = d.discardX + this.unoBtnOffsets['right-discard'].x;
      y = d.discardY + this.unoBtnOffsets['right-discard'].y;
    } else if (position === 'above-hand') {
      x = this.scale.width / 2 + this.unoBtnOffsets['above-hand'].x;
      y = d.cardY + this.unoBtnOffsets['above-hand'].y;
    } else if (position === 'left-draw') {
      x = d.drawX + this.unoBtnOffsets['left-draw'].x;
      y = d.drawY + this.unoBtnOffsets['left-draw'].y;
    } else {
      // fallback: centro
      x = this.scale.width / 2;
      y = this.scale.height / 2;
    }

    const radius = 32;
    const width = 160;
    const height = 64;

    // Fondo redondeado con borde
    const graphics = this.add.graphics();
    graphics.fillStyle(Phaser.Display.Color.HexStringToColor(bgColor).color, 1);
    graphics.fillRoundedRect(-width / 2, -height / 2, width, height, radius);
    graphics.lineStyle(5, borderColor, 1);
    graphics.strokeRoundedRect(-width / 2, -height / 2, width, height, radius);

    // Texto con sombra
    const unoText = this.add.text(0, 0, label, {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '44px',
      fontStyle: 'bold',
      color: textColor,
      align: 'center',
      stroke: '#000',
      strokeThickness: 6,
      shadow: {
        offsetX: 0,
        offsetY: 4,
        color: shadowColor,
        blur: 8,
        fill: true
      }
    }).setOrigin(0.5);

    // Zona invisible para interacción completa
    const hitZone = this.add.zone(0, 0, width, height)
      .setOrigin(0.5)
      .setInteractive();

    // Container para agrupar fondo, texto y zona interactiva
    this.unoBtn = this.add.container(x, y, [graphics, unoText, hitZone])
      .setSize(width, height)
      .setDepth(9999);

    // Eventos SOLO en la zona interactiva
    hitZone
      .on('pointerover', () => {
        graphics.setAlpha(0.85);
        unoText.setScale(1.08);
      })
      .on('pointerout', () => {
        graphics.setAlpha(1);
        unoText.setScale(1);
      })
      .on('pointerdown', () => {
        graphics.setAlpha(0.7);
        unoText.setScale(0.97);
      })
      .on('pointerup', () => {
        graphics.setAlpha(1);
        unoText.setScale(1.1);
        this.time.delayedCall(80, () => unoText.setScale(1), [], this);
        // console.log('[UNO][FRONTEND] Botón UNO pulsado. Emitiendo uno-pressed:', { code: this.code, playerId: this.playerId });
        socket.emit('uno-pressed', { code: this.code, playerId: this.playerId });
        this.hideUnoButton();
      });
  }
  hideUnoButton() {
    if (this.unoBtn) {
      // console.log('[UNO][FRONTEND] Ocultando botón UNO');
      this.unoBtn.destroy();
      this.unoBtn = null;
      this.unoBtnPosition = null;
    }
  }

}