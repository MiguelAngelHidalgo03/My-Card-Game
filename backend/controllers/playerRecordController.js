import supabase from '../utils/supabaseClient.js';

export const getPlayerRecordsByUser = async (req, res) => {
  const { user_id } = req.params;

  try {
    // 1. Buscar TODOS los player_id que corresponden al user_id
    const { data: players, error: playerError } = await supabase
      .from('players')
      .select('player_id')
      .eq('user_id', user_id);

    if (playerError || !players || players.length === 0) {
      return res.status(404).json({ error: 'Jugador no encontrado para este userId.' });
    }

    const playerIds = players.map(p => p.player_id);

    // 2. Obtener todos los records de esos player_id
    const { data: records, error: recordError } = await supabase
      .from('record')
      .select('total_games, wins, losses, player_id')
      .in('player_id', playerIds);

    if (recordError || !records || records.length === 0) {
      return res.status(404).json({ error: 'No se encontraron registros para este jugador.' });
    }

    // 3. Sumar los datos de todos los player_id de ese user_id
    const aggregated = records.reduce((acc, curr) => {
      acc.total_games += curr.total_games || 0;
      acc.wins += curr.wins || 0;
      acc.losses += curr.losses || 0;
      return acc;
    }, { total_games: 0, wins: 0, losses: 0 });

    return res.status(200).json({
      gamesPlayed: aggregated.total_games,
      wins: aggregated.wins,
      losses: aggregated.losses,
    });

  } catch (error) {
    console.error('Error interno:', error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
};