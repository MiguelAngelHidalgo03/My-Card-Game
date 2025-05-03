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

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// CORS
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

// JSON parser
app.use(express.json());

// Rutas API
app.use('/api', userRoutes, avatarRoutes);
app.use('/api', recordRoutes);
app.use('/api', resetPasswordRoutes);

// Rutas básicas
app.get('/', (req, res) => {
  res.send('¡Backend de 1pa1 está corriendo!');
});

// Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

// Middleware de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Error interno del servidor' });
});

// 🔁 Crear servidor HTTP
const server = http.createServer(app);

// 🎮 Crear servidor WebSocket
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// 🧠 Estructura de salas en memoria
const rooms = {}; // { 'ABC123': [ { username, avatar } ] }

io.on('connection', (socket) => {
  console.log('Jugador conectado:', socket.id);

  socket.on('join-room', (roomCode, username, avatar, isHost) => {
    if (!roomCode || !username || !avatar) return;

    if (!rooms[roomCode]) {
      rooms[roomCode] = [];
    }

    const playerExists = rooms[roomCode].some(player => player.username === username);
    if (playerExists) {
      console.log(`${username} ya está en la sala ${roomCode}`);
      return;
    }

    if (rooms[roomCode].length >= 2) {
      socket.emit('room-full');
      return;
    }

    // El primer jugador que se une es el host
    const newPlayer = { username, avatar, socketId: socket.id, isHost};
    rooms[roomCode].push(newPlayer);
    socket.join(roomCode);

    console.log(`${username} se unió a la sala ${roomCode}`);
    // Ordenar la lista para garantizar que el host esté primero
    rooms[roomCode].sort((a, b) => b.isHost - a.isHost);
    io.to(roomCode).emit('player-joined', rooms[roomCode]); // Enviar la lista completa de jugadores
  });

  socket.on('get-players', (roomCode) => {
    if (rooms[roomCode]) {
      socket.emit('players-list', rooms[roomCode]); // Enviar la lista completa de jugadores al cliente
    }
  });

  socket.on('start-game', (roomCode) => {
    if (rooms[roomCode] && rooms[roomCode].length === 2) {
      io.to(roomCode).emit('game-started');
      console.log(`La partida en sala ${roomCode} ha comenzado`);
    } else {
      socket.emit('not-enough-players');
    }
  });

  socket.on('disconnect', () => {
    console.log('Jugador desconectado:', socket.id);

    for (const roomCode in rooms) {
      rooms[roomCode] = rooms[roomCode].filter(player => player.socketId !== socket.id);

      if (rooms[roomCode].length === 0) {
        delete rooms[roomCode];
      }
    }

    console.log('Salas después de la desconexión:', rooms);
  });
});

// 🚀 Iniciar servidor
server.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
