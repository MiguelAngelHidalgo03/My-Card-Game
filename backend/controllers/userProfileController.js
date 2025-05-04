import { createClient } from '@supabase/supabase-js';
<<<<<<< HEAD

const adminClient = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);


export function makeSupabaseWithToken(req) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    throw new Error('No se proporcionó token de autorización');
  }
  const token = auth.split(' ')[1];

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    }
  );

  return supabase;
}
=======
import supabase from '../utils/supabaseClient.js';
import jwt from 'jsonwebtoken';
>>>>>>> 4f2ef4f0cf1f0fe88c2b039f87ed52da637e3c50

export const getUserProfile = async (req, res) => {
  const supabase = makeSupabaseWithToken(req); 
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: 'El ID del usuario es obligatorio' });
  }

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('user_id, username, email, profile_picture, language')
      .eq('user_id', userId)
      .single();

    if (error || !user) {
      console.error('Error al obtener el perfil del usuario:', error?.message);
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    return res.status(200).json({ user });
  } catch (err) {
    console.error('Error general en getUserProfile:', err);
    return res.status(500).json({ error: 'Error al obtener el perfil del usuario' });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const supabase = makeSupabaseWithToken(req);

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return res.status(401).json({ error: 'Usuario no autenticado' });

    const updates = {};
    ['username', 'language', 'email'].forEach(f => {
      if (req.body[f]) updates[f] = req.body[f];
    });

    if (!Object.keys(updates).length) {
      return res.status(400).json({ error: 'Nada que actualizar' });
    }

    await supabase.from('users').update(updates).eq('user_id', user.id);

    res.json({ message: 'Perfil actualizado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



  export const changePassword = async (req, res) => {
    const { email, currentPassword, newPassword } = req.body;
    const supabase = makeSupabaseWithToken(req);

    // Validar que todos los campos estén presentes
    if (!email || !currentPassword || !newPassword) {
      return res.status(400).json({ error: 'El correo, la contraseña actual y la nueva contraseña son obligatorios' });
    }
  
    try {
      // Verificar la contraseña actual
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });
  
      if (signInError) {
        console.error('Error al verificar la contraseña actual:', signInError.message);
        return res.status(401).json({ error: 'La contraseña actual es incorrecta' });
      }
  
      // Cambiar la contraseña usando Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
  
      if (updateError) {
        console.error('Error al cambiar la contraseña:', updateError.message);
        return res.status(500).json({ error: 'Error al cambiar la contraseña' });
      }
  
      return res.status(200).json({ message: 'Contraseña actualizada exitosamente' });
    } catch (err) {
      console.error('Error general en changePassword:', err);
      return res.status(500).json({ error: 'Error inesperado al cambiar la contraseña' });
    }
  };
  
// Cambiar el correo electrónico

<<<<<<< HEAD
  export const changeUserEmail = async (req, res) => {
    try {
      const userSupabase = makeSupabaseWithToken(req);
      const { data: { user }, error: userError } = await userSupabase.auth.getUser();
      if (userError || !user) return res.status(401).json({ error: 'Usuario no autenticado' });
  
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: 'Email obligatorio' });
  
      // 1) Cambiar el email en Supabase Auth con permisos de admin
      const { data: updateData, error: authError } = await adminClient.auth.admin.updateUserById(user.id, { email });
      if (authError) throw authError;
  
      // 2) Actualizar también la tabla 'users'
      const { error: dbError } = await adminClient
        .from('users')
        .update({ email })
        .eq('user_id', user.id);
  
      if (dbError) console.error('Error actualizando tabla users:', dbError.message);
  
      return res.status(200).json({ message: 'Correo actualizado correctamente' });
    } catch (err) {
      console.error('changeUserEmail error:', err.message);
      return res.status(500).json({ error: err.message });
=======
export const changeUserEmail = async (req, res) => {
  const { email } = req.body;
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado o no válido' });
  }

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Actualizar solo el email en Supabase Auth (esto enviará el correo de confirmación)
    const { error: updateEmailError } = await supabase.auth.updateUser({
      email,
    });

    if (updateEmailError) {
      return res.status(500).json({ error: 'Error al actualizar el correo en Supabase' });
>>>>>>> 4f2ef4f0cf1f0fe88c2b039f87ed52da637e3c50
    }

    // Responder que el correo de confirmación fue enviado
    return res.status(200).json({
      success: true,
      message: 'Te hemos enviado un correo de confirmación al nuevo email. Debes confirmarlo para completar el cambio.'
    });

  } catch (error) {
    console.error('Error al cambiar el correo:', error);
    return res.status(500).json({ error: 'Error inesperado al cambiar el correo' });
  }
};


export const syncEmailInDatabase = async (userId) => {
  try {
    // Obtener el usuario desde Supabase Auth
    const { data: user, error } = await supabase.auth.admin.getUser(userId);

    if (error || !user) {
      console.error('Error obteniendo el usuario de Auth:', error?.message);
      return;
    }

    // Actualizar el correo en la base de datos
    const { data, error: dbError } = await supabase
      .from('users')
      .update({ email: user.email })
      .eq('user_id', userId);

    if (dbError) {
      console.error('Error actualizando el correo en la base de datos:', dbError.message);
      return;
    }

    console.log('Correo sincronizado correctamente en la base de datos');
  } catch (error) {
    console.error('Error al sincronizar el correo:', error);
  }
};


  // export const resetPassword = async (req, res) => {
  //   const { email } = req.body;
  
  //   if (!email) {
  //     return res.status(400).json({ error: 'El correo electrónico es obligatorio' });
  //   }
  
  //   try {
  //     const { error } = await supabase.auth.resetPasswordForEmail(email);
  
  //     if (error) {
  //       console.error('Error al enviar el correo de restablecimiento:', error.message);
  //       return res.status(500).json({ error: 'Error al enviar el correo de restablecimiento' });
  //     }
  
  //     return res.status(200).json({ message: 'Correo de restablecimiento enviado exitosamente' });
  //   } catch (err) {
  //     console.error('Error general en resetPassword:', err);
  //     return res.status(500).json({ error: 'Error inesperado al enviar el correo de restablecimiento' });
  //   }
  // };

