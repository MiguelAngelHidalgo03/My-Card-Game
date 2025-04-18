import React, { useEffect, useState } from 'react';

const Profile = () => {
  // Obtenemos el usuario del localStorage (el guardado tras login)
  const storedUser = JSON.parse(localStorage.getItem('user'));
  const userId = storedUser?.userId;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true); // Para manejar el estado de carga
  const [error, setError] = useState(null); // Para manejar el error de la carga

  useEffect(() => {
    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  // Función para obtener el perfil del usuario usando fetch
  const fetchProfile = async () => {
    if (!userId) {
      setError('No se pudo encontrar el ID del usuario.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/profile/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(data.user); // Guardamos los datos del perfil
      } else {
        const data = await res.json();
        setError(data.error || 'Hubo un error al cargar tu perfil. Inténtalo nuevamente.');
      }
    } catch (error) {
      console.error('Error al cargar el perfil:', error);
      setError('Hubo un error al cargar tu perfil. Inténtalo nuevamente.');
    } finally {
      setLoading(false); // Dejar de cargar una vez que se ha terminado la solicitud
    }
  };

  // Mostrar loading mientras no hay perfil cargado
  if (loading) {
    return <p>Cargando perfil...</p>;
  }

  // Mostrar error si ocurrió
  if (error) {
    return <p>{error}</p>;
  }

  // Mostrar el perfil una vez cargado
  return (
    <div>
      <h2>Perfil de Usuario</h2>
      <p><strong>Nombre:</strong> {profile?.username}</p>
      {profile?.profile_picture && (
        <img src={profile.profile_picture} alt="Avatar" width={100} />
      )}
    </div>
  );
};

export default Profile;
