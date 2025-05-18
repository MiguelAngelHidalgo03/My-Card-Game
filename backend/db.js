// backend/db.js
import supabase from './utils/supabaseClient.js'

/**
 * 1) Crear (o recuperar) partida.
 *    Usamos upsert sobre game_code y añadimos el nuevo campo current_player_id.
 */
async function createGame({ gameCode }) {
  const { data, error } = await supabase
    .from('games')
    .upsert(
      {
        game_code:         gameCode,
        game_status:       false,
        start_time:        null,
        end_time:          null,
        current_player_id: null
      },
      { onConflict: 'game_code' }
    )
    .select('game_id')
    .single();

  if (error) {
    console.error('Error creando partida en BBDD:', error);
    throw error;
  }
  console.log('🎲 Partida creada en BBDD, game_id =', data.game_id);
  return data.game_id;
}

/**
 * 2) Añadir o re-activar jugador.
 *    Si viene userId, hacemos upsert por (game_id, user_id).
 *    Si viene clientId en vez de userId, hacemos upsert por (game_id, client_id).
 */
async function addOrUpdatePlayer({ gameId, userId = null, clientId = null }) {
  const row = {
    game_id:   gameId,
    user_id:   userId,
    client_id: clientId,
    status:    true
  };

  // Elegimos la restricción única según si es usuario autenticado o invitado
  const conflictTarget = userId
    ? ['game_id','user_id']
    : ['game_id','client_id'];

  const { data, error } = await supabase
    .from('players')
    .upsert(row, { onConflict: conflictTarget })
    .select('player_id')
    .single();

  if (error) {
    console.error('Error añadiendo o reactivando jugador en BBDD:', error);
    throw error;
  }
  console.log(`👤 Jugador upsert en BBDD, player_id = ${data.player_id}`);
  return data.player_id;
}

/**
 * 2b) Marcar jugador activo/inactivo
 */
async function markPlayerActive({ playerId, active = true }) {
  const { error } = await supabase
    .from('players')
    .update({ status: active })
    .eq('player_id', playerId);
  if (error) throw error;
}

/**
 * 3) Marcar partida iniciada
 */
async function startGame({ gameCode }) {
  const { error } = await supabase
    .from('games')
    .update({
      game_status: true,
      start_time:  new Date().toISOString()
      // NOTA: current_player_id lo definirá la lógica de turnos en el frontend
    })
    .eq('game_code', gameCode);

  if (error) {
    console.error('Error marcando partida iniciada en BBDD:', error);
    throw error;
  }
  console.log('▶️ Partida STARTED en BBDD, game_code =', gameCode);
}

/**
 * 4) Finalizar partida
 */
// backend/db.js

async function finishGame({ gameCode, winnerPlayerId }) {
  // 1) Marca la partida como terminada
  const { error: err1 } = await supabase
    .from('games')
    .update({
      game_status:       false,
      end_time:          new Date().toISOString(),
      current_player_id: winnerPlayerId
    })
    .eq('game_code', gameCode);
  if (err1) throw err1;

  // 2) Recupera el game_id
  const { data: gameRow, error: err2 } = await supabase
    .from('games')
    .select('game_id')
    .eq('game_code', gameCode)
    .single();
  if (err2) throw err2;
  const gameId = gameRow.game_id;

  // 3) Recupera los jugadores de esa partida junto con su user_id
  const { data: players, error: err3 } = await supabase
    .from('players')
    .select('player_id, user_id')
    .eq('game_id', gameId);
  if (err3) throw err3;

  // 4) Para cada jugador: si tiene user_id, inserta partida jugada
  for (const { player_id, user_id } of players) {
    if (!user_id) continue;        // omite anónimos
    const { error: errPlay } = await supabase
      .from('results')
      .insert({
        player_id,
        game_id:   gameId,
        win_status: player_id === winnerPlayerId ? 'WIN' : 'LOSS'
      });
    if (errPlay) throw errPlay;

    // 5) Upsert en record: ganancias o derrotas
    const isWinner = player_id === winnerPlayerId;
    const { error: errRec } = await supabase
      .from('record')
      .upsert(
        {
          player_id,
          total_games: 1,
          wins:        isWinner ? 1 : 0,
          losses:      isWinner ? 0 : 1
        },
        { onConflict: 'player_id' }
      );
    if (errRec) throw errRec;
  }

  console.log(`📊 finishGame: registro actualizado para gameCode=${gameCode}`);
}

/**
 * 5) Cancelar partida sin ganador
 */
async function cancelGame({ gameCode }) {
  const { error } = await supabase
    .from('games')
    .update({
      game_status:       false,
      end_time:          new Date().toISOString(),
      current_player_id: null
    })
    .eq('game_code', gameCode);

  if (error) {
    console.error('Error cancelando partida en BBDD:', error);
    throw error;
  }
  console.log(`❌ Partida ${gameCode} cancelada (sin ganador)`);
}

export {
  createGame,
  addOrUpdatePlayer,
  markPlayerActive,
  startGame,
  finishGame,
  cancelGame,
  supabase
};
