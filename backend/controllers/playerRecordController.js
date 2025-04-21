import supabase from '../utils/supabaseClient.js';

export const getPlayerRecordsByUser = async (req, res) => {
  const { user_id } = req.params;

  try {
    // 1. Busca el player correspondiente al userId
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('player_id')
      .eq('user_id', user_id)
      .single();

    if (playerError || !player) {
      return res.status(404).json({ error: 'Jugador no encontrado para este userId.' });
    }

    const playerId = player.player_id;

    // 2. Busca el record de ese player_id
    const { data: record, error: recordError } = await supabase
      .from('record')
      .select('total_games, wins, losses')
      .eq('player_id', playerId)
      .single();

    if (recordError || !record) {
      return res.status(404).json({ error: 'No se encontraron registros para este jugador.' });
    }

    // 3. Responder con los datos encontrados
    return res.status(200).json(record); 
  } catch (error) {
    console.error('Error al obtener registros del jugador:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};
