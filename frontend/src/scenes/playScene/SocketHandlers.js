import socket from '../../utils/sockets';
// src/scenes/PlayScene/SocketHandlers.js
export default function registerSocketHandlers(scene, gameState) {
  const { localPlayer, remotePlayer } = scene;

  // Cuando te reconectas
  socket.on('reconnected', () => console.log('[PlayScene] reconnected'));

  // Cuando otro jugador se une o reconecta
  socket.on('player-joined', list => {
    scene.allPlayers = list;
    // actualizar GameState.players si hace falta…
  });

  // Cuando la partida termina
  socket.on('game-ended', ({ winnerPlayerId }) => {
    
    const winnerName = scene.allPlayers.find(p => p.playerId === winnerPlayerId)?.username || 'Nadie';
    scene.scene.start('WinScene', {
      winnerName,
      code:         scene.code,
      players:      scene.allPlayers,
      gameSettings: scene.gameSettings,
      mySocketId:   scene.mySocketId    // <— aquí, antes hacías socketId: …
    });
  });

  // Jugada del rival
  socket.on('card-played', ({ by, cardFrame }) => {
    if (by !== localPlayer.username) {
      gameState.playCard(by, /* índice desconocido */ 0);
      scene.updateHandsAndLayout();
    }
  });

  socket.on('card-drawn', ({ by, cardFrame }) => {
    if (by !== localPlayer.username) {
      gameState.drawCard(by);
      scene.updateHandsAndLayout();
    }
  });
}
