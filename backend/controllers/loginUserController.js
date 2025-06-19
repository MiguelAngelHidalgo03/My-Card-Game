import supabase from '../utils/supabaseClient.js';

// Función para iniciar sesión de un usuario
// Esta función se encarga de autenticar al usuario con su correo y contraseña
// y devolver la sesión activa y los datos del usuario (sin contraseña)
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  // Validar que ambos campos estén presentes
  if (!email || !password) {
    console.log('Error: Email y contraseña son obligatorios');
    return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
  }

  // Autenticación con Supabase Auth
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.log('Error en autenticación con Supabase:', error);

      if (error.code === 'email_not_confirmed') {
        return res.status(401).json({ error: 'Se ha enviado un correo electronico de confirmación a tu cuenta, es posible que este en el correo de spam.' });
      }

      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const { user, session } = data;

    // Obtener datos adicionales del usuario desde tu tabla 'users'
    const { datarError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (userError) {
      console.log('Error al obtener los datos del usuario desde la tabla:', userError.message);
      return res.status(500).json({ error: 'Error al obtener los datos del usuario' });
    }

    // Log para verificar los datos del usuario y la sesión
    console.log('Usuario autenticado con éxito:', user);
    console.log('Sesión activa:', session);

    return res.status(200).json({
      message: 'Inicio de sesión exitoso',
      session, // Contiene el token JWT y otros datos útiles
      user: {
        user_id: userData.user_id,
        username: userData.username,
        profile_picture: userData.profile_picture,
        language: userData.language,
      },
    });
  } catch (err) {
    // Si ocurre un error en cualquier parte del proceso, capturamos el error general
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

