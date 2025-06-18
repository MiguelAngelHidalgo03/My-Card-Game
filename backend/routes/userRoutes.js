// routes/userRoutes.js
import express from 'express';
import { createUser } from '../controllers/userController.js';
import  { loginUser, logoutUser } from '../controllers/loginUserController.js';
import {  getUserProfile, updateUserProfile, changePassword,changeUserEmail } from '../controllers/userProfileController.js';
import supabase from '../utils/supabaseClient.js';
const router = express.Router();

// Ruta para crear un usuario
router.post('/signup', createUser);
// Ruta para iniciar sesión
router.post('/login', loginUser);
// Ruta para cerrar sesión
router.post('/logout', logoutUser);

// Ruta para obtener el perfil del usuario
router.get('/profile/:userId', getUserProfile);

// Ruta para actualizar el perfil del usuario
router.put('/profile', updateUserProfile);

// Ruta para cambiar la contraseña del usuario
router.post('/change-password', changePassword);

// Ruta para cambiar la el correo del usuario
router.post('/change-email', changeUserEmail);

// Ruta para manejar la autenticación con Google
router.post('/google-auth', async (req, res) => {
  const { access_token } = req.body;
  
  if (!access_token) {
    console.error('Token no proporcionado');
    return res.status(400).json({ error: 'Token no proporcionado' });
  }

  try {
    console.log('Recibiendo token de acceso:', access_token);

    // Obtención del usuario desde Supabase
    const { data: { user }, error } = await supabase.auth.getUser(access_token);

    if (error || !user) {
      console.error('Error al obtener el usuario:', error);
      return res.status(401).json({ error: 'No se pudo obtener el usuario con el token de acceso.' });
    }

    console.log('Usuario obtenido:', user);

    // Verificar si ya existe el usuario en la base de datos
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle(); 

    if (userError) {
      console.error('Error al buscar el usuario:', userError);
      return res.status(500).json({ error: 'Error al buscar el usuario en la base de datos.' });
    }

    if (!existingUser) {
      console.log('Usuario no existe, creándolo...');
      
      const { error: insertError } = await supabase
        .from('users')
        .insert([{
          user_id: user.id,
          username: user.email.split('@')[0],
          email: user.email,
          profile_picture: user.user_metadata?.avatar_url || '/assets/img/avatar1.png',
          language: 'es',
        }]);

      if (insertError) {
        console.error('Error al insertar el nuevo usuario:', insertError);
        return res.status(500).json({ error: 'No se pudo crear el usuario en la base de datos' });
      }

      return res.status(200).json({
        message: 'Usuario creado y logueado con éxito',
        session: { access_token },
        user: {
          user_id: user.id,
          username: user.email.split('@')[0],
          email: user.email,
          profile_picture: user.user_metadata?.avatar_url || '/assets/img/avatar1.png',
          language: 'es',
        },
      });
    }

    // Si el usuario ya existe
    console.log('Usuario existente logueado con éxito');
    return res.status(200).json({
      message: 'Usuario existente logueado con éxito',
      session: { access_token },
      user: existingUser,
    });

  } catch (err) {
    console.error('Error en el manejo de la autenticación:', err);
    return res.status(500).json({ error: 'Hubo un problema interno en el servidor.' });
  }
});


export default router;