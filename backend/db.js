import supabase from './utils/supabaseClient.js'
// 1) Crear partida
// async function createGame({ gameCode }) {
//   const { data, error } = await supabase
//     .from('games')
//     .insert({
//       game_code:    gameCode,
//       game_status:  false,
//       start_time:   null,
//       end_time:     null,
//       turn:         null
//     })
//     .select('game_id')
//     .single()

//   if (error) 
//   {
//     console.error('Error creando partida en BBDD:', error);
//     throw error
//   } else 

  
//   console.log('🎲 Partida creada en BBDD, game_id =', data.game_id);
//   return data.game_id
// }

// 2) Añadir jugador (host o invitado)
// async function addPlayer({ gameId, userId = null, username, avatar, isHost }) {
//   const { data, error } = await supabase
//     .from('players')
//     .insert({
//       user_id: userId,        // si no hay sesión, deja null
//       game_id: gameId,
//       status:  true
//     })
//     .select('player_id')
//     .single()

//     if (error) {
//         console.error('Error añadiendo jugador en BBDD:', error);
//         throw error;
//       }
//       console.log(`👤 Jugador añadido en BBDD, player_id = ${data.player_id} (user_id = ${userId})`);
//   // opcional: también podrías insertar en player_cards aquí
//   return data.player_id
// }

// 3) Marcar partida iniciada
async function startGame({ gameCode }) {
  const { error } = await supabase
    .from('games')
    .update({
      game_status: true,
      start_time:  new Date().toISOString()
    })
    .eq('game_code', gameCode)

  if (error) throw error
}

// 4) Finalizar partida
async function finishGame({ gameCode, winnerPlayerId }) {
  // 4a) Actualizar tabla games
  let { error } = await supabase
    .from('games')
    .update({
      game_status: false,
      end_time:    new Date().toISOString(),
      turn:        winnerPlayerId
    })
    .eq('game_code', gameCode)

    if (error) {
        console.error('Error marcando partida iniciada:', error);
        throw error;
      }
      console.log('▶️ Partida marcada como iniciada en BBDD, game_code =', gameCode);

  // 4b) Insertar en results
  ;({ error } = await supabase
    .from('results')
    .insert({
      player_id:   winnerPlayerId,
      game_id:     (await supabase
                      .from('games')
                      .select('game_id')
                      .eq('game_code', gameCode)
                      .single()).data.game_id,
      win_status:  'WIN'
    }))

  if (error) throw error

  // 4c) Upsert en record
  ;({ error } = await supabase
    .from('record')
    .upsert({
      player_id:    winnerPlayerId,
      total_games:  1,
      wins:         1,
      losses:       0
    }, { onConflict: 'player_id' })
    .eq('player_id', winnerPlayerId))

  if (error) throw error
}


// backend/db.js
// ... tus imports y funciones existentes ...

// 5) Cancelar partida sin ganador
async function cancelGame({ gameCode }) {
    const { error } = await supabase
      .from('games')
      .update({
        game_status: false,
        end_time:    new Date().toISOString(),
        turn:        null
      })
      .eq('game_code', gameCode);
  
    if (error) throw error;
    console.log(`cancelGame: partida ${gameCode} marcada como finalizada sin ganador`);
  }
  
  async function createGame({ gameCode }) {
    const { data, error } = await supabase
      .from('games')
      .upsert(
        { game_code: gameCode, game_status: false, start_time: null, end_time: null, turn: null },
        { onConflict: 'game_code' }
      )
      .select('game_id')
      .single();
      if (error) 
        {
          console.error('Error creando partida en BBDD:', error);
          throw error
        } else 
      
        
        console.log('🎲 Partida creada en BBDD, game_id =', data.game_id);
        return data.game_id
  }
  
  // 2) Añadir jugador o recuperar existente (unique por game_id + user_id/username)
  async function addOrUpdatePlayer({ gameId, userId = null, username, avatar, isHost }) {
    // suponiendo que tienes un constraint UNIQUE (game_id, user_id) y otro para invitados por (game_id, username)
    const row = { game_id: gameId, user_id: userId, status: true };
    const { data, error } = await supabase
      .from('players')
      .upsert(row, { onConflict: ['game_id','user_id'] })
      .select('player_id')
      .single();
    if (error) throw error;
    return data.player_id;
  }
  
  // 2b) Marcar jugador activo/inactivo
  async function markPlayerActive({ playerId, active = true }) {
    const { error } = await supabase
      .from('players')
      .update({ status: active })
      .eq('player_id', playerId);
    if (error) throw error;
  }


  export {
    createGame,
    addOrUpdatePlayer,
    markPlayerActive,
    startGame,
    finishGame,
    cancelGame,   // <-- exportamos la nueva función
    supabase
  };
  
