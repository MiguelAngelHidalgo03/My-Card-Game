import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

export const getUserProfile = async (userId) => {
  const res = await fetch(`${API_URL}/profile/${userId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Error al obtener el perfil');
  }

  return res.json();
};
export const getUserStats = async (userId) => {
  const res = await fetch(`${API_URL}/user/${userId}/records`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Error al obtener estadísticas');
  }

  return res.json();


  
};
// services/api.js

// Función para actualizar el perfil
export const updateProfile = async (updatedUserData) => {
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
      return { success: true, data };
    } else {
      return { success: false, error: data.error };
    }
  } catch (err) {
    console.error('Error al actualizar el perfil:', err);
    return { success: false, error: 'Error al actualizar el perfil' };
  }
};

// Función para cambiar la contraseña
export const changePassword = async (passwordData) => {
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
      return { success: true, data };
    } else {
      return { success: false, error: data.error };
    }
  } catch (err) {
    console.error('Error al cambiar la contraseña:', err);
    return { success: false, error: 'Error al cambiar la contraseña' };
  }
};

export const changeEmail = async (email) => {
  try {
    const userFromStorage = localStorage.getItem('user');
    const token = userFromStorage ? JSON.parse(userFromStorage).token : null;

    if (!token) {
      throw new Error('Token no encontrado');
    }

    const response = await axios.post(
      `${process.env.REACT_APP_API_URL}/change-email`,
      { email },
      {
        headers: {
          Authorization: `Bearer ${token}`, // Enviamos el token en los headers
        },
      }
    );

    if (response.data.success) {
      return { success: true };
    } else {
      return { success: false, error: response.data.error };
    }
  } catch (err) {
    console.error('Error al cambiar el correo:', err);
    return { success: false, error: 'Error al cambiar el correo' };
  }
};