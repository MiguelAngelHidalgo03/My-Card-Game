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
      console.log('Error en autenticación con Supabase:', error.message);
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const { user, session } = data;

    // Obtener datos adicionales del usuario desde tu tabla 'users'
    const { data: userData, error: userError } = await supabase
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
// Función para autenticarse con Google

// Paso 1: Iniciar sesión con Google (redireccionar al login de Google)
export const googleAuth = async (req, res) => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:3000/auth/callback', // Cambia esto a la URL real de tu frontend
      },
    });

    if (error) {
      console.error('Error al iniciar sesión con Google:', error.message);
      return res.status(401).json({ error: 'No se pudo iniciar sesión con Google' });
    }

    return res.status(200).json({ url: data.url }); // URL para redirigir al login de Google
  } catch (err) {
    console.error('Error inesperado en googleAuth:', err.message);
    return res.status(500).json({ error: 'Error inesperado en el login con Google' });
  }
};

// Paso 2: Callback después de login con Google
export const handleGoogleCallback = async (req, res) => {
  try {
    // Obtener el usuario logueado tras redirección
    const { data: { user, session }, error } = await supabase.auth.getUser();

    if (error || !user) {
      console.error('Error al obtener el usuario tras Google login:', error?.message);
      return res.status(401).json({ error: 'No se pudo obtener el usuario tras login con Google' });
    }

    // Verificar si el usuario ya existe en la tabla 'users' (base de datos)
    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (findError && findError.code === 'PGRST116') {
      // El usuario no existe, lo creamos
      const { error: insertError } = await supabase
        .from('users')
        .insert([{
          user_id: user.id, 
          email: user.email,
          username: user.email.split('@')[0],  // Puedes usar el correo para generar un username si es necesario
          profile_picture: user.user_metadata?.avatar_url || '/assets/img/avatar1.png',
          language: 'es',
        }]);

      if (insertError) {
        console.error('Error al crear el usuario en la tabla users:', insertError.message);
        return res.status(500).json({ error: 'Error al crear el usuario en la base de datos' });
      }

      return res.status(200).json({
        message: 'Usuario creado y sesión iniciada con éxito',
        session,
        user: {
          user_id: user.id,
          email: user.email,
          username: user.email.split('@')[0],
          profile_picture: user.user_metadata?.avatar_url || '/assets/img/avatar1.png',
          language: 'es',
        },
      });
    }

    return res.status(200).json({
      message: 'Sesión iniciada con éxito',
      session,
      user: {
        user_id: user.id,
        email: user.email,
        username: existingUser.username,
        profile_picture: existingUser.profile_picture,
        language: existingUser.language,
      },
    });

  } catch (err) {
    console.error('Error general en el callback de Google:', err.message);
    return res.status(500).json({ error: 'Error inesperado en el callback de Google' });
  }
};
