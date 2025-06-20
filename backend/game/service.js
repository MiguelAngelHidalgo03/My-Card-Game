// game/service.js
import { createDeck, shuffle } from '../utils/deckFactory.js';
import {
    createGame,
    addOrUpdatePlayer,
    markPlayerActive,
    startGame as dbStartGame,
    finishGame,
    cancelGame,
    setCurrentPlayer
} from '../db.js';

/**
 * Inicializa el servicio de juego manteniendo el estado en memoria
 * y exponiendo métodos para cada evento de socket.
 */
export default function initGameService(io) {
    const rooms = {}; // { [code]: { gameId, players:[], settings } }
    const games = {}; // { [code]: { gameId, players:[], settings, drawPile, discardPile, hands, turnIndex } }
    const hostTimeouts = {}; // { [code]: { timeout, interval } }
    const GRACE_MS = 2 * 60_000; // 2 minutos

    return {
        handleUnoPressed,
        debugEmptyHand,
        // ── join-room ─────────────────────────────────────────────────────────
        async joinRoom(socket, code, userId, clientId, username, avatar, isHost) {
            console.log(`>>> join-room → code=${code}, isHost=${isHost}`);

            // 1) Si la partida ya arrancó: sólo reconexión

            if (games[code]) {
                const room = games[code];
                const ex = room.players.find(p =>
                    (userId && p.userId === userId) ||
                    (!userId && p.clientId === clientId)
                );
                if (ex) {
                    const wasDisconnected = !ex.status;
                    ex.socketId = socket.id;
                    ex.status = true;
                    socket.join(code);

                    const payload =
                    {
                        code,
                        players: room.players,
                        gameSettings: room.settings,
                        drawPile: room.drawPile,
                        discardPile: room.discardPile,
                        hands: room.hands,
                        turnIndex: room.turnIndex,
                        currentPlayerId: room.currentPlayerId,
                        chosenColor: room.chosenColor
                    };
                    socket.emit('game-started', payload);

                    if (wasDisconnected) {
                        socket.emit('reconnected');
                    }

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
                    rooms[code] = { gameId, players: [], settings: null };
                    console.log(`→ Lobby ${code} creado (gameId=${gameId})`);
                } catch (err) {
                    console.error('→ Error creando lobby:', err);
                    return socket.emit('error', 'No se pudo crear el lobby');
                }
            }
            const room = rooms[code];

            // 3) Duplicate join por mismo socket → ignorar
            if (room.players.some(p => p.socketId === socket.id)) {
                console.log(`→ Duplicate join ignored para socket ${socket.id}`);
                socket.join(code);
                io.to(code).emit('players-list', room.players);
                return;
            }
            // 4) Reactivar jugador existente (misma userId o clientId)
            const existing = room.players.find(p =>
                (userId && p.userId === userId) ||
                (!userId && p.clientId === clientId)
            );

            if (existing) {
                existing.socketId = socket.id;
                existing.isHost = isHost;
                existing.status = true;
                existing.where = 'lobby';

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
                !((userId && p.userId === userId) ||
                    (!userId && p.clientId === clientId))
            );
            const playerId = await addOrUpdatePlayer({
                gameId: room.gameId,
                userId,
                clientId
            });
            room.players.push({
                username, userId, clientId, avatar,
                socketId: socket.id, isHost, status: true, playerId,
                where: 'lobby' // <--- Añadido aquí
            });
            room.players.sort((a, b) => b.isHost - a.isHost);

            socket.join(code);
            io.to(code).emit('players-list', room.players);
            console.log(`→ Nuevo jugador en ${code}`, room.players);
        },


        getLobbyState(code) {
            return rooms[code] || null;
        },

        getGameState(code) {
            return games[code] || null;
        },


        // ── get-players ───────────────────────────────────────────────────────
        getPlayers(socket, code) {
            const room = rooms[code];
            if (!room) return;
            socket.emit('players-list', room.players);
            console.log(`→ [get-players] Lista enviada para ${code}`);
        },

        // ── update-settings ───────────────────────────────────────────────────
        updateSettings(socket, code, settings) {
            const room = rooms[code];
            if (!room) return;
            room.settings = settings;
            io.to(code).emit('settings-updated', settings);
            console.log(`→ [update-settings] ${code}`, settings);
        },

        // ── start-game ────────────────────────────────────────────────────────
        async startGame(socket, code, settings) {
            console.log(`[server] 🔄 start-game recibido socket=${socket.id} code=${code}`, settings);

            const room = rooms[code];
            // 1) Validación de lobby
            if (!room || room.players.length !== 2) {
                socket.emit('not-enough-players');
                console.log(`→ [start-game] ${code} no puede arrancar (insuf.)`);
                return;
            }
            // 2) Guardar settings en el lobby
            room.settings = settings;
            // 3) Persistir arranque en BD
            try {
                await dbStartGame({ gameCode: code });
            } catch (err) {
                console.error(`→ [start-game] Error en BD para ${code}:`, err);
                return socket.emit('error', 'No se pudo iniciar la partida');
            }
            // 4) Generar y barajar baraja
            let deck = createDeck(settings.enableSpecialCards);
            shuffle(deck);
            // 5) Repartir manos iniciales
            const hands = {};
            room.players.forEach(p => {
                hands[p.playerId] = deck.splice(0, settings.initialHandSize);
            });
            // 6) Carta inicial de descarte
            let firstDiscard;
            while (deck.length) {
                const card = deck.shift();
                if (card.frame !== 'cambia_color.svg' && card.frame !== 'mas4.svg') {
                    firstDiscard = card;
                    break;
                } else {
                    deck.push(card); // Devuelve la carta al final del mazo
                }
            }
            const discardPile = [firstDiscard];
            // 7) Turno inicial = host (índice 0)
            const turnIndex = Math.floor(Math.random() * room.players.length);
            const currentPlayerId = room.players[turnIndex].playerId;
            // 8) Mover lobby → partida en curso
            games[code] = {
                gameId: room.gameId,
                players: room.players,
                settings: room.settings,
                drawPile: deck,
                discardPile,
                hands,
                turnIndex,
                currentPlayerId,
                pendingPenalty: null
            };
            delete rooms[code];


            await setCurrentPlayer({ gameCode: code, playerId: currentPlayerId });

            const payload = {
                code,
                players: games[code].players,
                gameSettings: games[code].settings,
                drawPile: games[code].drawPile,
                discardPile: games[code].discardPile,
                hands: games[code].hands,
                turnIndex: games[code].turnIndex,
                currentPlayerId,
                pendingPenalty: games[code].pendingPenalty,
                chosenColor: games[code].chosenColor
            };
            console.log('[BACKEND] Emitiendo game-started:', payload); // <-- LOG AQUÍ

            // 9) Emitir estado a la sala
            io.to(code).emit('game-started', payload);
            console.log(`→ [start-game] ${code} partida iniciada`);
        },

        // ── chat-message ──────────────────────────────────────────────────────
        chatMessage(socket, { code, username, text, avatar }) {
            io.to(code).emit('chat-message', {
                username, text, avatar, timestamp: Date.now()
            });
        },

        // ── end-game ──────────────────────────────────────────────────────────
        async endGame(socket, { code, winnerPlayerId }) {
            console.log(`→ [end-game] code=${code}, ganador=${winnerPlayerId}`);
            const prev = games[code];
            if (prev) {
                rooms[code] = {
                    gameId: prev.gameId,
                    players: prev.players,
                    settings: prev.settings
                };
            } else {
                console.warn(`→ [end-game] no existía games[${code}]`);
            }
            try {
                await finishGame({ gameCode: code, winnerPlayerId });
                io.to(code).emit('game-ended', { winnerPlayerId });
                console.log(`→ [end-game] ${code} finalizada`);
            } catch (err) {
                console.error('→ [end-game] Error en finishGame:', err);
                socket.emit('error', 'No se pudo finalizar la partida');
            } finally {
                delete games[code];
            }
        },

        // ── disconnect ─────────────────────────────────────────────────────────
        async handleDisconnect(socket) {
            console.log(`→ [disconnect] ${socket.id}`);
            // 1) Lobbies pendientes
            for (const [code, room] of Object.entries(rooms)) {
                const idx = room.players.findIndex(p => p.socketId === socket.id);
                if (idx === -1) continue;
                const left = room.players[idx];
                await markPlayerActive({ playerId: left.playerId, active: false });

                if (left.isHost) {
                    socket.to(code).emit('host-left');
                    let rem = GRACE_MS / 1000;
                    const iv = setInterval(() => {
                        rem--; console.log(`  [grace][${code}] ${rem}s`);
                        if (rem <= 0) clearInterval(iv);
                    }, 1000);
                    const to = setTimeout(async () => {
                        await cancelGame({ gameCode: code });
                        io.to(code).emit('game-ended', { winnerPlayerId: null });
                        delete rooms[code];
                        clearInterval(iv);
                    }, GRACE_MS);
                    hostTimeouts[code] = { timeout: to, interval: iv };
                } else {
                    room.players[idx].status = false;
                    room.players[idx].where = null;
                    io.to(code).emit('players-list', room.players);
                }
            }

            // 2) Partidas en curso
            for (const [code, room] of Object.entries(games)) {
                const idx = room.players.findIndex(p => p.socketId === socket.id);
                if (idx === -1) continue;
                const left = room.players[idx];
                await markPlayerActive({ playerId: left.playerId, active: false });
                room.players[idx].status = false;
                io.to(code).emit('players-list', room.players);
                console.log(`→ [disconnect] ${left.username} desconectó de ${code}`);
            }
        },
        // backend/game/service.js (ejemplo)
        async handlePlayCard({ code, playerId, cardIndex }) {
            const game = games[code];

            if (!game) {
                console.warn(`[handlePlayCard] No existe la partida con código ${code}`);
                return;
            }
            if (game.currentPlayerId !== playerId) {
                console.warn(`[handlePlayCard] No es el turno del jugador ${playerId}`);
                return;
            }
            if (hostTimeouts[code]) {
                clearTimeout(hostTimeouts[code].timeout);
                clearInterval(hostTimeouts[code].interval);
                delete hostTimeouts[code];
                console.log(`→ Periodo de gracia cancelado por actividad en partida ${code}`);
            }
            const hand = game.hands[playerId];
            if (!hand || !hand[cardIndex]) {
                console.warn(`[handlePlayCard] Mano vacía o índice inválido para jugador ${playerId}`);
                return;
            }
            const card = hand[cardIndex];
            const topDiscard = game.discardPile[game.discardPile.length - 1];
            const cardType = parseCardFrame(card.frame).type;

            console.log(`[handlePlayCard] Jugador ${playerId} intenta jugar ${card.frame} (tipo: ${cardType})`);

            // --- STACKING +2/+4 ---
            if (game.pendingPenalty) {
                if (
                    (game.pendingPenalty.type === '+2' && cardType === '+2') ||
                    (game.pendingPenalty.type === '+4' && cardType === '+4')
                ) {
                    // --- STACKING ---
                    hand.splice(cardIndex, 1);
                    game.discardPile.push(card);
                    checkUnoAlert(game, playerId, code);
                    // ...después de modificar las manos y antes de emitir el nuevo estado...
                    if (await checkForWinner(game, code)) return;
                    if (cardType === '+2') {
                        game.pendingPenalty = { type: '+2', amount: 2, playerId };
                    }
                    if (cardType === '+4') {
                        game.pendingPenalty = { type: '+4', amount: 4, playerId };
                    }
                    // Suma la penalización
                    game.pendingPenalty.amount += (cardType === '+2') ? 2 : 4;
                    game.pendingPenalty.playerId = playerId;

                    console.log(`[handlePlayCard] STACKING: ${cardType} jugado, penalización acumulada: ${game.pendingPenalty.amount}`);

                    io.to(code).emit('card-played', {
                        by: game.players.find(p => p.playerId === playerId).username,
                        cardFrame: card.frame,
                        cardIndex
                    });

                    // Si es +4, pide color antes de pasar turno
                    if (cardType === '+4') {
                        const player = game.players.find(p => p.playerId === playerId);
                        if (player && player.socketId) {
                            io.to(player.socketId).emit('choose-color-request', { code });
                            console.log(`[handlePlayCard] STACKING: Solicitud de color (stack) enviada a ${player.username} (${player.playerId})`);
                        }
                        return;
                    }


                    // Cambia turno
                    const playerIds = game.players.map(p => p.playerId);
                    const nextPlayerId = playerIds.find(id => id !== playerId);
                    game.currentPlayerId = nextPlayerId;
                    await setCurrentPlayer({ gameCode: code, playerId: nextPlayerId });
                    console.log(`[handlePlayCard] STACKING: Turno de ${nextPlayerId}`);
                    io.to(code).emit('game-state', {
                        ...game,
                        currentPlayerId: nextPlayerId,
                        pendingPenalty: game.pendingPenalty,
                        chosenColor: game.chosenColor ?? null,
                    });
                    return;
                } else {
                    // --- NO STACKING: aplica penalización antes de jugar carta normal ---
                    console.log(`[handlePlayCard] NO STACKING: aplicando penalización de ${game.pendingPenalty.amount} cartas a ${playerId}`);
                    for (let i = 0; i < game.pendingPenalty.amount; i++) {
                        refillDrawPileIfNeeded(game);
                        const drawn = game.drawPile.shift();
                        if (drawn) hand.push(drawn);
                    }
                    game.pendingPenalty = null;
                    // Ahora sigue con la jugada normal (verifica si la carta es jugable)
                    if (!isCardPlayable(card, topDiscard, game.chosenColor)) {
                        console.warn(`[handlePlayCard] Jugada inválida durante penalización: ${card.frame} sobre ${topDiscard.frame}`);
                        return;
                    }
                    // --- Si la carta es un bloqueo, turno vuelve al jugador ---
                    if (cardType === 'skip') {
                        hand.splice(cardIndex, 1);
                        game.discardPile.push(card);
                        checkUnoAlert(game, playerId, code);
                        // ...después de modificar las manos y antes de emitir el nuevo estado...
                        if (await checkForWinner(game, code)) return;
                        io.to(code).emit('card-played', {
                            by: game.players.find(p => p.playerId === playerId).username,
                            cardFrame: card.frame,
                            cardIndex
                        });

                        // Turno vuelve al jugador (como en el flujo normal de skip)
                        game.currentPlayerId = playerId;
                        await setCurrentPlayer({ gameCode: code, playerId });
                        console.log(`[handlePlayCard] NO STACKING: Bloqueo jugado, turno vuelve a ${playerId}`);
                        io.to(code).emit('game-state', {
                            ...game,
                            currentPlayerId: playerId,
                            pendingPenalty: game.pendingPenalty,
                            chosenColor: game.chosenColor ?? null
                        });
                        return;
                    }
                    hand.splice(cardIndex, 1);
                    game.discardPile.push(card);
                    checkUnoAlert(game, playerId, code);
                    // ...después de modificar las manos y antes de emitir el nuevo estado...
                    if (await checkForWinner(game, code)) return;

                    if (cardType === '+2') {
                        game.pendingPenalty = { type: '+2', amount: 2, playerId };
                    }
                    if (cardType === '+4') {
                        game.pendingPenalty = { type: '+4', amount: 4, playerId };
                    }
                    io.to(code).emit('card-played', {
                        by: game.players.find(p => p.playerId === playerId).username,
                        cardFrame: card.frame,
                        cardIndex
                    });

                    // Si es +4 o wild, pide color antes de pasar turno
                    if (cardType === '+4' || cardType === 'wild') {
                        const player = game.players.find(p => p.playerId === playerId);
                        if (player && player.socketId) {
                            io.to(player.socketId).emit('choose-color-request', { code });
                            console.log(`[handlePlayCard] NO STACKING: Solicitud de color enviada a ${player.username} (${player.playerId})`);
                        }
                        return;
                    }

                    // Cambia turno
                    const playerIds = game.players.map(p => p.playerId);
                    const nextPlayerId = playerIds.find(id => id !== playerId);
                    game.currentPlayerId = nextPlayerId;
                    await setCurrentPlayer({ gameCode: code, playerId: nextPlayerId });
                    if (cardType !== 'wild' && cardType !== '+4') {
                        game.chosenColor = null;
                    }
                    console.log(`[handlePlayCard] NO STACKING: Penalización aplicada y carta normal jugada, turno de ${nextPlayerId}`);
                    io.to(code).emit('game-state', {
                        ...game,
                        currentPlayerId: nextPlayerId,
                        pendingPenalty: game.pendingPenalty,
                        chosenColor: game.chosenColor ?? null
                    });
                    return;
                }
            }
            // --- Si no hay penalización pendiente ---
            // Si juega +2, +4 o wild, gestiona especial
            if (cardType === '+2' || cardType === '+4' || cardType === 'wild') {
                hand.splice(cardIndex, 1);
                game.discardPile.push(card);
                checkUnoAlert(game, playerId, code);
                // ...después de modificar las manos y antes de emitir el nuevo estado...
                if (await checkForWinner(game, code)) return;

                if (cardType === '+2') {
                    game.pendingPenalty = { type: '+2', amount: 2, playerId };
                }
                if (cardType === '+4') {
                    game.pendingPenalty = { type: '+4', amount: 4, playerId };
                }

                io.to(code).emit('card-played', {
                    by: game.players.find(p => p.playerId === playerId).username,
                    cardFrame: card.frame,
                    cardIndex
                });

                // Si es +4 o wild, pide color
                if (cardType === '+4' || cardType === 'wild') {
                    const player = game.players.find(p => p.playerId === playerId);
                    if (player && player.socketId) {
                        io.to(player.socketId).emit('choose-color-request', { code });
                        console.log(`[handlePlayCard] Solicitud de color enviada a ${player.username} (${player.playerId})`);
                    }
                    return;
                }

                // Cambia turno solo para +2
                if (cardType === '+2') {
                    const playerIds = game.players.map(p => p.playerId);
                    const nextPlayerId = playerIds.find(id => id !== playerId);
                    game.currentPlayerId = nextPlayerId;
                    await setCurrentPlayer({ gameCode: code, playerId: nextPlayerId });
                    console.log(`[handlePlayCard] +2 jugado, turno de ${nextPlayerId}`);
                    io.to(code).emit('game-state', {
                        ...game,
                        currentPlayerId: nextPlayerId,
                        pendingPenalty: game.pendingPenalty,
                        chosenColor: game.chosenColor ?? null
                    });
                }
                return;
            }

            // --- SKIP/BLOQUEO ---
            if (await handleSkip(game, hand, card, cardType, playerId, code)) {
                console.log(`[handlePlayCard] Skip jugado por ${playerId}`);
                return;
            }

            // --- Carta normal ---
            if (!isCardPlayable(card, topDiscard, game.chosenColor)) {
                console.warn(`[handlePlayCard] Jugada inválida: ${card.frame} sobre ${topDiscard.frame}`);
                return;
            }
            hand.splice(cardIndex, 1);
            game.discardPile.push(card);
            checkUnoAlert(game, playerId, code);
            // ...después de modificar las manos y antes de emitir el nuevo estado...
            if (await checkForWinner(game, code)) return;

            io.to(code).emit('card-played', {
                by: game.players.find(p => p.playerId === playerId).username,
                cardFrame: card.frame,
                cardIndex
            });

            if (cardType === '+4' || cardType === 'wild') {
                const player = game.players.find(p => p.playerId === playerId);
                if (player && player.socketId) {
                    io.to(player.socketId).emit('choose-color-request', { code });
                    console.log(`[handlePlayCard] Solicitud de color enviada a ${player.username} (${player.playerId})`);
                }
                return;
            }

            // Cambia turno
            const playerIds = game.players.map(p => p.playerId);
            const nextPlayerId = playerIds.find(id => id !== playerId);
            game.currentPlayerId = nextPlayerId;
            await setCurrentPlayer({ gameCode: code, playerId: nextPlayerId });
            if (cardType !== 'wild' && cardType !== '+4') {
                game.chosenColor = null;
            }
            console.log(`[handlePlayCard] Carta normal jugada, turno de ${nextPlayerId}`);
            io.to(code).emit('game-state', {
                ...game,
                currentPlayerId: nextPlayerId,
                pendingPenalty: game.pendingPenalty,
                chosenColor: game.chosenColor ?? null
            });
        },

        async handleDrawCard({ code, playerId }) {
            const game = games[code];
            if (!game) return;
            if (game.currentPlayerId !== playerId) return;
            if (hostTimeouts[code]) {
                clearTimeout(hostTimeouts[code].timeout);
                clearInterval(hostTimeouts[code].interval);
                delete hostTimeouts[code];
                console.log(`→ Periodo de gracia cancelado por actividad en partida ${code}`);
            }
            const hand = game.hands[playerId];
            const topDiscard = game.discardPile[game.discardPile.length - 1];
            const hasPlayable = hand.some(card => isCardPlayable(card, topDiscard, game.chosenColor));
            if (hasPlayable) {
                // Emitir error: tienes cartas jugables
                const player = game.players.find(p => p.playerId === playerId);
                if (player && player.socketId) {
                    io.to(player.socketId).emit('draw-error', { reason: 'Tienes cartas jugables' });
                }
                return;
            }

            // Si hay penalización pendiente, primero añade penalización, luego roba carta normal
            if (game.pendingPenalty) {
                for (let i = 0; i < game.pendingPenalty.amount; i++) {
                    refillDrawPileIfNeeded(game);
                    const drawn = game.drawPile.shift();
                    if (drawn) game.hands[playerId].push(drawn);
                }
                game.pendingPenalty = null;

                // Ahora roba la carta normal del turno
                refillDrawPileIfNeeded(game);
                const drawnCard = game.drawPile.shift();
                if (drawnCard) game.hands[playerId].push(drawnCard);

                io.to(code).emit('card-drawn', {
                    by: game.players.find(p => p.playerId === playerId).username,
                    cardFrame: drawnCard ? drawnCard.frame : null
                });

                io.to(code).emit('game-state', {
                    ...game,
                    currentPlayerId: game.currentPlayerId,
                    pendingPenalty: game.pendingPenalty,
                    chosenColor: game.chosenColor ?? null
                });
                return;
            }

            // Roba solo UNA carta normal
            refillDrawPileIfNeeded(game);
            if (!Array.isArray(game.drawPile)) {
                console.error('[BACKEND] drawPile es undefined o no es un array:', game.drawPile, 'game:', game);
                return;
            }
            const drawnCard = game.drawPile.shift();
            game.hands[playerId].push(drawnCard);


            if (!drawnCard) {
                console.log('[BACKEND] drawPile vacío, no se puede robar');
                game.consecutivePasses = (game.consecutivePasses || 0) + 1;
                if (game.consecutivePasses >= 5) {
                    io.to(code).emit('game-ended', { winnerPlayerId: null, reason: 'draw' });
                    delete games[code];
                    return;
                }
                // Cambia turno al siguiente jugador
                const playerIds = game.players.map(p => p.playerId);
                const nextPlayerId = playerIds.find(id => id !== playerId);
                game.currentPlayerId = nextPlayerId;
                await setCurrentPlayer({ gameCode: code, playerId: nextPlayerId });
                io.to(code).emit('game-state', {
                    ...game,
                    currentPlayerId: nextPlayerId,
                    pendingPenalty: game.pendingPenalty,
                    chosenColor: game.chosenColor ?? null
                });
                return;
            }

            game.consecutivePasses = 0;

            io.to(code).emit('card-drawn', {
                by: game.players.find(p => p.playerId === playerId).username,
                cardFrame: drawnCard.frame
            });

            io.to(code).emit('game-state', {
                ...game,
                currentPlayerId: game.currentPlayerId,
                pendingPenalty: game.pendingPenalty,
                chosenColor: game.chosenColor ?? null
            });
        },

        // justo después de handleDrawCard(...)
        async handleChooseColor({ code, color }) {
            const game = games[code];
            if (!game) return;
            game.chosenColor = color;
            console.log(`[BACKEND] Color seleccionado: ${color}`);
            if (hostTimeouts[code]) {
                clearTimeout(hostTimeouts[code].timeout);
                clearInterval(hostTimeouts[code].interval);
                delete hostTimeouts[code];
                console.log(`→ Periodo de gracia cancelado por actividad en partida ${code}`);
            }
            // Guarda el username del que eligió el color
            const chooser = game.players.find(p => p.playerId === game.currentPlayerId)?.username;

            // calcula siguiente jugador
            const next = game.players
                .map(p => p.playerId)
                .find(id => id !== game.currentPlayerId);
            game.currentPlayerId = next;
            await setCurrentPlayer({ gameCode: code, playerId: next });
            console.log('[BACKEND] handleChooseColor: chosenColor', color, 'currentPlayerId', game.currentPlayerId);
            // emite estado completo con chosenColor y lastColorChooser
            io.to(code).emit('game-state', {
                ...game,
                chosenColor: color ?? null,
                currentPlayerId: next,
                lastColorChooser: chooser,
                pendingPenalty: game.pendingPenalty
            });
            if (game._unoPendingAfterColor) {
                const { playerId, code: unoCode } = game._unoPendingAfterColor;
                checkUnoAlert(game, playerId, unoCode, true); // fuerza el uno-alert
                game._unoPendingAfterColor = null;
            }
        },
        setWhere(socket, code, where) {
            const room = rooms[code];
            if (!room) return;
            const player = room.players.find(p => p.socketId === socket.id);
            if (player) {
                player.where = where;
                io.to(code).emit('players-list', room.players);
            }
        }

    };




    // FUNCIONES AUXILIARES





    async function handleUnoPressed({ code, playerId }) {
        const game = games[code];
        if (!game || !game.unoPending || game.unoPending.resolved) {
            console.log(`[UNO][BACKEND] uno-pressed ignorado: game o unoPending no válido`);
            return;
        }

        // Solo cuenta el primero
        game.unoPending.resolved = true;
        game.unoPending.winner = playerId;

        const unoPlayer = game.unoPending.playerId;
        let penalized = null;

        if (playerId === unoPlayer) {

            penalized = null;
            console.log(`[UNO][BACKEND] El jugador con una carta (${playerId}) pulsó UNO primero. No hay penalización.`);

        } else {
            // El rival fue más rápido, penaliza al jugador con una carta
            penalized = unoPlayer;
            console.log(`[UNO][BACKEND] El rival (${playerId}) pulsó UNO antes. Penalizando a ${unoPlayer} con +2 cartas.`);

            // Añade 2 cartas de penalización
            for (let i = 0; i < 2; i++) {
                refillDrawPileIfNeeded(game);
                const drawn = game.drawPile.shift();
                if (drawn) game.hands[unoPlayer].push(drawn);
            }
        }

        io.to(code).emit('uno-resolved', {
            winner: playerId,
            penalized,
            unoPlayer
        });

        // Limpia el estado
        setTimeout(() => {
            if (game.unoPending && game.unoPending.resolved) {
                game.unoPending = null;
                console.log(`[UNO][BACKEND] unoPending limpiado para partida ${code}`);

            }
        }, 2000);
    }

    async function handleSkip(game, hand, card, cardType, playerId, code) {
        if (!isSkipCard(card)) return false;

        // Quita la carta de la mano y la pone en el descarte
        hand.splice(hand.indexOf(card), 1);
        game.discardPile.push(card);
        // ...después de modificar las manos y antes de emitir el nuevo estado...
        if (await checkForWinner(game, code)) return;

        io.to(code).emit('card-played', {
            by: game.players.find(p => p.playerId === playerId).username,
            cardFrame: card.frame,
            cardIndex: null
        });

        // En 2 jugadores, el turno vuelve al jugador actual (salta el rival)
        game.currentPlayerId = playerId;
        await setCurrentPlayer({ gameCode: code, playerId });
        io.to(code).emit('game-state', {
            ...game,
            currentPlayerId: playerId,
            pendingPenalty: game.pendingPenalty,
            chosenColor: game.chosenColor ?? null
        });
        return true;
    }
    function refillDrawPileIfNeeded(game, threshold = 4) {
        if (!Array.isArray(game.drawPile)) {
            console.error('[BACKEND] refillDrawPileIfNeeded: drawPile no es array', game.drawPile);
            game.drawPile = [];
        }
        if (game.drawPile.length < threshold && game.discardPile.length > 1) {
            const last = game.discardPile.pop();
            game.drawPile = shuffle([...game.discardPile]);
            game.discardPile = [last];
        }
    }
    function isSkipCard(card) {
        const parsed = parseCardFrame(card.frame);
        return parsed.value === 'Bloqueo' || parsed.value === 'Skip';
    }
    function parseCardFrame(frame) {
        if (frame === 'cambia_color.svg') return { type: 'wild' };
        if (frame === 'mas4.svg') return { type: '+4' };
        const match = frame.match(/^([A-Za-z]+)_([A-Za-z0-9]+)\.svg$/);
        if (match) {
            const color = match[1];
            const value = match[2];
            if (value === 'mas2') return { color, type: '+2', value };
            if (value === 'Bloqueo' || value === 'Skip') return { color, type: 'skip', value };
            return { color, value };
        }
        return {};
    }

    function isCardPlayable(card, topDiscard, chosenColor) {
        if (!card) return false;
        if (!topDiscard) return false;
        const c = parseCardFrame(card.frame);
        const t = parseCardFrame(topDiscard.frame);
        if (c.type === 'wild' || c.type === '+4') return true;

        let topColor = t.color;
        if ((t.type === 'wild' || t.type === '+4') && chosenColor) {
            topColor = chosenColor;
        }
        // Normaliza a minúsculas
        const cardColor = (c.color || '').toLowerCase();
        const compareColor = (topColor || '').toLowerCase();
        return cardColor === compareColor || c.value === t.value;
    }
    function checkUnoAlert(game, playerId, code, force = false) {
        const hand = game.hands[playerId];
        if (hand.length === 1 && !game.unoPending) {
            // Si no es force y la última carta jugada es wild/+4, no mostrar aún
            const lastCard = game.discardPile[game.discardPile.length - 1];
            const type = lastCard && parseCardFrame(lastCard.frame).type;
            if (!force && (type === 'wild' || type === '+4')) {
                // Marca que hay un uno pendiente tras elegir color
                game._unoPendingAfterColor = { playerId, code };
                return;
            }
            // Si es force o no es wild/+4, muestra el botón UNO
            const unoPositions = ['right-discard', 'left-discard', 'above-hand'];
            const unoPosition = unoPositions[Math.floor(Math.random() * unoPositions.length)];
            game.unoPending = {
                playerId,
                timestamp: Date.now(),
                position: unoPosition,
                resolved: false,
                winner: null
            };
            console.log(`[UNO][BACKEND] Jugador ${playerId} se queda con una carta. Enviando uno-alert en posición: ${unoPosition}`);
            io.to(code).emit('uno-alert', {
                playerId,
                position: unoPosition
            });
        }
    }
    function debugEmptyHand({ code, playerId }) {
        const game = games[code];
        if (!game) return;
        if (game.currentPlayerId !== playerId) return;
        game.hands[playerId] = [];
        checkForWinner(game, code);
        io.to(code).emit('hand-updated', { playerId, hand: [] });
    }
    async function checkForWinner(game, code) {
        const winner = Object.entries(game.hands).find(([playerId, hand]) => hand.length === 0);
        if (winner) {
            const winnerPlayerId = winner[0];
            try {
                await finishGame({ gameCode: code, winnerPlayerId });
            } catch (err) {
                console.error('Error en finishGame:', err);
            }
            io.to(code).emit('game-ended', { winnerPlayerId });

            // RECONSTRUYE EL LOBBY para permitir nueva partida
            rooms[code] = {
                gameId: game.gameId,
                players: game.players,
                settings: game.settings
            };

            delete games[code];
            return true;
        }
        return false;
    }

}
