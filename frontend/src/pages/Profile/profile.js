import React, { useEffect, useState } from 'react';
import './Profile.css';
import { Dialog, DialogActions, DialogContent, DialogTitle, Button } from '@mui/material';

const Profile = () => {
  const storedUser = JSON.parse(localStorage.getItem('user'));
  const userId = storedUser?.userId;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState('/assests/img/avatar1.png');
  const [stats, setStats] = useState({
    gamesPlayed: 123, // Placeholder, puede actualizarse con los datos del perfil
    wins: 45, // Placeholder
    losses: 78, // Placeholder
  });
  const [isModalOpen, setIsModalOpen] = useState(false); // Para manejar el estado del modal

  const availableImages = [
    '/assests/img/avatar1.png',
    '/assests/img/avatar2.png',
    '/assests/img/avatar3.png',
    '/assests/img/avatar4.png',
  ];

  useEffect(() => {
    if (userId) {
      fetchProfile();
    }
  }, []);

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
        fetchProfile()
        setProfile(data.user); // Actualiza el perfil después de cambiar la foto
        console.log(data.user); // Verifica la respuesta y si profile_picture está presente
        // Suponiendo que las estadísticas vienen también desde la API
        setStats({
          gamesPlayed: data.user.gamesPlayed || stats.gamesPlayed,
          wins: data.user.wins || stats.wins,
          losses: data.user.losses || stats.losses,
        });
        setSelectedImage(data.user.profile_picture || selectedImage); // Si el perfil tiene una imagen, la usamos
      } else {
        const data = await res.json();
        setError(data.error || 'Hubo un error al cargar tu perfil. Inténtalo nuevamente.');
      }
    } catch (error) {
      console.error('Error al cargar el perfil:', error);
      setError('Hubo un error al cargar tu perfil. Inténtalo nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (image) => {
    setSelectedImage(image);
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };
  const handleSaveAvatar = async () => {
    if (!selectedImage) {
      console.error('No se ha seleccionado una imagen.');
      return;
    }
  
    try {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/update-avatar`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${storedUser?.token}`,
  },
  body: JSON.stringify({
    userId: userId,
    profile_picture: selectedImage,
  }),
});

  
      if (res.ok) {
        const data = await res.json();
        console.log('Avatar guardado exitosamente');
        // Actualiza el estado del perfil y cierra el modal si es necesario
        setProfile(data.user); 
      } else {
        const data = await res.json();
        setError(data.error || 'Hubo un error al guardar el avatar.');
        console.error('Error al guardar el avatar:', data.error);
      }
    } catch (error) {
      console.error('Error al guardar el avatar:', error);
      setError('Hubo un error al guardar el avatar. Inténtalo nuevamente.');
    } finally {
      closeModal(); // Cerrar el modal después de guardar el avatar
    }
  };

  if (loading) {
    return <p>Cargando perfil...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }
  return (
    <div className="profile-container">
      <h1>Perfil del Usuario</h1>
      <div className="profile-info">
        </div>

      <div className="profile-content">
        <div className="profile-image-section">
        <p className="username">{profile?.username}</p>
        <img src={selectedImage} alt="Avatar" className="profile-image" />
        <Button variant="contained" color="primary" onClick={openModal}>
            Editar Avatar
        </Button>       
        </div>

        <div className="profile-stats">
          <h2>Estadísticas</h2>
          <p>Partidas jugadas: {stats.gamesPlayed}</p>
          <p>Victorias: {stats.wins}</p>
          <p>Derrotas: {stats.losses}</p>
        </div>
      </div>

      {/* Modal para editar el avatar */}
      <Dialog open={isModalOpen} onClose={closeModal}>
        <DialogTitle>Editar Avatar</DialogTitle>
        <DialogContent>
          <div className="profile-image-section">
            <img src={selectedImage} alt="Avatar" className="profile-image" />
            <h3>Selecciona tu avatar:</h3>
            <div className="avatar-options">
              {availableImages.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`Avatar ${index + 1}`}
                  className={`avatar-option ${selectedImage === image ? 'selected' : ''}`}
                  onClick={() => handleImageChange(image)}
                />
              ))}
            </div>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeModal} color="primary">
            Cancelar
          </Button>
          <Button onClick={handleSaveAvatar} color="primary">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Profile;
