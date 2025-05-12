// server.js
import dotenv from 'dotenv';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

import userRoutes from './routes/userRoutes.js';
import avatarRoutes from './routes/avatarRoutes.js';
import recordRoutes from './routes/recordRoutes.js';
import resetPasswordRoutes from './routes/resetPassword.js';
import authRoutes from './routes/userRoutes.js';

import {
  createGame,
  addOrUpdatePlayer,
  markPlayerActive,
  startGame as dbStartGame,
  finishGame,
  cancelGame
} from './db.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// ─── MIDDLEWARE ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET','POST','PUT','DELETE'],
  credentials: true,
}));
app.use(express.json());

// ─── RUTAS API ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api', userRoutes, avatarRoutes);
app.use('/api', recordRoutes);
app.use('/api', resetPasswordRoutes);

app.get('/', (req, res) => {
  res.send('¡Backend de 1pa1 está corriendo!');
});

// ─── SERVIDOR + SOCKET.IO ─────────────────────────────────────────────────────
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: 'http://localhost:3000', methods: ['GET','POST'] }
});

/**
 * rooms en memoria:
 * {
 *   [roomCode]: {
 *     gameId,            // UUID de games.game_id
 *     players: [         // lista de jugadores con estado
 *       { username, userId, avatar, socketId, isHost, playerId, status }
 *     ],
 *     settings           // gameSettings
 *   }
 * }
 */
const rooms = {};

io.on('connection', socket => {
  console.log('Jugador conectado:', socket.id);

  // ── UNIRSE A SALA ─────────────────────────────────────────────────
  socket.on('join-room', async (roomCode, userId, username, avatar, isHost) => {
    console.log(`JOIN-ROOM → code=${roomCode}, userId=${userId}, username=${username}, isHost=${isHost}`);

    if (!roomCode || !username || !avatar) return;

    // 1) Crear o recuperar la sala en memoria y en BBDD
    if (!rooms[roomCode]) {
      try {
        const gameId = await createGame({ gameCode: roomCode });
        rooms[roomCode] = { gameId, players: [], settings: null };
        console.log(`🎲 Sala inicializada en BBDD → gameId=${gameId}`);
      } catch (err) {
        console.error('Error creando partida en BBDD:', err);
        return socket.emit('error', 'No se pudo crear la partida');
      }
    }
    const room = rooms[roomCode];

    // 2) Ignorar re-joins del mismo socket
    if (room.players.some(p => p.socketId === socket.id)) {
      console.log(`Join-room duplicado, socket ${socket.id}, lo ignoramos.`);
      return;
    }

    // 3) Si ya hay un jugador con ese userId (o username si no hay sesión), lo reactivamos
    let existing = room.players.find(p =>
      (userId && p.userId === userId) || (!userId && p.username === username)
    );
    if (existing) {
      existing.socketId = socket.id;
      existing.isHost   = isHost;
      existing.status   = true;
      try {
        await markPlayerActive({ playerId: existing.playerId, active: true });
        console.log(`🔄 Reactivado jugador ${existing.username} (playerId=${existing.playerId})`);
      } catch (e) {
        console.error('Error reactivando jugador en BBDD:', e);
      }
      socket.join(roomCode);
      return io.to(roomCode).emit('player-joined', room.players);
    }

    // 4) Límite de 2 jugadores
    if (room.players.length >= 2) {
      console.log(`🚫 Sala ${roomCode} llena, ${username} no puede unirse.`);
      return socket.emit('room-full');
    }

    // 5) Añadir nuevo jugador en BBDD
    let playerId;
    try {
      playerId = await addOrUpdatePlayer({
        gameId:   room.gameId,
        userId,
        username
      });
      console.log(`👤 Jugador añadido en BBDD → playerId=${playerId}`);
    } catch (err) {
      console.error('Error añadiendo jugador en BBDD:', err);
      return socket.emit('error', 'No se pudo añadir el jugador');
    }

    // 6) Añadir en memoria y emitir
    const newPlayer = {
      username, userId, avatar,
      socketId: socket.id,
      isHost, status: true,
      playerId
    };
    room.players.push(newPlayer);
    room.players.sort((a,b) => b.isHost - a.isHost);

    socket.join(roomCode);
    io.to(roomCode).emit('player-joined', room.players);
    console.log('Jugadores en sala tras unión:', room.players);
  });

  // ── PEDIR LISTA DE JUGADORES ───────────────────────────────────────
  socket.on('get-players', roomCode => {
    const room = rooms[roomCode];
    if (room) socket.emit('players-list', room.players);
  });

  // ── ACTUALIZAR AJUSTES (HOST) ────────────────────────────────────
  socket.on('update-settings', (roomCode, newSettings) => {
    const room = rooms[roomCode];
    if (!room) return;
    room.settings = newSettings;
    io.to(roomCode).emit('settings-updated', newSettings);
  });

  // ── INICIAR PARTIDA ─────────────────────────────────────────────
  socket.on('start-game', async (roomCode, passedSettings) => {
    const room = rooms[roomCode];
    if (!room || room.players.length !== 2) {
      return socket.emit('not-enough-players');
    }
    const gameSettings = passedSettings ?? room.settings;
    room.settings = gameSettings;

    console.log('Configuración de juego:', gameSettings);
    console.log('Jugadores en sala:', room.players);

    try {
      await dbStartGame({ gameCode: roomCode });
      console.log(`✅ Partida ${roomCode} marcada como STARTED en BBDD`);
    } catch (e) {
      console.error('Error marcando partida iniciada en BBDD:', e);
      return socket.emit('error', 'No se pudo arrancar la partida');
    }

    io.to(roomCode).emit('game-started', {
      settings: gameSettings,
      players:  room.players
    });
  });

  // ── FINALIZAR PARTIDA ───────────────────────────────────────────
  socket.on('end-game', async ({ roomCode, winnerPlayerId }) => {
    console.log(`🏁 Finalizando partida ${roomCode}, ganador=${winnerPlayerId}`);
    try {
      await finishGame({ gameCode: roomCode, winnerPlayerId });
      console.log(`🎉 Partida ${roomCode} finalizada y resultado registrado`);
      io.to(roomCode).emit('game-ended', { winnerPlayerId });
    } catch (e) {
      console.error('Error al finalizar partida en BBDD:', e);
      socket.emit('error', 'No se pudo finalizar la partida');
    }
  });

  // ── DESCONEXIÓN ─────────────────────────────────────────────────
  socket.on('disconnect', async () => {
    console.log('Jugador desconectado:', socket.id);
    for (const [roomCode, room] of Object.entries(rooms)) {
      // 1) Marcar ese jugador inactivo
      const idx = room.players.findIndex(p => p.socketId === socket.id);
      if (idx !== -1) {
        const left = room.players[idx];
        room.players[idx].status = false;
        try {
          await markPlayerActive({ playerId: left.playerId, active: false });
          console.log(`❌ Jugador ${left.username} marcado como INACTIVO en BBDD`);
        } catch (e) {
          console.error('Error marcando jugador inactivo en BBDD:', e);
        }
      }
      // 2) Si **todos** están inactivos, cancelar la partida
      if (room.players.every(p => !p.status)) {
        console.log(`👋 Todos fuera de ${roomCode}, cancelando partida…`);
        try {
          await cancelGame({ gameCode: roomCode });
          console.log(`❌ Partida ${roomCode} cancelada en BBDD`);
          io.to(roomCode).emit('game-ended', { winnerPlayerId: null });
        } catch (e) {
          console.error('Error cancelando partida en BBDD:', e);
        }
        delete rooms[roomCode];
      }
    }
    console.log('Salas activas:', rooms);
  });
});

server.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
