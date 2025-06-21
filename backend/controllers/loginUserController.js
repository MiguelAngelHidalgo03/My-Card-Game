import supabase from '../utils/supabaseClient.js';

// Función para iniciar sesión de un usuario
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    console.log('Error: Email y contraseña son obligatorios');
    return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
  }

  try {
    // Intentar autenticación con Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      console.log('Error en autenticación con Supabase:', authError);

      if (authError.code === 'email_not_confirmed') {
        return res.status(401).json({
          error: 'Tu correo no ha sido confirmado. Revisa tu bandeja de entrada o spam.',
        });
      }

      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const { user, session } = authData;

    // Obtener datos adicionales del usuario desde la tabla 'users'
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (userError) {
      console.log('Error al obtener los datos del usuario desde la tabla:', userError.message);
      return res.status(500).json({ error: 'Error al obtener los datos del usuario' });
    }

    if (!userData) {
      return res.status(404).json({ error: 'No se encontraron datos del usuario en la tabla "users"' });
    }

    // Log para verificar que todo ha salido bien
    console.log('Usuario autenticado con éxito:', user);
    console.log('Sesión activa:', session);

    return res.status(200).json({
      message: 'Inicio de sesión exitoso',
      session,
      user: {
        user_id: userData.user_id,
        username: userData.username,
        profile_picture: userData.profile_picture,
        language: userData.language,
      },
    });
  } catch (err) {
    console.error('Error general en loginUser:', err);
    return res.status(500).json({ error: 'Error en el proceso de inicio de sesión' });
  }
};


// Función para cerrar sesión
// Esta función se puede usar para cerrar sesión del usuario actual
export const logoutUser = async (req, res) => {
    try {
      // Llamar a la función signOut para cerrar la sesión
      const { error } = await supabase.auth.signOut();
  
      if (error) {
        return res.status(500).json({ error: 'Error al cerrar sesión' });
      }
  
      return res.status(200).json({ message: 'Sesión cerrada exitosamente' });
    } catch (err) {
      console.error('Error en logout:', err);
      return res.status(500).json({ error: 'Error inesperado al cerrar sesión' });
    }
  };

