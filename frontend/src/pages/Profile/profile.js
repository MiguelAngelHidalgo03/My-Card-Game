import React, { useEffect, useState } from 'react';
import './Profile.css';
import { Dialog, DialogActions, DialogContent, DialogTitle, Button } from '@mui/material';
import { getUserProfile, getUserStats } from '../../services/playerService';

const Profile = () => {
  const storedUser = JSON.parse(localStorage.getItem('user'));
  const userId = storedUser?.userId;
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState('/assests/img/avatar1.png');
  const [stats, setStats] = useState({
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      const data = await getUserProfile(userId);
      setProfile(data.user);
      setSelectedImage(data.user.profile_picture || selectedImage);

      const statsData = await getUserStats(userId);
      setStats({
        gamesPlayed: statsData.total_games || 0,
        wins: statsData.wins || 0,
        losses: statsData.losses || 0,
      });

    } catch (error) {
      console.error('Error al cargar el perfil:', error);
      setError(error.message || 'Hubo un error al cargar tu perfil.');
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
        fetchProfile();
        setProfile(data.user);
        // Aquí actualizas localStorage con la nueva imagen
      localStorage.setItem('user', JSON.stringify({
        ...storedUser,
        profile_picture: selectedImage, 
      }));
      window.location.reload();
      } else {
        const data = await res.json();
        setError(data.error || 'Hubo un error al guardar el avatar.');
        console.error('Error al guardar el avatar:', data.error);
      }
    } catch (error) {
      console.error('Error al guardar el avatar:', error);
      setError('Hubo un error al guardar el avatar. Inténtalo nuevamente.');
    } finally {
      closeModal();
    }
  };

  if (loading) return <p>Cargando perfil...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="profile-container">
      <h1>Perfil del Usuario</h1>
      <div className="profile-info"></div>

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
          <Button onClick={closeModal} color="primary">Cancelar</Button>
          <Button onClick={handleSaveAvatar} color="primary">Guardar</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Profile;
