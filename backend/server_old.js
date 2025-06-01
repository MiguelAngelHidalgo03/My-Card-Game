import dotenv from 'dotenv';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
// import { createDeck, shuffle } from './utils/deckFactory.js';
import userRoutes   from './routes/userRoutes.js';
import avatarRoutes from './routes/avatarRoutes.js';
import recordRoutes from './routes/recordRoutes.js';
import resetRoutes  from './routes/resetPassword.js';
import authRoutes   from './routes/userRoutes.js';
import { createDeck, shuffle } from './utils/deckFactory.js';
import {
  createGame,
  addOrUpdatePlayer,
  markPlayerActive,
  startGame     as dbStartGame,
  finishGame,
  cancelGame
} from './db.js';

dotenv.config();
const app  = express();
const port = process.env.PORT || 5000;

// ─── Middleware ─────────────────────────────────────────────────────────
app.use(cors({
  origin:      'http://localhost:3000',
  methods:     ['GET','POST','PUT','DELETE'],
  credentials: true,
}));
app.use(express.json());

// ─── API Routes ─────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api',       userRoutes, avatarRoutes);
app.use('/api',       recordRoutes);
app.use('/api',       resetRoutes);
app.get('/', (req, res) => res.send('¡Backend de 1pa1 está corriendo!'));

// ─── Estado en memoria ───────────────────────────────────────────────────
const rooms        = {}; // { [code]: { gameId, players:[], settings } }
const games        = {}; // { [code]: { gameId, players:[], settings } }
const hostTimeouts = {}; // grace-period timers for hosts
const GRACE_MS     = 2 * 60_000; // 2 minutos

// ─── API: reconexión / verificación ──────────────────────────────────────
// Lobby (antes de start)
app.get('/api/lobby/:code', (req, res) => {
  const room = rooms[req.params.code];
  if (!room) return res.status(404).json({ message: 'Lobby no encontrado' });
  return res.json({
    code:     req.params.code,
    players:  room.players,
    settings: room.settings
  });
});
// Partida en curso (después de start)
app.get('/api/game/:code', (req, res) => {
  const g = games[req.params.code];
  if (!g) return res.status(404).json({ message: 'Partida no encontrada' });
   return res.json({
    code:         req.params.code,
    players:      g.players,
    gameSettings: g.settings,
    drawPile:     g.drawPile,
    discardPile:  g.discardPile,
    hands:        g.hands,
    turnIndex:    g.turnIndex,
    isStarted:    true
  });
});

// ─── SOCKET.IO ────────────────────────────────────────────────────────────
const server = http.createServer(app);
const io     = new Server(server, { cors: { origin: 'http://localhost:3000' } });

io.on('connection', socket => {
  console.log(`── New connection: ${socket.id}`);

  // ── join-room ─────────────────────────────────────────────────────────
  socket.on('join-room', async (code, userId, clientId, username, avatar, isHost) => {
    console.log(`>>> join-room → code=${code}, isHost=${isHost}`);

    // 1) Si la partida ya arrancó: sólo reconexión
    if (games[code]) {
      const room = games[code];
      const ex   = room.players.find(p =>
        (userId   && p.userId===userId) ||
        (!userId  && p.clientId===clientId)
      );
      if (ex) {
        ex.socketId = socket.id;
        ex.status   = true;
        socket.join(code);
        socket.emit('reconnected-to-game', { code });
        socket.emit('reconnected');
        console.log(`→ Reconectado a partida ${code}`);
      } else {
        socket.emit('error', 'Partida ya en curso');
        console.log(`→ Join tardío rechazado para ${code}`);
      }
      return;
    }

    // 2) Crear lobby si no existe
    if (!rooms[code]) {
      try {
        const gameId = await createGame({ gameCode: code });
        rooms[code]  = { gameId, players: [], settings: null };
        console.log(`→ Lobby ${code} creado (gameId=${gameId})`);
      } catch (err) {
        console.error('→ Error creando lobby:', err);
        return socket.emit('error', 'No se pudo crear el lobby');
      }
    }
    const room = rooms[code];

    // 3) Duplicate join por mismo socket → ignorar
    if (room.players.some(p => p.socketId===socket.id)) {
      console.log(`→ Duplicate join ignored para socket ${socket.id}`);
      socket.join(code);
      // Emitimos lista actualizada
      io.to(code).emit('players-list', room.players);
      return;
    }

    // 4) Reactivar jugador existente (misma userId o clientId)
    const existing = room.players.find(p =>
      (userId   && p.userId===userId) ||
      (!userId  && p.clientId===clientId)
    );
    if (existing) {
      existing.socketId = socket.id;
      existing.isHost   = isHost;
      existing.status   = true;

      // Cancelamos grace-period si era host
      if (isHost && hostTimeouts[code]) {
        clearTimeout(hostTimeouts[code].timeout);
        clearInterval(hostTimeouts[code].interval);
        delete hostTimeouts[code];
        console.log(`→ Grace-period cancelado para host en ${code}`);
      }

      await markPlayerActive({ playerId: existing.playerId, active: true });
      socket.join(code);
      io.to(code).emit('players-list', room.players);
      // Si era host, avisamos a invitados
      if (isHost) socket.to(code).emit('host-returned');
      console.log(`→ Jugador reactivado en lobby ${code}`);
      return;
    }

    // 5) Límite de dos jugadores
    if (room.players.length >= 2) {
      console.log(`→ Lobby ${code} lleno, rechazando join`);
      return socket.emit('room-full');
    }

    // 6) Añadir nuevo jugador (upsert en BBDD)
    room.players = room.players.filter(p =>
      !((userId && p.userId===userId) || (!userId && p.clientId===clientId))
    );
    const playerId = await addOrUpdatePlayer({
      gameId:   room.gameId,
      userId,
      clientId
    });
    const newP = { username, userId, clientId, avatar,
                   socketId: socket.id, isHost, status: true, playerId };
    room.players.push(newP);
    room.players.sort((a,b)=> b.isHost - a.isHost);

    socket.join(code);
    io.to(code).emit('players-list', room.players);
    console.log(`→ Nuevo jugador en ${code}`, room.players);
  });

  // ── get-players ─────────────────────────────────────────────────────────
  socket.on('get-players', code => {
    if (rooms[code]) {
      socket.emit('players-list', rooms[code].players);
      console.log(`→ [get-players] Lista enviada para ${code}`);
    }
  });

  // ── update-settings ─────────────────────────────────────────────────────
  socket.on('update-settings', (code, settings) => {
    const room = rooms[code];
    if (!room) return;
    room.settings = settings;
    io.to(code).emit('settings-updated', settings);
    console.log(`→ [update-settings] ${code}`, settings);
  });

  // ── start-game ──────────────────────────────────────────────────────────
socket.on('start-game', async (code, settings) => {
  console.log(`[server] 🔄 start-game recibido de socket=${socket.id} con code=${code}, settings=`, settings);
 
  
  const room = rooms[code];
  // 1) Validación de lobby
  if (!room || room.players.length !== 2) {
    socket.emit('not-enough-players');
    console.log(`→ [start-game] ${code} no puede arrancar (jugadores insuf.)`);
    return;
  }

  // 2) Guardar settings en el lobby
  room.settings = settings;

  // 3) Persistir arranque en BD
  try {
    await dbStartGame({ gameCode: code });
  } catch (err) {
    console.error(`→ [start-game] Error al marcar inicio en BD para ${code}:`, err);
    return socket.emit('error', 'No se pudo iniciar la partida');
  }

  // 4) Generar y barajar baraja
  let deck = createDeck(settings.enableSpecialCards);
  shuffle(deck);

  // 5) Repartir manos iniciales
  const hands = {};
  const handSize = settings.initialHandSize;
  room.players.forEach(p => {
    hands[p.playerId] = deck.splice(0, handSize);
  });

  // 6) Carta inicial de descarte
  const discardPile = [ deck.shift() ];

  // 7) Índice de quién juega primero (host = 0)
  const turnIndex = 0;

  // 8) Mover lobby → partida en curso, con estado completo
  games[code] = {
    gameId:      room.gameId,
    players:     room.players,
    settings:    room.settings,
    drawPile:    deck,
    discardPile,
    hands,
    turnIndex
  };
  delete rooms[code];

  // 9) Emitir al canal de la sala el estado completo de la partida
  io.to(code).emit('game-started', {
    code,  
    players:      games[code].players,
    gameSettings: games[code].settings,
    drawPile:     games[code].drawPile,
    discardPile:  games[code].discardPile,
    hands:        games[code].hands,
    turnIndex:    games[code].turnIndex
  });

  console.log(`→ [start-game] ${code} convertido a partida con mazo barajado y reparto inicial`);
});

// ── chat-box ───────────────────────────────────────────────────────────
socket.on('chat-message', ({ code, username, text, avatar }) => {
  io.to(code).emit('chat-message', {
    username,
    text,
    avatar,
    timestamp: Date.now()
  });
});


  // ── end-game ────────────────────────────────────────────────────────────
socket.on('end-game', async ({ code, winnerPlayerId }) => {
  console.log(`→ [end-game] code=${code}, ganador=${winnerPlayerId}`);

  // 0) Capturamos el estado previo de games[code]
  const prev = games[code];
  if (prev) {
    rooms[code] = {
      gameId:   prev.gameId,
      players:  prev.players,
      settings: prev.settings
    };
  } else {
    console.warn(`→ [end-game] No existía games[${code}] para reconstruir el lobby`);
  }

  try {
    // 1) Guardamos el resultado en BD
    await finishGame({ gameCode: code, winnerPlayerId });

    // 2) Notificamos a todos los clientes que la partida terminó
    io.to(code).emit('game-ended', { winnerPlayerId });
    console.log(`→ [end-game] Partida ${code} finalizada`);
  } catch (err) {
    console.error('→ [end-game] Error en finishGame:', err);
    socket.emit('error', 'No se pudo finalizar la partida');
  } finally {
    // 3) Limpiamos el estado de la partida en memoria
    delete games[code];
  }
});
  

  // ── disconnect ──────────────────────────────────────────────────────────
  socket.on('disconnect', async () => {
    console.log(`→ [disconnect] ${socket.id}`);
    // 1) Lobbies pendientes
    for (const [code, room] of Object.entries(rooms)) {
      const idx = room.players.findIndex(p => p.socketId===socket.id);
      if (idx===-1) continue;
      const left = room.players[idx];
      await markPlayerActive({ playerId:left.playerId, active:false });

      if (left.isHost) {
        // Host salió antes de start → grace-period
        socket.to(code).emit('host-left');
        let rem = GRACE_MS/1000;
        const iv = setInterval(() => {
          rem--; console.log(`  [grace][${code}] ${rem}s`);
          if (rem<=0) clearInterval(iv);
        }, 1000);
        const to = setTimeout(async () => {
          await cancelGame({ gameCode: code });
          io.to(code).emit('game-ended',{ winnerPlayerId:null });
          delete rooms[code];
          clearInterval(iv);
        }, GRACE_MS);
        hostTimeouts[code] = { timeout:to, interval:iv };

      } else {
        // Invitado abandona el lobby
        room.players.splice(idx,1);
        io.to(code).emit('players-list', room.players);
      }
    }
    // 2) Partidas en curso
    for (const [code, room] of Object.entries(games)) {
      const idx = room.players.findIndex(p => p.socketId===socket.id);
      if (idx===-1) continue;
      const left = room.players[idx];
      await markPlayerActive({ playerId:left.playerId, active:false });
      room.players[idx].status = false;
      io.to(code).emit('players-list', room.players);
      console.log(`→ [disconnect] ${left.username} (${left.clientId}) se desconectó de ${code}`);
    }
  });
});

server.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
