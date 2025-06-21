import supabase from '../utils/supabaseClient.js';

export const getPlayerRecordsByUser = async (req, res) => {
  const { user_id } = req.params;

  try {
    // 1. Obtener player_id asociado al user_id
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('player_id')
      .eq('user_id', user_id)
      .single();

    if (playerError || !player) {
      return res.status(404).json({ error: 'Jugador no encontrado para este userId.' });
    }

    const playerId = player.player_id;

    // 2. Obtener TODOS los registros asociados a ese player_id
    const { data: records, error: recordError } = await supabase
      .from('record')
      .select('total_games, wins, losses')
      .eq('player_id', playerId);

    if (recordError || !records || records.length === 0) {
      return res.status(404).json({ error: 'No se encontraron registros para este jugador.' });
    }

    // 3. Sumar las estadísticas de todos los registros
    const aggregated = records.reduce((acc, curr) => {
      acc.total_games += curr.total_games || 0;
      acc.wins += curr.wins || 0;
      acc.losses += curr.losses || 0;
      return acc;
    }, { total_games: 0, wins: 0, losses: 0 });

    // 4. Enviar la respuesta normalizada con los nombres que espera el frontend
    return res.status(200).json({
      gamesPlayed: aggregated.total_games,
      wins: aggregated.wins,
      losses: aggregated.losses,
    });
  } catch (error) {
    console.error('Error al obtener registros del jugador:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};
