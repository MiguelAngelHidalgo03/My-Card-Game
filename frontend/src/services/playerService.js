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
