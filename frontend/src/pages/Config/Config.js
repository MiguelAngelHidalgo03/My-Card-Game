import React, { useContext, useState, useEffect } from 'react';
import { UserContext } from '../../context/UserContext';
import './Config.css';
import { createClient } from '@supabase/supabase-js';
import { changeEmail, updateProfile, changePassword } from '../../services/playerService';
import { Snackbar, Alert } from '@mui/material';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function Config() {
  const { user, setUser } = useContext(UserContext);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [language, setLanguage] = useState('es');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isGoogleUser, setIsGoogleUser] = useState(false);

useEffect(() => {
  const init = async () => {
    await detectGoogleUser(); // Primero detectar si es de Google
    await fetchUserData();    // Luego cargar los datos
  };

  init();
}, []);
  const fetchUserData = async () => {
    const userFromStorage = localStorage.getItem('user');
    const userId = userFromStorage ? JSON.parse(userFromStorage).userId : null;

    if (!userId) {
      console.error('No se encontró el userId');
      return;
    }

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/profile/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();
      if (res.ok) {
        // Solo actualiza el contexto si hay cambios
      if (
      !user || 
       data.user.username !== user.username || 
       data.user.language !== user.language || 
       data.user.profile_picture !== user.profile_picture
      ) {
         setUser(data.user);
      }
        setUsername(data.user.username);
        setLanguage(data.user.language);
      } else {
        setMessage('Error al obtener los datos: ' + data.error);
        setMessageType('error');
        setOpen(true);
      }
    } catch (error) {
      console.error('Error al obtener los datos del perfil:', error);
      setMessage('Ocurrió un error al obtener los datos del perfil');
      setMessageType('error');
      setOpen(true);
    }
  };

  const detectGoogleUser = async () => {
    const { data: { user: supabaseUser }, error } = await supabase.auth.getUser();

    if (error || !supabaseUser) {
      console.error('No se pudo obtener el usuario autenticado:', error);
      return;
    }

    const provider = supabaseUser.app_metadata?.provider || '';
    setIsGoogleUser(provider === 'google');
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const userFromStorage = localStorage.getItem('user');
    const userId = userFromStorage ? JSON.parse(userFromStorage).userId : null;

    if (!username) {
      setMessage('El nombre de usuario y el correo son obligatorios');
      setMessageType('error');
      setOpen(true);
      return;
    }

    const updatedUserData = {
      userId: userId,
      username,
      language,
    };

    try {
      const { success, error } = await updateProfile(updatedUserData);

      if (success) {
        setMessage('Perfil actualizado correctamente');
        setMessageType('success');
        setOpen(true);
        fetchUserData();
      } else {
        setMessage('Error: ' + error);
        setMessageType('error');
        setOpen(true);
      }
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      setMessage('Ocurrió un error al guardar los cambios');
      setMessageType('error');
      setOpen(true);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (!currentPassword || !newPassword) {
      setMessage('Debes introducir la contraseña actual y la nueva contraseña');
      setMessageType('error');
      setOpen(true);
      return;
    }

    const { data: { user: supabaseUser }, error: userError } = await supabase.auth.getUser();

    if (userError || !supabaseUser?.email) {
      console.error('No se pudo obtener el usuario autenticado:', userError?.message);
      setMessage('No se pudo obtener el email del usuario autenticado');
      setMessageType('error');
      setOpen(true);
      return;
    }

    const passwordData = {
      email: supabaseUser.email,
      currentPassword,
      newPassword,
    };

    try {
      const { success, error } = await changePassword(passwordData);

      if (success) {
        setMessage('Contraseña actualizada correctamente');
        setMessageType('success');
        setOpen(true);
        setCurrentPassword('');
        setNewPassword('');
      } else {
        setMessage('Error: ' + error);
        setMessageType('error');
        setOpen(true);
      }
    } catch (error) {
      console.error('Error al cambiar la contraseña:', error);
      setMessage('Ocurrió un error al cambiar la contraseña');
      setMessageType('error');
      setOpen(true);
    }
  };

  const handleChangeEmail = async (e) => {
    e.preventDefault();

    if (!email) {
      setMessage('Debes introducir un nuevo correo');
      setMessageType('error');
      setOpen(true);
      return;
    }

    try {
      const { success, error } = await changeEmail(email);

      if (success) {
        setMessage('Revisa tu correo para confirmar el cambio');
        setMessageType('success');
        setOpen(true);
        setEmail('');
      } else {
        setMessage('Error: ' + error);
        setMessageType('error');
        setOpen(true);
      }
    } catch (error) {
      console.error('Error al cambiar el correo:', error);
      setMessage('Ocurrió un error al cambiar el correo');
      setMessageType('error');
      setOpen(true);
    }
  };

  if (!user) return <p className="Config-loading">Cargando datos de usuario...</p>;

  return (
    <div className="Config-container">
      <div className="Config-page">
        <h2>Editar cuenta</h2>
        <form onSubmit={handleProfileSubmit}>
          <label>Nombre de usuario</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <label>Idioma</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="es">Español</option>
            <option value="en">Inglés</option>
          </select>

          <button type="submit">Guardar cambios</button>
        </form>

        <hr />

        {isGoogleUser && (
          <p style={{ color: 'red ', fontWeight: 'bold' }}>
            Has iniciado sesión con Google, por lo que no puedes cambiar la contraseña ni el correo desde aquí.
          </p>
        )}

        <h3>Cambiar contraseña</h3>
        <form onSubmit={handlePasswordChange}>
          <label>Contraseña actual</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            disabled={isGoogleUser}
          />

          <label>Nueva contraseña</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={isGoogleUser}
          />

          <button type="submit" disabled={isGoogleUser}>Cambiar contraseña</button>
        </form>

        <hr />

        <h3>Cambiar correo electrónico</h3>
        <form onSubmit={handleChangeEmail}>
          <label>Correo nuevo</label>
          <input
            type="email"
            placeholder="Nuevo email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isGoogleUser}
          />
          <button type="submit" disabled={isGoogleUser}>Cambiar email</button>
        </form>

        <Snackbar
          open={open}
          autoHideDuration={6000}
          onClose={() => setOpen(false)}
        >
          <Alert onClose={() => setOpen(false)} severity={messageType}>
            {message}
          </Alert>
        </Snackbar>
      </div>
    </div>
  );
}

export default Config;
