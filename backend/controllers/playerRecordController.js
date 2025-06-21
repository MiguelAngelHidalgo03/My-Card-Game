import supabase from '../utils/supabaseClient.js';

export const getPlayerRecordsByUser = async (req, res) => {
  const { user_id } = req.params;

  try {
    // 1. Buscar el player que corresponde al user_id
    const { data: playerData, error: playerError } = await supabase
      .from('players')
      .select('player_id')
      .eq('user_id', user_id)
      .single();

    if (playerError || !playerData) {
      return res.status(404).json({ error: 'Jugador no encontrado para este userId.' });
    }

    const playerId = playerData.player_id;

    // 2. Obtener registros solo de ese player_id
    const { data: records, error: recordError } = await supabase
      .from('record')
      .select('total_games, wins, losses')
      .eq('player_id', playerId);

    if (recordError || !records || records.length === 0) {
      return res.status(404).json({ error: 'No se encontraron registros para este jugador.' });
    }

    // 3. Sumar los datos de ese jugador
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
