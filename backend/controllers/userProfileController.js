import { createClient } from '@supabase/supabase-js';
import supabase from '../utils/supabaseClient.js';


export const getUserProfile = async (req, res) => {
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
    const { userId, username, email, language } = req.body;
  
    if (!userId) {
      return res.status(400).json({ error: 'El ID del usuario es obligatorio' });
    }
  
    try {
      const updates = {};
      if (username) updates.username = username;
      if (email) updates.email = email;
      if (language) updates.language = language;
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No se proporcionaron campos para actualizar' });
      }
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('user_id', userId);
  
      if (error) {
        console.error('Error al actualizar el perfil del usuario:', error.message);
        return res.status(500).json({ error: 'Error al actualizar el perfil del usuario' });
      }
  
      return res.status(200).json({ message: 'Perfil actualizado exitosamente' });
    } catch (err) {
      console.error('Error general en updateUserProfile:', err);
      return res.status(500).json({ error: 'Error inesperado al actualizar el perfil del usuario' });
    }
  };


  export const changePassword = async (req, res) => {
    const { email, currentPassword, newPassword } = req.body;
  
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

