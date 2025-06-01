// game/socketHandlers.js
export default function registerGameSocketHandlers(socket, gameService) {
  socket.on('join-room', (...args) => gameService.joinRoom(socket, ...args));
  socket.on('get-players', (code) => gameService.getPlayers(socket, code));
  socket.on('update-settings', (...args) => gameService.updateSettings(socket, ...args));
  socket.on('start-game', (...args) => gameService.startGame(socket, ...args));
  socket.on('chat-message', (payload) => gameService.chatMessage(socket, payload));
  socket.on('end-game', (payload) => gameService.endGame(socket, payload));
  socket.on('disconnect', () => gameService.handleDisconnect(socket));
  socket.on('card-played', payload => gameService.handlePlayCard(payload));
  socket.on('choose-color', payload => gameService.handleChooseColor(payload));
  socket.on('card-drawn', payload => {
    console.log('[SOCKET] card-drawn recibido', payload);
    gameService.handleDrawCard(payload);
  });
  socket.on('uno-pressed', ({ code, playerId }) => {
    gameService.handleUnoPressed({ code, playerId });
  });
  socket.on('set-where', (code, where) => gameService.setWhere(socket, code, where));
}
