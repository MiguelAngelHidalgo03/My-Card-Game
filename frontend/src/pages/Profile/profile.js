import React, { useState } from 'react';
import './Profile.css';

const Profile = () => {
  const [selectedImage, setSelectedImage] = useState('/assests/img/avatar1.png'); // Imagen por defecto
  const [stats, setStats] = useState({
    gamesPlayed: 123,
    wins: 45,
    losses: 78,
  });

  const availableImages = [
    '/assests/img/avatar1.png',
    '/assests/img/avatar2.png',
    '/assests/img/avatar3.png',
    '/assests/img/avatar4.png',
  ];

  const handleImageChange = (image) => {
    setSelectedImage(image);
  };

  return (
    <div className="profile-container">
      <h1>Perfil del Usuario</h1>
      <div className="profile-content">
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
        <div className="profile-stats">
          <h2>Estadísticas</h2>
          <p>Partidas jugadas: {stats.gamesPlayed}</p>
          <p>Victorias: {stats.wins}</p>
          <p>Derrotas: {stats.losses}</p>
        </div>
      </div>
    </div>
  );
};

export default Profile;