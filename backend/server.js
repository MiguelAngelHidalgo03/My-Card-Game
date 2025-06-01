// server.js
import dotenv from 'dotenv';
import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';

import userRoutes   from './routes/userRoutes.js';
import avatarRoutes from './routes/avatarRoutes.js';
import recordRoutes from './routes/recordRoutes.js';
import resetRoutes  from './routes/resetPassword.js';
import authRoutes   from './routes/userRoutes.js';

import initGameService from './game/service.js';
import registerGameSocketHandlers from './game/socketHandlers.js';

dotenv.config();
const app  = express();
const port = process.env.PORT || 5000;

// — Middleware —
app.use(cors({
  origin:      'http://localhost:3000',
  methods:     ['GET','POST','PUT','DELETE'],
  credentials: true,
}));
app.use(express.json());

// — Rutas REST genéricas —
app.use('/api/auth', authRoutes);
app.use('/api',       userRoutes, avatarRoutes);
app.use('/api',       recordRoutes);
app.use('/api',       resetRoutes);

// — HTTP + WS —
const server = http.createServer(app);
const io     = new Server(server, { cors: { origin: 'http://localhost:3000' } });

// crea UNA sola instancia del service
const gameService = initGameService(io);

// monta el socket handler centralizado
io.on('connection', socket => {
  console.log(`── New WS connection: ${socket.id}`);
  registerGameSocketHandlers(socket, gameService);
});

// — RUTAS LOBBY / GAME (antes iban en el monolito) —
// GET /api/lobby/:code
app.get('/api/lobby/:code', (req, res) => {
  const lobby = gameService.getLobbyState(req.params.code);
  if (!lobby) return res.status(404).json({ message: 'Lobby no encontrado' });
  return res.json({
    code:     req.params.code,
    players:  lobby.players,
    settings: lobby.settings
  });
});

// GET /api/game/:code
app.get('/api/game/:code', (req, res) => {
  const g = gameService.getGameState(req.params.code);
  if (!g) return res.status(404).json({ message: 'Partida no encontrada' });
  return res.json({
    code:         req.params.code,
    players:      g.players,
    gameSettings: g.settings,
    drawPile:     g.drawPile,
    discardPile:  g.discardPile,
    hands:        g.hands,
    turnIndex:    g.turnIndex,
    currentPlayerId: g.currentPlayerId,
    chosenColor: g.chosenColor,
    isStarted:    true
  });
});

// arranca servidor
server.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
