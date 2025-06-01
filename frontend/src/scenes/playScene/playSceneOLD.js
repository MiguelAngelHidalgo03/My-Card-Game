import Phaser from 'phaser';
import socket from '../../utils/sockets';

import GameState from './GameState.js';
import registerSocketHandlers from './SocketHandlers.js';
import mountDebugGUI from './DebugGUI.js';

export default class PlayScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PlayScene' });
    this.activeToasts = []; 
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
    this.isMobile = data.isMobile;
   
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

    this.localAvatarURL = this.localPlayer.avatar;
    this.remoteAvatarURL = this.remotePlayer.avatar;
  }
  animateToDiscard(sprite, card, idx) {
    const { discardX, discardY, discardScale } = this.debug;

    // Deshabilitamos interacciones mientras vuela
    sprite.disableInteractive();

    // La llevamos justo al frente
    sprite.setDepth(1000);

    // Calculamos un ángulo aleatorio
    const angle = Phaser.Math.Between(-30, 30);

    this.tweens.add({
      targets: sprite,
      x: discardX,
      y: discardY,
      angle,
      scale: discardScale,
      duration: 500,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        // Una vez llega, disparas la jugada real
        this.handlePlayCard(card, idx);
        // El siguiente updateHandsAndLayout() borrará este sprite
      }
    });
  }
  openChat() {
  // 1) ocultamos el toast inmediatamente
  this.toastGroup.x = this.scale.width + 300;

  // 2) disparamos un evento global que React escuchará
  window.dispatchEvent(new CustomEvent('open-chat'));
}
  animateDrawCard() {

      this.isDrawing = true;
  this.drawPileSprite.disableInteractive();

    const {
      drawX, drawY,
      cardOverlap, cardScale,
      drawScale
    } = this.debug;

    // 1) Creamos el sprite del reverso
    const sprite = this.add.image(drawX, drawY, 'cards', 'Reverso_Carta.svg')
      .setOrigin(0.5)
      .setScale(drawScale)
      .setDepth(1000);

    // 2) Calculamos la posición final en la mano
    const newIdx = this.gameState.localHand.length;
    const CW = sprite.width * cardScale;
    const finalX = (this.scale.width - (CW + newIdx * cardOverlap)) / 2 + CW / 2 + newIdx * cardOverlap;
    const finalY = this.debug.cardY;

    // 3) Primer tween: vuelo al centro alto
    this.tweens.add({
      targets: sprite,
      x: this.scale.width / 2,
      y: this.debug.cardY - 200,
      duration: 700,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        // 4a) Flip parte 1: encogemos en X
        this.tweens.add({
          targets: sprite,
          scaleX: 0,
          duration: 250,
          ease: 'Cubic.easeIn',
          onComplete: () => {
            // 4b) Intercambiamos la textura por la carta real
            const drawn = this.gameState.drawCard(this.localPlayer.username);
            sprite.setTexture('cards', drawn.frame);

            // 4c) Flip parte 2: deshacemos el encogimiento
            this.tweens.add({
              targets: sprite,
              scaleX: cardScale,
              duration: 150,
              ease: 'Linear',
              onComplete: () => {
                // 5) Vuelo final hacia la mano
                this.tweens.add({
                  targets: sprite,
                  x: finalX,
                  y: finalY,
                  duration: 700,
                  ease: 'Cubic.easeIn',
                  onComplete: () => {
                    sprite.destroy();
                    this.updateHandsAndLayout();
                    this.isDrawing = false;
                    this.drawPileSprite.setInteractive({ cursor: 'pointer' });
                  }
                });
              }
            });
          }
        });
      }
    });
  }
  scrollHand(delta) {
    // máximo offset: tantas cartas menos 10
    const maxOffset = Math.max(0, this.cardSprites.length - this.maxVisibleCards);
    this.handOffset = Phaser.Math.Clamp(this.handOffset + delta, 0, maxOffset);
    this.applyLayout();
  }
  
  preload() {
    this.bgKey = this.isMobile ? 'fondoMobile' : 'fondoDesktop';

    
    this.load.image(this.bgKey,
    this.isMobile
      ? '/assests/img/frame-mobile.png'
      : '/assests/img/framegreen.png'
  );

    this.load.image('mesa', '/assests/img/table.png');
    this.load.image('borde1', '/assests/img/borde1.png');
    this.load.image('borde2', '/assests/img/borde2.png');


    this.load.image('avatar-def', '/assests/img/avatar-default.png');
    // Si ya existe en cache, no lo recargamos
    if (!this.textures.exists('cards')) {
      this.load.multiatlas(
        'cards',
        '/assests/cards/card.json',
        '/assests/cards/'
      );
    }
    // Avatares dinámicos
    if (this.localAvatarURL) {
      this.load.image(
        'avatar-local',
        this.localAvatarURL,
        { crossOrigin: 'anonymous' }
      );
    }
    if (this.remoteAvatarURL) {
      this.load.image(
        'avatar-remote',
        this.remoteAvatarURL,
        { crossOrigin: 'anonymous' }
      );
    }

  }
  create() {
      // **Desactiva todo el input de Phaser cuando oigas este evento**:
    window.addEventListener('disable-phaser-input', () => {
      this.input.enabled = false;
    });
    window.addEventListener('enable-phaser-input', () => {
      this.input.enabled = true;
    });

    // Asegúrate de limpiarlos al cerrar la escena:
    this.events.once('shutdown', () => {
      window.removeEventListener('disable-phaser-input',  null);
      window.removeEventListener('enable-phaser-input',   null);
    });



    if (!this.localPlayer || !this.remotePlayer) {
      console.error('[PlayScene] falta jugador');
      return;
    }
    
    this.toastGroup = this.add.container(this.scale.width + 300, 50); 
    // dentro de create() justo antes de montar el tablero
    this.isTouch = this.sys.game.device.input.touch; // true en móvil, false en desktop
    // índice de la primera carta visible (paginación)
    this.handOffset = 0;
    this.isDrawing = false;

    const { width, height } = this.scale;

    this.tableContainer = this.add.container(width / 2, height / 2);

    // Fondo estático
    const bg = this.add.image(width/2, height/2, this.bgKey)
    .setDisplaySize(width, height)
    .setOrigin(0.5);
    // Mesa principal
    const mesa = this.add.image(0, 0, 'mesa').setOrigin(0.5);

    // Bordes que animaremos
    const borde1 = this.add.image(0, 0, 'borde1').setOrigin(0.5);
    const borde2 = this.add.image(0, 0, 'borde2').setOrigin(0.5);

    this.tableContainer.add([bg, mesa, borde1, borde2]);

    // 2) Tween para borde1: pulso suave de escala
    this.tweens.add({
      targets: borde1,
      scale: { from: 1, to: 1.025 },
      duration: 3000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // 3) Tween para borde2: parpadeo de alpha
    this.tweens.add({
      targets: borde2,
      scale: { from: 1, to: 1.025 },
      duration: 3000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    this.tweens.add({
      targets: bg,
      scale: { from: 4, to: 4 },
      duration: 0,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });  
    
    
    const scaleFactor = this.isMobile ? 0.6 : 1;
    const scaleFactorScale = this.isMobile ? 0.45 : 1;
    const scaleFactorY = this.isMobile ? 5.1 : 1;
    const cardMobileFactor= this.isMobile ? 1.05 : 1;
    const rivalMobileFactor= this.isMobile ? 1.1 : 1;
    // const discardMobileFactor= this.isMobile ? 1.05 : 1;

    this.debug = {
      cardOverlap: 117.76 * scaleFactorScale,
      bgColor: 0x000000,
      cardY: 814.041629882812/cardMobileFactor,
      cardScale: 0.3 * scaleFactorScale,
      cardTint: 0xffffff,
      rivalY: 151.635205566406*rivalMobileFactor,
      // rivalSpacing: 0,
      rivalOverlap: 90.76* scaleFactorScale,
      rivalScale: 0.2* scaleFactorScale,
      rivalTint: 0xeeeeee,
      discardX: this.scale.width / 2,
      discardY: this.scale.height / 2.2,
      discardScale: 0.3 * scaleFactor,
      discardTint: 0xffffff,
      drawX: 448.872448,
      drawY: this.scale.height / 2,
      drawScale: 0.3 * scaleFactor,
      drawTint: 0xffffff,
      surrenderX: this.scale.width - 120,
      surrenderY: this.scale.height / 2,
      surrenderFontSize: 18 * scaleFactor,
      surrenderPaddingX: 10,
      surrenderPaddingY: 5,
      // ── Avatar ─────────────────────────────────────────────────────
      panelOffsetY: 45*scaleFactorY,       // distancia vertical del centro
      avatarSize: 48 * scaleFactor,      // tamaño cuadrado en px
      // resalte de turno
      highlightStroke: 4,        // grosor del círculo de turno
      highlightColorLocal: 0x00ff00, // color si es tu turno
      highlightColorRemote: 0xff0000,  // color si es turno rival

      liftOffset: 60,    // px que sube la carta al hover/tap
      liftDuration: 600,
      arrowMargin: 10, 

    };
    this.debug.arrowBaseGap = this.isMobile ? 50 : 100;
    this.maxVisibleCards = this.isMobile ? 6 : 10;

    const arrowOffsetX = this.isMobile ? -20 : 40;   // distancia desde el borde
    // Flechas para desplazar la mano cuando hay >10 cartas
    this.arrowLeft = this.add.text(arrowOffsetX, this.debug?.cardY || 800, '<', { fontSize: `${80*scaleFactorScale}px`, color: '#fff' })
      .setOrigin(0.5)
      .setInteractive({ cursor: 'pointer' })
      .on('pointerup', () => this.scrollHand(-1))
      .setDepth(1000);             // ⬅ las traemos al frente

    this.arrowRight = this.add.text(width - arrowOffsetX, this.debug?.cardY || 800, '>', { fontSize: `${80*scaleFactorScale}px`, color: '#fff' })
      .setOrigin(0.5)
      .setInteractive({ cursor: 'pointer' })
      .on('pointerup', () => this.scrollHand(+1))
      .setDepth(1000);             // ⬅ idem
    
    
    
    
    // const scaleFactor = this.isMobile ? 0.7 : 1;
    // const scaleFactorScale = this.isMobile ? 0.6 : 1;
    // const scaleFactorY = this.isMobile ? 1.2 : 1;
    
    
    this.debug.discardX = width * (this.isMobile ? 0.515 : 0.5);
this.debug.discardY = height * (this.isMobile ? 0.5 : 0.5);
    
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
  addDebugCard() {
    // 1) Elige un frame cualquiera del atlas 'cards'
    const frames = this.textures.get('cards').getFrameNames();  
    const randomFrame = Phaser.Utils.Array.GetRandom(frames);

    // 2) Inserta esa "carta" en tu estado de juego local
    this.gameState.localHand.push({ frame: randomFrame });

    // 3) Refresca el layout para que se vea inmediatamente
    this.updateHandsAndLayout();
  }
  createBoard() {
    const { width, height } = this.scale;

    // 1) Fondo de mesa
    // this.add.image(width/2, height/2, 'table-bg')
    //   .setDisplaySize(width, height)
    //   .setDepth(-1);
    // ── PANEL RIVAL ─────────────────────────────────────────────────────
    this.rivalPanel = this.add.container(0, this.debug.panelOffsetY);
    // avatar
    const rivalAvatarKey = this.textures.exists('avatar-remote') ? 'avatar-remote' : 'avatar-def';
    const rivalAv = this.add.image(0, 0, rivalAvatarKey)
      .setDisplaySize(this.debug.avatarSize, this.debug.avatarSize);
    // nombre + contador


    const fontSize = Math.round((this.isMobile ? height : width) * 0.02);
    this.rivalCountText = this.add.text(
      this.debug.avatarSize + 10, 0,
      `${this.remotePlayer.username} • ${this.gameState.remoteHand.length}`,
      {
        fontFamily: 'Montserrat, sans-serif',  // <-- exactly the name Google gave you
        fontSize: `${fontSize}px`,
        fontStyle: 'bold',   // pick whatever size you like
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
        shadow: {
          offsetX: 2, offsetY: 2,
          color: '#000',
          blur: 2,
          fill: false
        }
      }
    ).setOrigin(0, 0.5);

    this.rivalPanel.add([rivalAv, this.rivalCountText]);

    // ── PANEL LOCAL ──────────────────────────────────────────────────────
    this.localPanel = this.add.container(0, height - this.debug.panelOffsetY);
    const localAvatarKey = this.textures.exists('avatar-local') ? 'avatar-local' : 'avatar-def';
    const localAv = this.add.image(0, 0, localAvatarKey)
      .setDisplaySize(this.debug.avatarSize, this.debug.avatarSize);
    this.localCountText = this.add.text(
      this.debug.avatarSize + 10, 0,
      `${this.localPlayer.username} • ${this.gameState.localHand.length}`,
      {
        fontFamily: 'Montserrat, sans-serif',  // <-- exactly the name Google gave you
        fontSize: `${fontSize}px`,       
        fontStyle: 'bold', 
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
        shadow: {
          offsetX: 2, offsetY: 2,
          color: '#000',
          blur: 2,
          fill: false
        }
      }
    ).setOrigin(0, 0.5);

    this.localPanel.add([localAv, this.localCountText]);


    // Carta de descarte
    this.discard = this.add.image(0, 0, 'cards', this.gameState.topDiscard.frame)
      .setOrigin(0.5)
      .setTint(this.debug.discardTint);

    // Mazo de robo
    // Mazo de robo (sprite independiente de los datos)
    this.drawPileSprite = this.add.image(
      this.debug.drawX = width * (this.isMobile ? 0.20 : 0.25),
      this.debug.drawY = height * (this.isMobile ? 0.5 : 0.5),
      'cards',
      'Reverso_Carta.svg'
    )
      .setOrigin(0.5)
      .setScale(this.debug.drawScale)
      .setTint(this.debug.drawTint)
      .setInteractive({ cursor: 'pointer' })
      .on('pointerup', () => {
      if (!this.gameState.isLocalTurn() || this.isDrawing) return;
      this.animateDrawCard();
      socket.emit('card-drawn', { by: this.localPlayer.username });
      });

    // Botón rendirse
    this.surrenderBtn = this.add.text(this.debug.surrenderX = width * (this.isMobile ? 0.5 : 0.9), this.debug.surrenderY = height * (this.isMobile ? 0.92 : 0.5), 'Rendirse', {
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
    const isLocal = this.gameState.isLocalTurn();
    // Mano local
    this.gameState.localHand.forEach((card, idx) => {
      const img = this.add.image(0, 0, 'cards', card.frame)
        .setOrigin(0.5)
        .setTint(this.debug.cardTint);

      if (isLocal) {
        img.setInteractive({ cursor: 'pointer' });
        this.setupLiftDrop(img, card, idx);
        img.setAlpha(1);
      } else {
        img.disableInteractive();
        img.setAlpha(0.5);
      }

      this.cardSprites.push(img);
    });

    // Mano rival
    this.gameState.remoteHand.forEach(() => {
      const img = this.add.image(0, 0, 'cards', 'Reverso_Carta.svg')
        .setOrigin(0.5).setTint(this.debug.rivalTint);
      this.rivalSprites.push(img);
    });

    // Actualizar descarte y layout
    this.discard.setTexture('cards', this.gameState.topDiscard.frame);
    this.applyLayout();
  }
  setupLiftDrop(sprite, card, idx) {
    if (sprite._baseY == null) sprite._baseY = this.debug.cardY;
    const { liftOffset, liftDuration } = this.debug;
    const kill = () => this.tweens.killTweensOf(sprite);
    let lifted = false;

    // ── Desktop: hover para lift/unlift, click (pointerup) para drop ──
    if (!this.isTouch) {
      // cuando entro con el ratón
      sprite.on('pointerover', () => {
        kill();
        this.tweens.add({
          targets: sprite,
          y: sprite._baseY - liftOffset,
          duration: liftDuration,
          ease: 'Power1'
        });
      });
      // cuando salgo del hover
      sprite.on('pointerout', () => {
        kill();
        this.tweens.add({
          targets: sprite,
          y: sprite._baseY,
          duration: liftDuration,
          ease: 'Power1'
        });
      });
      // click para soltar desde escritorio
      sprite.on('pointerup', () => {
        if (sprite.y !== sprite._baseY) {
          this.animateToDiscard(sprite, card, idx);
        }
      });
    }

    // ── Móvil: tap una vez lift, tap segunda vez drop ──
    if (this.isTouch) {
      sprite.on('pointerdown', () => {
        kill();
        const targetY = lifted ? sprite._baseY : sprite._baseY - liftOffset;
        this.tweens.add({
          targets: sprite,
          y: targetY,
          duration: liftDuration,
          ease: 'Power1',
          onComplete: () => {
            if (lifted) {
              this.animateToDiscard(sprite, card, idx);
            }
            lifted = !lifted;
          }
        });
      });
    }
  }


  applyLayout() {
    const { width, height } = this.scale;
    const isLocal = this.gameState.isLocalTurn();
    this.cameras.main.setBackgroundColor(this.debug.bgColor);
    const { cardScale, cardOverlap, cardY, arrowMargin, arrowBaseGap } = this.debug;

    // ocultar todas las cartas
    this.cardSprites.forEach(s => s.setVisible(false));

    // calcular slice visible
    const visible = this.cardSprites.slice(this.handOffset, this.handOffset + this.maxVisibleCards);
    let startX = 0;
    let totalW = 0;
    let CW = 0, CH = 0;

    if (visible.length) {
      const nativeW = visible[0].frame.width;
      const nativeH = visible[0].frame.height;
      const CW = nativeW * cardScale;
      const CH = nativeH * cardScale;

      // Asignamos a las variables exteriores, no redeclaramos:
      totalW = CW + (visible.length - 1) * cardOverlap;
      startX = (width - totalW) / 2 + CW / 2;

      visible.forEach((s, i) => {
        s
          .setVisible(true)
          .setDisplaySize(CW, CH)
          .setPosition(startX + i * cardOverlap, cardY);
      });
    }

    const leftEdgeX  = startX - CW/2;                 // borde izquierdo de la 1ª carta
    const rightEdgeX = startX + (visible.length-1)*cardOverlap + CW/2; // borde derecho de la última

    this.arrowLeft.setPosition(leftEdgeX - arrowMargin-arrowBaseGap, cardY);
    this.arrowRight.setPosition(rightEdgeX + arrowMargin+arrowBaseGap, cardY);
    this.arrowLeft.setAlpha(this.handOffset > 0 ? 1 : 0.3);
    this.arrowRight.setAlpha(this.handOffset + this.maxVisibleCards < this.cardSprites.length ? 1 : 0.3);
    
    
    
    // Distribución mano rival
    if (this.rivalSprites.length) {
      const rW = this.rivalSprites[0].width * this.debug.rivalScale;
      const rH = this.rivalSprites[0].height * this.debug.rivalScale;  // ← Lo añadimos
      const totalRW = rW + (this.rivalSprites.length - 1) * this.debug.rivalOverlap;
      const rStartX = (this.scale.width - totalRW) / 2 + rW / 2;
      this.rivalSprites.forEach((s, i) =>
        s
          .setDisplaySize(rW, rH)
          .setPosition(rStartX + i * this.debug.rivalOverlap, this.debug.rivalY)
      );
    }

    // Posicionar descarte y mazo
    this.discard
      .setDisplaySize(this.discard.width * this.debug.discardScale, this.discard.height * this.debug.discardScale)
      .setPosition(this.debug.discardX, this.debug.discardY);

    this.drawPileSprite
      .setDisplaySize(this.drawPileSprite.width * this.debug.drawScale, this.drawPileSprite.height * this.debug.drawScale)
      .setPosition(this.debug.drawX, this.debug.drawY);


    this.rivalCountText.setText(`${this.remotePlayer.username} • ${this.gameState.remoteHand.length}`);
    this.localCountText.setText(`${this.localPlayer.username} • ${this.gameState.localHand.length}`);

    const rivalW = this.debug.avatarSize + 10 + this.rivalCountText.width;
    this.rivalPanel.setPosition((width - rivalW) / 2, this.debug.panelOffsetY);
    // LOCAL
    const localW = this.debug.avatarSize + 10 + this.localCountText.width;
    this.localPanel.setPosition((width - localW) / 2, height - this.debug.panelOffsetY);

    // ── Resalte de turno (si lo usas) ─────────────────────────────────
    if (this.highlight) this.highlight.destroy();
    // const isLocal = this.gameState.isLocalTurn();
    const panel = isLocal ? this.localPanel : this.rivalPanel;
    const color = isLocal
      ? this.debug.highlightColorLocal
      : this.debug.highlightColorRemote;

    this.highlight = this.add.circle(
      panel.x,              // centro X del avatar
      panel.y,
      this.debug.avatarSize / 2 + this.debug.highlightStroke / 2
    ).setStrokeStyle(this.debug.highlightStroke, color);


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

 showNotification(username, text, avatarKey) {
  if (!this.activeToasts) this.activeToasts = [];

  const toastW  = 300;
  const toastH  = 80;
  const pad     = 12;   // padding general
  const avatarS = 48;   // tamaño avatar
  const border  = 3;
  const baseX   = this.scale.width - toastW - 20;
  const startY  = 120;  // empiezan a 120px desde arriba
  const gapY    = 10;   // separación vertical entre toasts

  // crea el container fuera de pantalla
  const toast = this.add.container(this.scale.width + 20, startY + (this.activeToasts.length)*(toastH+gapY));

  // fondo blanco con borde negro
  const bg = this.add.rectangle(0, 0, toastW, toastH, 0xffffff)
    .setOrigin(0)
    .setStrokeStyle(border, 0x000000);

  // avatar arriba a la izquierda
  const av = this.add.image(pad, pad, avatarKey)
    .setDisplaySize(avatarS, avatarS)
    .setOrigin(0);

  // nombre justo a la derecha del avatar
  const nameText = this.add.text(
    pad + avatarS + pad/2,
    pad,
    username,
    {
      fontFamily: 'Montserrat, sans-serif',
      fontSize: '16px',
      fontWeight: '600',
      color: '#900'
    }
  ).setOrigin(0, 0);

  // mensaje justo debajo del nombre
  const msgText = this.add.text(
    nameText.x,
    pad + avatarS/2,
    text,
    {
      fontFamily: 'Montserrat, sans-serif',
      fontSize: '14px',
      color: '#000',
      wordWrap: { width: toastW - nameText.x - pad }
    }
  ).setOrigin(0, 0);

  toast.add([ bg, av, nameText, msgText ]);
  toast.setSize(toastW, toastH);
  toast.setDepth(2000);
  toast.setAlpha(0);
  toast.setInteractive(
    new Phaser.Geom.Rectangle(0, 0, toastW, toastH),
    Phaser.Geom.Rectangle.Contains
  ).on('pointerup', () => this.events.emit('open-chat'));

  // añadimos al final, para que la nueva quede abajo
  this.activeToasts.push(toast);

  // animación de entrada
  this.tweens.add({
    targets: toast,
    x: baseX,
    alpha: 1,
    duration: 250,
    ease: 'Cubic.easeOut'
  });

  // reposiciona todas: i=0 será arriba, i=last abajo
  this.activeToasts.forEach((t, i) => {
    this.tweens.add({
      targets: t,
      y: startY + i * (toastH + gapY),
      duration: 200,
      ease: 'Cubic.easeOut'
    });
  });

  // límite 5 notificaciones
  if (this.activeToasts.length > 5) {
    const old = this.activeToasts.shift(); // eliminar la más antigua (la de arriba)
    old.destroy();
  }

  // auto-hide
  this.time.delayedCall(4000, () => {
    this.tweens.add({
      targets: toast,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        const idx = this.activeToasts.indexOf(toast);
        if (idx !== -1) this.activeToasts.splice(idx, 1);
        toast.destroy();
        // re-layout resto
        this.activeToasts.forEach((t, i) => {
          this.tweens.add({
            targets: t,
            y: startY + i * (toastH + gapY),
            duration: 200,
            ease: 'Cubic.easeOut'
          });
        });
      }
    });
  });
}


shutdown() {
    socket.removeAllListeners('reconnected');
    socket.removeAllListeners('player-joined');
    socket.removeAllListeners('game-ended');
    socket.removeAllListeners('chat-message');
    if (this.gui) this.gui.destroy();
  }
}