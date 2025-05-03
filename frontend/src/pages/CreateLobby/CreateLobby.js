import React, { useContext, useState } from 'react';
import { UserContext } from '../../context/UserContext';
import Modal from '../../pages/Profile/ModalProfile'; // Modal para elegir avatar
import './CreateLobby.css';
import { useNavigate } from 'react-router-dom';

const availableImages = [
  '/assests/img/avatar1.png',
  '/assests/img/avatar2.png',
  '/assests/img/avatar3.png',
  '/assests/img/avatar4.png',
];

const CreateLobby = () => {
  const { user } = useContext(UserContext);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(user?.profile_picture || '/assests/img/avatar1.png');
  const [tempUsername, setTempUsername] = useState('');
  const navigate = useNavigate();

  const handleImageChange = (image) => {
    setSelectedAvatar(image);
  };

  const handleSaveAvatar = (avatar) => {
    setSelectedAvatar(avatar);
    setShowAvatarModal(false);
  };

  const handleCreateLobby = () => {
    if (!user && !tempUsername.trim()) {
      alert('Por favor, ingresa un nombre de usuario.');
      return;
    }

    const lobbyCode = Math.random().toString(36).substr(2, 6).toUpperCase();
    const userData = user
      ? { username: user.username, avatar: user.profile_picture }
      : { username: tempUsername.trim(), avatar: selectedAvatar };

    navigate('/lobby', {
      state: {
        username: userData.username,
        avatar: userData.avatar,
        code: lobbyCode,
        isHost: true,
      },
    });
  };

  return (
    <div className="create-lobby">
      <h1>Crear Sala</h1>

      {user ? (
        <div className="user-session">
          <p>Bienvenido</p>
          <div className="selected-avatar-preview">
            <img src={user.profile_picture || '/assets/img/avatar1.png'} alt="Avatar seleccionado" className="avatar-preview" />
          </div>
          <h2>{user.username}</h2>
          <button onClick={handleCreateLobby}>Crear Sala</button>
        </div>
      ) : (
        <div className="guest-form">
          <input
            type="text"
            placeholder="Nombre de usuario"
            value={tempUsername}
            onChange={(e) => setTempUsername(e.target.value)}
          />

          <button type="button" onClick={() => setShowAvatarModal(true)}>
            Elegir Avatar
          </button>

          <div className="selected-avatar-preview">
            <p>Avatar seleccionado:</p>
            <img src={selectedAvatar} alt="Avatar seleccionado" className="avatar-preview" />
          </div>

          <button onClick={handleCreateLobby}>Crear Sala</button>
        </div>
      )}

      <Modal
        isOpen={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        availableImages={availableImages}
        selectedImage={selectedAvatar}
        handleImageChange={handleImageChange}
        onSave={handleSaveAvatar}
      />
    </div>
  );
};

export default CreateLobby;
