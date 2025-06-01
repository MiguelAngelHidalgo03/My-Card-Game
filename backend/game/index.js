// game/index.js
import initGameService from './service.js';
import registerGameSocketHandlers from './socketHandlers.js';

/**
 * @param {import('socket.io').Server} io 
 */
export default function gameSocket(io) {
  const gameService = initGameService(io);
  io.on('connection', socket => {
    console.log(`── New connection: ${socket.id}`);
    registerGameSocketHandlers(socket, gameService);
  });
}
