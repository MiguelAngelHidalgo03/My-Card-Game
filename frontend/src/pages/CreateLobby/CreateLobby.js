import React, { useContext, useState } from 'react';
import { UserContext } from '../../context/UserContext';
import Modal from '../../pages/Profile/ModalProfile';
import './CreateLobby.css';
import { useNavigate } from 'react-router-dom';
import avatarImages from '../../utils/avatar';

const availableImages = avatarImages;
export default function CreateLobby() {
  const { user } = useContext(UserContext);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(user?.profile_picture || availableImages[0]);
  const [tempUsername, setTempUsername] = useState('');
  const navigate = useNavigate();

  const handleImageChange = image => setSelectedAvatar(image);
  const handleSaveAvatar  = avatar => {
    setSelectedAvatar(avatar);
    setShowAvatarModal(false);
  };

  const handleCreateLobby = () => {
    // 1) Determinar username/ avatar
    const username = user?.username || tempUsername.trim();
    if (!username) {
      alert('Por favor, ingresa un nombre de usuario.');
      return;
    }
    const avatarImg = user?.profile_picture || selectedAvatar;

    // 2) Generar código único
    const code = Math.random().toString(36).substr(2, 6).toUpperCase();

    // 3) Construir estado
    const state = {
      code,
      username,
      avatar:    avatarImg,
      isHost:    true,
      userId:    user?.userId || null,
      clientId:  null
    };
    console.log('[CreateLobby] navega a /lobby con state:', state);

    // 4) Navegar a Lobby (ahí se hará el join-room)
    navigate('/lobby', { state });
  };

  return (
    <div className="create-lobby">
      <div className="create-bg-anim"></div>
     
      {user ? (
        <div className="user-session">
           <h1>Crear Sala</h1>
          <p>Bienvenido</p>
          <img src={user.profile_picture || selectedAvatar} alt="Avatar" className="avatar-preview" />
          <h2>{user.username}</h2>
          <button onClick={handleCreateLobby}>Crear Sala</button>
        </div>
      ) : (
        <div className="guest-form">
           <h1>Crear Sala</h1>
          <p>Ingresa un nombre de usuario</p>
          <input
            type="text"
            placeholder="Nombre de usuario"
            value={tempUsername}
            onChange={e => setTempUsername(e.target.value)}
          />
          <button onClick={() => setShowAvatarModal(true)}>Elegir Avatar</button>
          <img src={selectedAvatar} alt="Avatar" className="avatar-preview" />
          <button onClick={handleCreateLobby}>Crear Sala</button>
        </div>
      )}
      <Modal
        isOpen={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        availableImages={availableImages}
        handleImageChange={handleImageChange}
        selectedImage={selectedAvatar}
        onSave={handleSaveAvatar}
      />
    </div>
  );
}
