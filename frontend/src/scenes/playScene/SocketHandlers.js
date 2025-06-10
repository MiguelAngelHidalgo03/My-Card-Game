// src/scenes/playScene/SocketHandlers.js
import socket from '../../utils/sockets';
import GameState from './GameState';
import ColorSelector from './modules/ColorSelector.js';
import HandView from './modules/HandView';
import PlayerPanel from './modules/PlayerPanel';
import TurnManager from './modules/TurnManager';

export default function registerSocketHandlers(scene, gameLogic) {
  // ——— Limpieza previa de handlers —————————————————————————
  socket.off('reconnected');
  socket.off('player-joined');
  socket.off('game-ended');
  socket.off('card-played');
  socket.off('card-drawn');
  socket.off('game-started');
  socket.off('game-state');
  socket.off('choose-color-request');
  // socket.off('draw-error');
  socket.off('uno-alert');
  socket.off('uno-resolved');
  socket.off('game-ended');


  // ——— Reconexión (re-emite estado completo, sin animaciones) —————
  socket.on('reconnected', payload => {
    console.log('[SocketHandlers] reconnected', payload);
    scene.gameState = GameState.fromServerPayload(payload);
    // fuerza re-render inmediato de mano/tablero/panel
    scene.applyGameState(scene.gameState);
    // desbloquea input en caso de que viniera bloqueado
    scene.input.enabled = true;
  });

  // ——— Lista de jugadores en el lobby —————————————————————
  socket.on('player-joined', list => {
    scene.allPlayers = list;
    // podrías actualizar playerPanel aquí si quieres
  });

  // ——— Fin de partida —————————————————————————————————————
  socket.on('game-ended', ({ winnerPlayerId }) => {
    const winner = scene.allPlayers.find(p => p.playerId === winnerPlayerId);
    scene.scene.start('WinScene', {
      winnerName: winner?.username || 'Nadie',
      code: scene.code,
      players: scene.allPlayers,
      gameSettings: scene.gameSettings,
      mySocketId: scene.mySocketId
    });
  });

  // ——— Jugada remota: anima y luego aplica estado pendiente —————————
  socket.on('card-played', ({ by, cardFrame, cardIndex }) => {
    if (by === scene.localPlayer.username) return;
    // bloquea todo input de cartas
    scene.input.enabled = false;
    scene._remotePlayAnimating = true;

    scene.handView.animateRemotePlay(cardIndex, cardFrame, () => {
      // al acabar animación:
      scene._remotePlayAnimating = false;
      // si recibimos estado mientras animaba, aplícalo ahora
      if (scene._pendingGameState) {
        scene.applyGameState(scene._pendingGameState);
        scene._pendingGameState = null;
      }
      // desbloquea input
      scene.input.enabled = true;
    });
  });

  // ——— Robar carta remota: aplica estado inmediatamente —————————
  socket.on('card-drawn', ({ by, cardFrame }) => {
    // Si es el local, puedes ignorar (ya animaste localmente)
    // if (by === scene.localPlayer.username) return;
    // // Encola la animación de robo
    // scene.handView.enqueueDrawAnimation(cardFrame, by);
  });


  // ——— Inicio de partida: inicializa módulos con el estado inicial —————
  socket.on('game-started', payload => {
    // limpio cualquier animación previa
    console.log('[SocketHandlers] game-started payload:', payload);
    scene._remotePlayAnimating = false;
    scene.isAnimating = false;
    scene.input.enabled = true;

    // construye nuevo GameState
    scene.gameState = GameState.fromServerPayload(payload);
    scene.currentPlayerId = payload.currentPlayerId;

    // no recrees canvas completo, solo actualiza referencias
    if (scene.board) scene.board.scene = scene;

    // modules singleton
    if (!scene.handView) scene.handView = new HandView(scene, scene.gameState);
    if (!scene.playerPanel) scene.playerPanel = new PlayerPanel(scene, scene.gameState);
    if (!scene.turnManager) scene.turnManager = new TurnManager(scene, scene.gameState);

    // refresca datos
    scene.handView.updateHandsAndLayout();
    scene.playerPanel.updateCount();
    scene.turnManager.update();
  });
  socket.on('draw-error', ({ reason }) => {
    if (scene.board && scene.board.drawPileSprite) {
      scene.board.shakeSprite(scene.board.drawPileSprite);
    }
    scene.showToast?.(reason || 'No puedes robar carta');
    scene.isDrawing = false;
    scene.input.enabled = true;
    console.log('[isDrawing] draw-error recibido, desbloqueando:', scene.isDrawing);
  });

  // ——— Estado de juego continuo: pausa si hay animación remota —————
  socket.on('game-state', payload => {
    // Ordena los jugadores para que local siempre sea el primero
    const local = payload.players.find(p =>
      (scene.localPlayer.userId && p.userId === scene.localPlayer.userId) ||
      (!scene.localPlayer.userId && p.clientId === scene.localPlayer.clientId)
    );
    const remote = payload.players.find(p => p !== local);
    const ordered = [local, remote];

    const prevHand = scene.gameState ? scene.gameState.localHand : [];
    const newState = GameState.fromServerPayload({ ...payload, players: ordered });
    scene.currentPlayerId = payload.currentPlayerId;
    const newHand = newState.localHand;

    // --- Aplica el estado primero ---
    if (scene._remotePlayAnimating) {
      scene._pendingGameState = newState;
    } else {
      // Solo el jugador local anima el robo si su mano ha aumentado
      if (scene.localPlayer.playerId === payload.currentPlayerId && newHand.length > prevHand.length) {
        const card = newHand[newHand.length - 1];
        scene.handView.enqueueDrawAnimation(card.frame, scene.localPlayer.username);
        setTimeout(() => {
          scene.applyGameState(newState);
          scene.isAnimating = false;
          scene.input.enabled = true;
          scene.isDrawing = false;
        }, 900);
        // --- Notificación tras aplicar estado ---
        setTimeout(() => {
          showColorNotificationIfNeeded(scene, newState);
        }, 950);
        return;
      }
      // Para el rival, solo actualiza el estado, sin animación de robo
      scene.applyGameState(newState);
      scene.isAnimating = false;
      scene.input.enabled = true;
      scene.isDrawing = false;
      // --- Notificación tras aplicar estado ---
      showColorNotificationIfNeeded(scene, newState);
    }
});

// Añade esta función auxiliar en el mismo archivo:
function showColorNotificationIfNeeded(scene, newState) {
    const isMyTurn = newState.currentPlayerId === scene.localPlayer.playerId;
    const top = newState.topDiscard.frame;
    const isWild = ['cambia_color.svg','mas4.svg'].includes(top);
    if (
      isMyTurn &&
      isWild &&
      newState.chosenColor &&
      newState.lastColorChooser &&
      newState.lastColorChooser !== scene.localPlayer.username
    ) {
      scene.showNotification?.(
        `🔔 ${newState.lastColorChooser} eligió:`,
        newState.chosenColor
      );
      // Pulso visual en la carta de descarte
      scene.tweens.add({
        targets: scene.board.discard,
        scale:   1.02,
        yoyo:    true,
        repeat:  2,
        duration:400
      });
    }
}

socket.on('choose-color-request', ({ code }) => {
    const { x, y } = scene.board.discard;
    // scene.input.enabled = false;
    ColorSelector.show(scene, x, y) // <-- Usa el import, no scene.ColorSelector
        .then(color => {
            socket.emit('choose-color', { code, color });
            // scene.input.enabled = true;
        });
});

socket.on('uno-alert', ({ playerId, position }) => {
   console.log(`[UNO][FRONTEND] Recibido uno-alert: playerId=${playerId}, position=${position}`);
  scene.showUnoButton(playerId, position);
});
socket.on('uno-resolved', ({ winner, penalized, unoPlayer }) => {
  console.log(`[UNO][FRONTEND] Recibido uno-resolved: winner=${winner}, penalized=${penalized}, unoPlayer=${unoPlayer}`);
  scene.hideUnoButton();
  if (penalized === scene.playerId) {
    scene.showNotification?.('¡No pulsaste UNO a tiempo! +2 cartas', '', 'avatar-local');
  } else if (winner === scene.playerId) {
    scene.showNotification?.('¡Fuiste el más rápido con UNO!', '', 'avatar-local');
  } else if (unoPlayer === scene.playerId) {
    scene.showNotification?.('¡Te libraste de la penalización UNO!', '', 'avatar-local');
  }
});
socket.on('game-ended', ({ winnerPlayerId, reason }) => {
  // ...existing code...
  scene.scene.start('WinScene', {
    winnerName: winnerPlayerId
      ? (scene.allPlayers.find(p => p.playerId === winnerPlayerId)?.username || 'Nadie')
      : null,
    code: scene.code,
    players: scene.allPlayers,
    gameSettings: scene.gameSettings,
    mySocketId: scene.mySocketId,
    isDraw: reason === 'draw'
  });
});

// ——— Revelar cartas con LUMOS ————————————————————————
  socket.on('lumos-reveal', ({ cards }) => {
    // Aquí puedes mostrar un modal, toast, overlay, etc.
    // Ejemplo simple:
    alert(`Cartas del oponente:\n${cards.map(c => c.frame).join('\n')}`);
    // O mejor: scene.showLumosReveal(cards);
  });


// ——— Perder Apuesta —————————————————————————————
  socket.on('update-hand', ({ hand }) => {
    // Actualiza la mano del jugador local
    scene.setPlayerHand(hand);
    // Opcional: muestra un mensaje
    alert('¡Las manos han sido intercambiadas!');
  });

  // ——— 1PA1 sin camiseta —————————————————————————————
  socket.on('duel-start', () => {
    // Busca la carta más grande en la mano del jugador
    const hand = scene.getPlayerHand();
    // Suponiendo que las cartas numéricas tienen value y las especiales no participan
    const numericCards = hand.filter(c => !isNaN(Number(c.value)));
    if (numericCards.length === 0) return; // No tiene cartas numéricas
    const maxCard = numericCards.reduce((a, b) => Number(a.value) > Number(b.value) ? a : b);
    // Envía la carta al backend
    socket.emit('duel-card', { card: maxCard });
    // Opcional: muestra mensaje
    alert('¡Duelo! Has tirado tu carta más grande.');
  });
  socket.on('duel-lost', () => {
    alert('Has perdido el duelo y robas 2 cartas.');
  });
}
