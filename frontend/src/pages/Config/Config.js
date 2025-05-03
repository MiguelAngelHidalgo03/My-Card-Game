// Config.js
import React, { useContext, useState, useEffect } from 'react';
import { UserContext } from '../../context/UserContext';
import './Config.css';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import { changeEmail, updateProfile, changePassword } from '../../services/playerService';  // Importar las funciones del servicio

// Inicialización de Supabase con las variables de entorno
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function Config() {
  const { user, setUser } = useContext(UserContext);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [language, setLanguage] = useState('es');
  const [message, setMessage] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    fetchUserData();
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
        setUser(data.user);
        setUsername(data.user.username);
        setLanguage(data.user.language);
      } else {
        alert(`Error al obtener los datos: ${data.error}`);
      }
    } catch (error) {
      console.error('Error al obtener los datos del perfil:', error);
      alert('Ocurrió un error al obtener los datos del perfil');
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const userFromStorage = localStorage.getItem('user');
    const userId = userFromStorage ? JSON.parse(userFromStorage).userId : null;

    if (!username || !email) {
      alert('El nombre de usuario y el correo son obligatorios');
      return;
    }

    const updatedUserData = {
      userId: userId,
      username,
      language,
    };

    try {
      const { success, error } = await updateProfile(updatedUserData);  // Usamos el servicio para actualizar el perfil

      if (success) {
        alert('Perfil actualizado correctamente');
        fetchUserData();  // Recarga los datos después de la actualización
      } else {
        alert(`Error: ${error}`);
      }
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      alert('Ocurrió un error al guardar los cambios');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (!currentPassword || !newPassword) {
      alert('Debes introducir la contraseña actual y la nueva contraseña');
      return;
    }

    const passwordData = {
      email,
      currentPassword,
      newPassword,
    };

    try {
      const { success, error } = await changePassword(passwordData);  // Usamos el servicio para cambiar la contraseña

      if (success) {
        alert('Contraseña actualizada correctamente');
        setCurrentPassword('');  // Limpiar los campos
        setNewPassword('');
      } else {
        alert(`Error: ${error}`);
      }
    } catch (error) {
      console.error('Error al cambiar la contraseña:', error);
      alert('Ocurrió un error al cambiar la contraseña');
    }
  };

  const handleChangeEmail = async (e) => {
    e.preventDefault();
  
    if (!email) {
      alert('Debes introducir un nuevo correo');
      return;
    }
  
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error("Error al obtener la sesión:", error);
      return;
    }

    if (!session) {
      console.log('No hay sesión activa', session);
      alert('No hay sesión activa');
      return;
    }

    // Paso 1: Cambiar el correo en Supabase
    const { success, error: emailError } = await changeEmail(email, session.access_token);  
    console.log('Enviando a /change-email:', {
      email,
      access_token: session.access_token,
    });
    if (success) {
      // Paso 2: Si el correo se cambió en Supabase, actualizamos el correo en la base de datos
      const userFromStorage = localStorage.getItem('user');
      const userId = userFromStorage ? JSON.parse(userFromStorage).userId : null;

      const updatedUserData = {
        userId,
        email,  
      };
     
      const { success: profileUpdateSuccess, error: profileError } = await updateProfile(updatedUserData);  

      if (profileUpdateSuccess) {
        alert('Correo electrónico actualizado correctamente en Supabase y en la base de datos' );
        setMessage('Ve al email para confirmar el cambio de correo');
        setEmail(''); 
      } else {
        alert(`Error al actualizar el correo en la base de datos: ${profileError}`);
      }
    } else {
      alert(`Error al cambiar el correo en Supabase: ${emailError}`);
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

      <h3>Cambiar contraseña</h3>
      <form onSubmit={handlePasswordChange}>
        <label>Contraseña actual</label>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />

        <label>Nueva contraseña</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />

        <button type="submit">Cambiar contraseña</button>
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
        />
        <button type="submit">Cambiar email</button>
      </form>

      {message && <p>{message}</p>}
    </div>
    </div>
  );
}

export default Config;
