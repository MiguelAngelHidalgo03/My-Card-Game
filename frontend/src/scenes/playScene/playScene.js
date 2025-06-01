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
import ColorSelector from './modules/ColorSelector.js';
import ChatManager from './modules/ChatManager.js';

export default class PlayScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PlayScene' });

    // variables de instancia
    this.board         = null;
    this.handView      = null;
    this.playerPanel   = null;
    this.turnManager   = null;
    this.logic         = null;
    this.chat          = null;
    this.gameState     = null;
    this.activeToasts  = [];
    this.debug         = {};
     this.handOffset = 0;
    // Detecta si es mobile (puedes mejorar esta lógica si tienes un método mejor)
    this.isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);

    // Asigna unoBtnOffsets según el dispositivo
 this.unoBtnOffsets = this.isMobile
  ? {
      'above-hand': { x: 0, y: -100 }
    }
  : {
      'right-discard':  { x: 300,  y: 0 },
      'above-hand':     { x: 0,    y: -100 },
      'left-draw':      { x: -300, y: 0 }
    };
  
  }

 recalculateDebugLayout() {
  const scaleFactor = this.isMobile ? 0.6 : 1;
  const scaleFactorScale = this.isMobile ? 0.45 : 1;
  const scaleFactorY = this.isMobile ? 1 : 0.6;
  const cardMobileFactor = this.isMobile ? 1.05 : 1;
  const rivalMobileFactor = this.isMobile ? 1.1 : 1;
  const width = this.scale.width;
  const height = this.scale.height;

  this.debug = {
    cardOverlap: 80.76 * scaleFactorScale,
    bgColor: 0x000000,
    cardY: height / 1.28, // <-- Cambia esto para bajar la mano local
    cardScale: 0.20 * scaleFactorScale,
    cardTint: 0xffffff,
    rivalY: height / 4.5, // <-- Mano rival arriba del centro
    rivalOverlap: 90.76 * scaleFactorScale,
    rivalScale: 0.2 * scaleFactorScale,
    rivalTint: 0xeeeeee,
    discardX: width / 2, // centro del container
    discardY: height / 2, // centro del container
    discardScale: 0.22 * scaleFactor,
    discardTint: 0xffffff,
    drawX: width / 3.2, // a la izquierda del centro
    drawY: height / 2, // centro vertical
    drawScale: 0.23 * scaleFactor,
    drawTint: 0xffffff,
    surrenderX: width / 2 - 120,
    surrenderY: 0,
    surrenderFontSize: 18 * scaleFactor,
    surrenderPaddingX: 10,
    surrenderPaddingY: 5,
    panelOffsetY: 152.851205566406 * scaleFactorY,
    avatarSize: 48 * scaleFactor,
    highlightStroke: 4,
    highlightColorLocal: 0x00ff00,
    highlightColorRemote: 0xff0000,
    liftOffset: 60,
    liftDuration: 600,
    arrowMargin: 10,
    arrowBaseGap: this.isMobile ? 50 : 100,
     maxVisibleCards: this.isMobile ? 6 : 10
  };
}

  init(data) {
    Object.assign(this, data);
    this.allPlayers   = data.players || [];
    this.localPlayer  = this.allPlayers.find(p =>
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
    console.log('[PlayScene:init] data.userId:', data.userId, 'data.clientId:', data.clientId);
console.log('[PlayScene:init] allPlayers:', this.allPlayers.map(p => ({
  username: p.username,
  userId: p.userId,
  clientId: p.clientId,
  playerId: p.playerId
})));
console.log('[PlayScene:init] localPlayer:', this.localPlayer);
console.log('[PlayScene:init] remotePlayer:', this.remotePlayer);
console.log('[PlayScene:init] playerId:', this.playerId);
    // FUERZA EL ORDEN: local primero, rival después
    const players = [this.localPlayer, this.remotePlayer];

    this.playerId = this.localPlayer.playerId;

    // Calcula debug antes de preload/create
    this.recalculateDebugLayout();

    // Estado de juego local inmediato
    this.gameState = GameState.fromServerPayload({
      players,
      hands:       data.hands,
      drawPile:    data.drawPile,
      discardPile: data.discardPile,
      turnIndex:   data.turnIndex,
      currentPlayerId: data.currentPlayerId,
      chosenColor: data.chosenColor
    });
  }

  preload() {
    // Precarga de assets de tablero (sin crear instancia)
    const d = this.debug;
    this.load.image('fondoMobile', '/assests/img/frame-mobile.png');
    this.load.image('fondoDesktop', '/assests/img/Background2.png');
    this.load.image('mesa', '/assests/img/Ring_Solo.png');
    // this.load.image('borde1', '/assests/img/borde1.png');
    // this.load.image('borde2', '/assests/img/borde2.png');
        // **AÑADE ESTAS LÍNEAS:**
    this.load.image('Persona', '/assests/img/Persona.png');
    this.load.image('Persona2', '/assests/img/Persona2.png');
    this.load.image('PersonaChica', '/assests/img/PersonaChica.png');
    this.load.image('PersonaChica2', '/assests/img/PersonaChica2.png');
    this.load.image('avatar-def','/assests/img/avatar-default.png');
    
    // Precarga de cartas y avatars (esto está bien)
    if (!this.textures.exists('cards')) {
      this.load.multiatlas('cards','/assests/Cartas/cartas.json','/assests/Cartas/');
    }
    if (!this.textures.exists('cambiacolor')) {
      this.load.multiatlas('cambiacolor','/assests/cambiacolor/cambiacolor.json','/assests/cambiacolor/');
    }
    if (!this.textures.exists('mas4')) {
      this.load.multiatlas('mas4','/assests/mas4/mas4.json','/assests/mas4/');
    }
    if (this.localPlayer.avatar)  this.load.image('avatar-local',  this.localPlayer.avatar,  { crossOrigin:'anonymous' });
    if (this.remotePlayer.avatar) this.load.image('avatar-remote', this.remotePlayer.avatar, { crossOrigin:'anonymous' });
  }
  
  create() {
    this.input.enabled = !this.isAnimating;
    this.recalculateDebugLayout();

    if (!this.chat) {
    this.chat = new ChatManager(this);
    this.chat.setupListeners();
  }

    this.board = new BoardRenderer(this);
    this.board.create();

    // render del surrender
    const { width, height } = this.scale;
    this.surrenderBtn = this.add.text(
      this.debug.surrenderX,
      this.debug.surrenderY,
      'Rendirse',
      {
        fontSize: `${this.debug.surrenderFontSize}px`,
        backgroundColor: '#f00',
        padding: { x: this.debug.surrenderPaddingX, y: this.debug.surrenderPaddingY },
        color: '#fff'
      }
    )
      .setOrigin(0.5)
      .setInteractive({ cursor: 'pointer' })
      .on('pointerup', () => {
        socket.emit('end-game', {
          code: this.code,
          winnerPlayerId: this.remotePlayer.playerId
        });
      });

    // montar GUI de debug SI toca
    if (this.debugMode) {
      this.gui = mountDebugGUI(this, this.debug, () => this.applyLayout());
    }
    if (this.gameState) {
      if (!this.handView)    this.handView    = new HandView(this, this.gameState);
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
  (this.rivalSprites|| []).forEach(s => s.destroy());
  // quitar listeners de resize
  this.scale.off('resize');
  // limpiar GUI
  if (this.gui) this.gui.destroy();
  // desconectar sockets
  socket.off(); // o listar cada evento con socket.off('card-played')…
});


  

  }

  update() {
    // todo el “update” real se hace desde TurnManager via socket
  }

  applyLayout() {
    // reubica elementos de tablero tras cambio en debug
    if (this.board)    this.board.applyLayout();
    if (this.handView) this.handView.layout();
    if (this.playerPanel) this.playerPanel.updateCount();
  }
  applyGameState(gameState) {
  (this.cardSprites || []).forEach(s => s.destroy());
  (this.rivalSprites|| []).forEach(s => s.destroy());
  this.cardSprites = [];
  this.rivalSprites = [];
  this.gameState = gameState;
  if (this.handView)    this.handView.gameState    = this.gameState;
  if (this.playerPanel) this.playerPanel.gameState = this.gameState;
  if (this.turnManager) this.turnManager.gameState = this.gameState;
  if (this.board) {
    this.board.applyLayout();
    if (this.board.updateDiscard) this.board.updateDiscard(null); // <-- Añade esto
  }
  if (this.handView) this.handView.updateHandsAndLayout();
  if (this.playerPanel) this.playerPanel.updateCount();
  if (this.turnManager) this.turnManager.update();
  this.isAnimating    = false;
  this.input.enabled  = true;
  console.log('[FRONTEND] applyGameState: localHand', this.gameState.localHand);
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
    graphics.fillRoundedRect(-width/2, -height/2, width, height, radius);
    graphics.lineStyle(5, borderColor, 1);
    graphics.strokeRoundedRect(-width/2, -height/2, width, height, radius);

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
            console.log('[UNO][FRONTEND] Botón UNO pulsado. Emitiendo uno-pressed:', { code: this.code, playerId: this.playerId });
            socket.emit('uno-pressed', { code: this.code, playerId: this.playerId });
            this.hideUnoButton();
        });
}
hideUnoButton() {
  if (this.unoBtn) {
      console.log('[UNO][FRONTEND] Ocultando botón UNO');
    this.unoBtn.destroy();
    this.unoBtn = null;
    this.unoBtnPosition = null;
  }
}

}