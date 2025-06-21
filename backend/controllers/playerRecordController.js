import supabase from '../utils/supabaseClient.js';

export const getPlayerRecordsByUser = async (req, res) => {
  const { user_id } = req.params;

  try {
    // Traer todos los records vinculados al user_id usando join
    const { data: records, error } = await supabase
      .from('record')
      .select(`
        total_games,
        wins,
        losses,
        players (
          user_id
        )
      `)
      .eq('players.user_id', user_id);

    if (error) {
      return res.status(500).json({ error: 'Error al obtener registros' });
    }

    if (!records || records.length === 0) {
      return res.status(404).json({ error: 'No se encontraron registros' });
    }

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
    console.error(error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};
