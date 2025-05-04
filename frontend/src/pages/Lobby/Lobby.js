import React, {useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import socket from '../../utils/sockets'; // Importa la instancia de socket
import './Lobby.css';

const Lobby = () => {

  const navigate = useNavigate();
  const location = useLocation();
  const { code, username, avatar, isHost } = location.state || JSON.parse(localStorage.getItem('lobbyState')) || {};
  const [players, setPlayers] = useState([]);
 

  useEffect(() => {
    if (!code || !username || !avatar) {
      console.error("Faltan datos para unirse a la sala");
      navigate('/join-lobby'); // Redirigir al usuario si no hay datos
      return;
    }
  
    localStorage.setItem('lobbyState', JSON.stringify({ code, username, avatar, isHost }));
  
    // Unirse a la sala
    socket.emit('join-room', code, username, avatar, isHost);
  
    // Solicitar la lista de jugadores al recargar
    socket.emit('get-players', code);
  
    // Escuchar la lista de jugadores
    socket.on('players-list', (playersList) => {
    const sortedPlayers = [...playersList].sort((a, b) => b.isHost - a.isHost);
    setPlayers(sortedPlayers);
    });
  
    // Escuchar jugadores nuevos
    socket.on('player-joined', (playersList) => {
    const sortedPlayers = [...playersList].sort((a, b) => b.isHost - a.isHost);
    setPlayers(sortedPlayers);
    });
  
    // Escuchar que la partida ha empezado
    socket.on('game-started', () => {
      console.log("¡La partida ha comenzado!");
      navigate('/game', { state: { code, players } });
    });
  
    // Escuchar si la sala está llena
    socket.on('room-full', () => {
      alert("La sala está llena. Solo se permiten 2 jugadores.");
    });
  
    return () => {
      socket.off('players-list');
      socket.off('player-joined');
      socket.off('game-started');
      socket.off('room-full');
    };
  }, [code, username, avatar, navigate]);
  const handleStartGame = () => {
    socket.emit('start-game', code); // Usa el código de sala correcto
  };

  return (
    <div className="lobby">
      <h1>Código de Sala: <span>{code}</span></h1>
      <h2>Jugadores:</h2>
      <ul>
     {players.map((player, index) => (
        <li key={index}>
      <img src={player.avatar} alt="avatar" />
      <span>{player.username}</span>
      {player.isHost && <span className="host-label">Host</span>}
        </li>
        ))}
    </ul>

      {isHost && players.length === 2 && (
        <button onClick={handleStartGame}>Empezar Partida</button>
      )}
    </div>
  );
};

export default Lobby;