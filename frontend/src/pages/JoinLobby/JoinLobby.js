// src/components/JoinLobby/JoinLobby.js
import React, { useContext, useState, useMemo } from 'react';
import { UserContext } from '../../context/UserContext';
import Modal from '../../pages/Profile/ModalProfile';
import './JoinLobby.css';
import { useNavigate } from 'react-router-dom';
import avatarImages from '../../utils/avatar';
const availableImages = avatarImages;
export default function JoinLobby() {
  const { user } = useContext(UserContext);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(user?.profile_picture || availableImages[0]);
  const [tempUsername, setTempUsername] = useState('');
  const [lobbyCode, setLobbyCode] = useState('');
  const navigate = useNavigate();

  // clientId para invitados
  const clientId = useMemo(() => {
    let id = localStorage.getItem('clientId');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('clientId', id);
      console.log('[JoinLobby] Nuevo clientId generado:', id);
    }
    return id;
  }, []);

  const handleImageChange = image => setSelectedAvatar(image);
  const handleSaveAvatar   = avatar => {
    setSelectedAvatar(avatar);
    setShowAvatarModal(false);
  };

  const handleJoinLobby = async () => {
    const code = lobbyCode.trim().toUpperCase();
    if (!code) {
      alert('Por favor ingresa el código de la sala.');
      return;
    }

    // 1) Validar existencia
    try {
      const res = await fetch(`/api/lobby/${code}`);
      if (!res.ok) throw new Error('Sala no existe');
      console.log('[JoinLobby] Sala encontrada:', code);
    } catch (e) {
      console.error('[JoinLobby] Validación fallida:', e);
      return alert('Sala no encontrada.');
    }

    // 2) Determinar username/avatar
    const username = user?.username || tempUsername.trim();
    if (!username) {
      return alert('Por favor, ingresa un nombre de usuario.');
    }
    const avatarImg = user?.profile_picture || selectedAvatar;
    const userId    = user?.userId || null;

    // 3) Construir estado
    const state = {
      code,
      username,
      avatar:    avatarImg,
      isHost:    false,
      userId,
      clientId
    };
    console.log('[JoinLobby] navega a /lobby con state:', state);

    // 4) Navegar a Lobby (ahí se hará el join-room)
    navigate('/lobby', { state });
  };
  return (
    <div className="join-lobby">
      <div className="join-bg-anim"></div>
      <h1>Unirse a Sala</h1>

      {user ? (
        <div className="user-session">
          <p>Bienvenido</p>
          <div className="selected-avatar-preview">
            <img src={user.profile_picture || selectedAvatar} alt="Avatar seleccionado" className="avatar-preview" />
          </div>
          <h2>{user.username}</h2>
          <input
            type="text"
            placeholder="Código de sala"
            value={lobbyCode}
            onChange={e => setLobbyCode(e.target.value)}
          />
          <button onClick={handleJoinLobby}>Unirse</button>
        </div>
      ) : (
        <div className="guest-formJ">
          <p class="p1">Ingresa un nombre de usuario</p>
          <input
            type="text"
            placeholder="Nombre de usuario"
            value={tempUsername}
            onChange={e => setTempUsername(e.target.value)}
          />
          
          <div className="selected-avatar-preview">
            <p>Avatar seleccionado:</p>
            <img src={selectedAvatar} alt="Avatar seleccionado" className="avatar-preview" />
          </div>
          <button type="button" onClick={() => setShowAvatarModal(true)}>
            Elegir Avatar
          </button>
           <p>Ingresa codigo de sala</p>
          <input
            type="text"
            placeholder="Código de sala"
            value={lobbyCode}
            onChange={e => setLobbyCode(e.target.value)}
          />
          <button onClick={handleJoinLobby} class="joinBtn">Unirse</button>
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

