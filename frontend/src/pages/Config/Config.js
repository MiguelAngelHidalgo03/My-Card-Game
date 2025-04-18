import React, { useContext, useState, useEffect } from 'react';
import { UserContext } from '../../context/UserContext';
import './Config.css';

function Config() {
  const { user, setUser } = useContext(UserContext);  // Asegúrate de tener un setter para el usuario en el contexto
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [language, setLanguage] = useState('es');

  // Estado para cambiar contraseña
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    fetchUserData(); 
  }, []);

  // Función para recargar los datos del usuario desde la API
  const fetchUserData = async () => {
   // Obtener el userId desde localStorage
   const userFromStorage = localStorage.getItem('user');
   const userId = userFromStorage ? JSON.parse(userFromStorage).userId : null;
   console.log('userId desde localStorage:', userId); 
    
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
        // Actualiza el contexto y el estado del componente
        setUser(data.user);  // Supón que `setUser` actualiza el estado global del contexto
        setUsername(data.user.username);
        setEmail(data.user.email);
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
      email,
      language,
    };

    console.log('Datos enviados al actualizar el perfil:', updatedUserData);  // Ver qué se envía

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedUserData),
      });

      const data = await res.json();
      if (res.ok) {
        alert('Perfil actualizado correctamente');
        fetchUserData();  // Recarga los datos después de la actualización
      } else {
        alert(`Error: ${data.error}`);
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

    console.log('Datos enviados al cambiar la contraseña:', passwordData);  // Ver qué se envía

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(passwordData),
      });

      const data = await res.json();
      if (res.ok) {
        alert('Contraseña actualizada correctamente');
        setCurrentPassword('');
        setNewPassword('');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error al cambiar la contraseña:', error);
      alert('Ocurrió un error al cambiar la contraseña');
    }
  };

  if (!user) return <p className="Config-loading">Cargando datos de usuario...</p>;

  return (
    <div className="Config-page">
      <h2>Editar cuenta</h2>
      <form onSubmit={handleProfileSubmit}>
        <label>Nombre de usuario</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <label>Correo electrónico</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
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
    </div>
  );
}

export default Config;
