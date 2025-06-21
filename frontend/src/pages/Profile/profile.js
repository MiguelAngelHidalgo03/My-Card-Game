import React, { useEffect, useState } from 'react';
import './Profile.css';
import { getUserProfile, getUserStats } from '../../services/playerService';
import Modal from './ModalProfile';
import avatarImages from '../../utils/avatar';

const Profile = () => {
  const storedUser = JSON.parse(localStorage.getItem('user'));
  const userId = storedUser?.userId;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const googleAvatar = localStorage.getItem('google_avatar') || null;
  const localProfilePicture = storedUser?.profile_picture;

  const baseAvatars = avatarImages;

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
            userId,
            profile_picture: localProfilePicture,
          }),
        });
      }
    } catch (error) {
      console.error('Error al cargar el perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (image) => setSelectedImage(image);
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
          userId,
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
      <div className="create-bg-anim"></div>
      <div className="profile-container">
        <h1>Perfil del Usuario</h1>

        <div className="profile-image-section">
          <img
            src={selectedImage}
            alt="Avatar"
            className="profile-image"
          />
          <p className="username">{profile?.username}</p>
          <button onClick={openModal} className="btn-pixel">Editar Avatar</button>
        </div>

        <div className="profile-stats">
          <h2>Estadísticas</h2>
          <div className="stats-item">
          <p><strong>Partidas jugadas:</strong> {stats.gamesPlayed}</p>
          <p><strong>Derrotas:</strong> {stats.losses}</p>
          </div>
        </div>

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
