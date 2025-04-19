import supabase from '../utils/supabaseClient.js';

// Actualizar el avatar del usuario
export const updateAvatar = async (req, res) => {
  const { userId, profile_picture } = req.body; // Recibimos la ruta de la imagen

  // Validar que ambos campos estén presentes
  if (!userId || !profile_picture) {
    return res.status(400).json({ error: 'El ID del usuario y la ruta del avatar son obligatorios' });
  }

  try {
    // Actualizar el avatar en la base de datos
    const { error } = await supabase
      .from('users')
      .update({ profile_picture })  // Usamos directamente la ruta de la imagen
      .eq('user_id', userId);

    if (error) {
      console.error('Error al actualizar el avatar:', error.message);
      return res.status(500).json({ error: 'Error al actualizar el avatar' });
    }

    return res.status(200).json({ message: 'Avatar actualizado exitosamente' });
  } catch (err) {
    console.error('Error general en updateAvatar:', err);
    return res.status(500).json({ error: 'Error inesperado al actualizar el avatar' });
  }
};

// Obtener la lista de avatares disponibles
export const getAvatars = async (req, res) => {
  try {
    // Lista de avatares disponibles (puedes reemplazar esto con datos dinámicos si es necesario)
    const avatars = [
      { id: 1, url: '/avatars/avatar1.png' },
      { id: 2, url: '/avatars/avatar2.png' },
      { id: 3, url: '/avatars/avatar3.png' },
      // Agrega más avatares según sea necesario
    ];

    return res.status(200).json({ avatars });
  } catch (err) {
    console.error('Error al obtener los avatares:', err);
    return res.status(500).json({ error: 'Error al obtener los avatares' });
  }
};