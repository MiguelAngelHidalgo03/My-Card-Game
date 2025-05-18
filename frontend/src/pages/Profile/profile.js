import React, { useEffect, useState } from 'react';
import './Profile.css';
import { getUserProfile, getUserStats } from '../../services/playerService';
import Modal from './ModalProfile'; // Asegúrate que la ruta esté correcta
import {
  Box,
  Typography,
  Avatar,
  Grid,
  Button,
  Paper,
  useTheme,
} from '@mui/material';
const Profile = () => {
  const storedUser = JSON.parse(localStorage.getItem('user'));
  const userId = storedUser?.userId;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const googleAvatar = localStorage.getItem('google_avatar') || null;
  const localProfilePicture = storedUser?.profile_picture;
  const theme = useTheme();

  const baseAvatars = [
    '/assests/img/avatar1.png',
    '/assests/img/avatar2.png',
    '/assests/img/avatar3.png',
    '/assests/img/avatar4.png',
  ];

 const [selectedImage, setSelectedImage] = useState(
  localProfilePicture || baseAvatars[0]
);
  const [stats, setStats] = useState({
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const availableImages = googleAvatar ? [googleAvatar, ...baseAvatars] : baseAvatars;

  useEffect(() => {
    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const data = await getUserProfile(userId);
      const user = data.user;
      setProfile(user);
      setStats(await getUserStats(userId));
      setSelectedImage(user.profile_picture || selectedImage);

      // Verificación y actualización en base de datos si profile_picture de Google cambió
      const isGoogleUrl = user.profile_picture?.includes('googleusercontent.com');
      if (
        isGoogleUrl &&
        localProfilePicture &&
        user.profile_picture !== localProfilePicture
      ) {
        await fetch(`${process.env.REACT_APP_API_URL}/update-avatar`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${storedUser?.token}`,
          },
          body: JSON.stringify({
            userId: userId,
            profile_picture: localProfilePicture,
          }),
        });
      }
    } catch (error) {
      console.error('Error al cargar el perfil:', error);
      // setError('Error al cargar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (image) => {
    setSelectedImage(image);
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleSaveAvatar = async (imageToSave) => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/update-avatar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${storedUser?.token}`,
        },
        body: JSON.stringify({
          userId: userId,
          profile_picture: imageToSave,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(data.user);

        localStorage.setItem('user', JSON.stringify({
          ...storedUser,
          profile_picture: imageToSave,
        }));

        if (imageToSave.includes('googleusercontent.com')) {
          localStorage.setItem('google_avatar', imageToSave);
        }

        window.location.reload();
      } else {
        const err = await res.json();
        setError(err.error || 'Error al guardar el avatar');
      }
    } catch (err) {
      console.error('Error al guardar el avatar:', err);
      setError('Error al guardar el avatar');
    } finally {
      closeModal();
    }
  };

  if (loading) return <p>Cargando perfil...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="profile-background">
     <div className="profile-container">
  <Typography variant="h4" fontWeight={700} color="#6450F5" gutterBottom>
    Perfil del Usuario
  </Typography>

  <Grid container spacing={4} justifyContent="center" alignItems="flex-start">
    {/* Imagen de perfil y botón */}
    <Grid item xs={12} sm={4} textAlign="center">
      <Typography
        variant="h6"
        fontWeight="bold"
        sx={{ mb: 1 }}
      >
        {profile?.username}
      </Typography>
    <Avatar
      src={selectedImage}
     alt="Avatar"
      sx={{
       width: 140,
       height: 140,
       border: '3px solid #333',
       boxShadow: 3,
       objectFit: 'cover',
      imageRendering: 'auto', // mejor en pantallas retina
      }}
    />


      <Button
        variant="contained"
        color="primary"
        onClick={openModal}
        sx={{ mt: 2 }}
      >
        Editar Avatar
      </Button>
    </Grid>

    {/* Estadísticas */}
    <Grid item xs={12} sm={6}>
      <Typography
        variant="h5"
        fontWeight="bold"
        color="#6450F5"
        gutterBottom
      >
        Estadísticas
      </Typography>
      <Typography variant="body1" sx={{ mb: 1 }}>
        <strong>Partidas jugadas:</strong> {stats.gamesPlayed}
      </Typography>
      <Typography variant="body1" sx={{ mb: 1 }}>
        <strong>Victorias:</strong> {stats.wins}
      </Typography>
      <Typography variant="body1">
        <strong>Derrotas:</strong> {stats.losses}
      </Typography>
    </Grid>
  </Grid>

  {/* Modal */}
  <Modal
    isOpen={isModalOpen}
    onClose={closeModal}
    availableImages={availableImages}
    selectedImage={selectedImage}
    handleImageChange={handleImageChange}
    onSave={handleSaveAvatar}
  />
</div>

          </div>
  );
};

export default Profile;
