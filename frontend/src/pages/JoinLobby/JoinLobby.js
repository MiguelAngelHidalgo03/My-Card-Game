import React, { useContext, useState } from 'react';
import { UserContext } from '../../context/UserContext';
import Modal from '../../pages/Profile/ModalProfile'; // Importa tu Modal
import './JoinLobby.css';
import { useNavigate } from 'react-router-dom';

const availableImages = [
  '/assests/img/avatar1.png',
  '/assests/img/avatar2.png',
  '/assests/img/avatar3.png',
  '/assests/img/avatar4.png',
];

const JoinLobby = () => {
  const { user } = useContext(UserContext);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(user?.profile_picture || '/assests/img/avatar1.png');
  const [tempUsername, setTempUsername] = useState('');
  const [lobbyCode, setLobbyCode] = useState('');

  const navigate = useNavigate();

  const handleImageChange = (image) => {
    setSelectedAvatar(image);
  };

  const handleSaveAvatar = (avatar) => {
    setSelectedAvatar(avatar);
    setShowAvatarModal(false);
  };

  const handleJoinLobby = () => {
    if (!lobbyCode.trim()) {
      alert('Por favor ingresa el código de la sala.');
      return;
    }

    let username, avatar;

    if (user) {
      username = user.username;
      avatar = user.profile_picture;
    } else {
      if (!tempUsername.trim()) {
        alert('Por favor ingresa un nombre de usuario.');
        return;
      }
      username = tempUsername.trim();
      avatar = selectedAvatar;
    }

    navigate('/lobby', {
      state: {
        username,
        avatar,
        code: lobbyCode.toUpperCase(),
        isHost: false,
      },
    });
  };

  return (
    <div className="join-lobby">
      <h1>Unirse a Sala</h1>

      {user ? (
        <div className="user-session">
          <p>Bienvenido</p>
          <div className="selected-avatar-preview">
            <img src={selectedAvatar} alt="Avatar seleccionado" className="avatar-preview" />
          </div>
          <h2>{user.username}</h2>
          <input
            type="text"
            placeholder="Código de sala"
            value={lobbyCode}
            onChange={(e) => setLobbyCode(e.target.value)}
          />
          <button onClick={handleJoinLobby}>Unirse</button>
        </div>
      ) : (
        <div className="guest-form">
          <input
            type="text"
            placeholder="Nombre de usuario"
            value={tempUsername}
            onChange={(e) => setTempUsername(e.target.value)}
          />
          <input
            type="text"
            placeholder="Código de sala"
            value={lobbyCode}
            onChange={(e) => setLobbyCode(e.target.value)}
          />
          <button type="button" onClick={() => setShowAvatarModal(true)}>
            Elegir Avatar
          </button>
          <div className="selected-avatar-preview">
            <p>Avatar seleccionado:</p>
            <img src={selectedAvatar} alt="Avatar seleccionado" className="avatar-preview" />
          </div>
          <button onClick={handleJoinLobby}>Unirse</button>
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

export default JoinLobby;
