// src/components/Lobby/Lobby.js
import React, { useEffect, useState, useMemo, useContext, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import socket from '../../utils/sockets';
import './Lobby.css';
import { UserContext } from '../../context/UserContext';

const AVAILABLE_MODES = [
  { key: 'normal', title: '🎲 Modo Normal', description: 'Se juega con las reglas estándar y las cartas especiales.', img: '/assests/img/GameModes/1pa1mode.png' },
  { key: 'quick', title: '⏱️ Modo Rápido', description: 'Perfecto para partidas cortas y emocionantes.', img: '/assests/img/GameModes/FastMode.png' },
  { key: 'tournament', title: '🏆 Modo Torneo', description: 'Acumula puntos por ganar partidas. Primero a 10 gana.', img: '/assests/img/GameModes/TournamentMode.png' },
  { key: 'challenge', title: '🎯 Modo Desafío', description: 'Objetivos adicionales en cada partida.', img: '/assests/img/GameModes/Challenge.png' },
  { key: 'noSpecials', title: '🚫 Sin Cartas Especiales', description: 'Solo cartas numéricas para partidas más relajadas.', img: '/assests/img/GameModes/ClassicMode.png' },
];

export default function Lobby() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(UserContext);

  const clientId = useMemo(() => {
    let id = localStorage.getItem('clientId');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('clientId', id);
    }
    return id;
  }, []);

  const savedState = useMemo(() => {
    const s = localStorage.getItem('lobbyState');
    return s ? JSON.parse(s) : {};
  }, []);

  const {
    code,
    username,
    avatar,
    isHost,
    userId: initUserId = null,
    clientId: savedClientId
  } = location.state || savedState || {};

  const effectiveClientId = savedClientId || clientId;
  const resolvedUserId   = user?.userId ?? initUserId;

  const [players, setPlayers]       = useState([]);
  const [gameSettings, setGameSettings] = useState({
    activeTab: 'modes',
    selectedMode: 'normal',
    initialHandSize: 7,
    enableSpecialCards: true,
    quickModeTimeLimit: 5,
  });
  const [hostLeft, setHostLeft]     = useState(false);
  const hasJoined                   = useRef(false);

  useEffect(() => {
    // 0) Si la partida ya arrancó, saltar directo a /game
    if (savedState.code === code && savedState.gameSettings) {
      return navigate(`/game/${code}`, { state: savedState });
    }

    // 1) Validar datos mínimos
    if (!code || !username || !avatar) {
      return navigate('/join-lobby');
    }

    // 2) Persistir estado
    const toSave = { code, username, avatar, isHost, userId: resolvedUserId, clientId: effectiveClientId };
    localStorage.setItem('lobbyState', JSON.stringify(toSave));

    // — 3) Registramos listeners *antes* de emitir —
    const handlePlayersList     = list => setPlayers([...list].sort((a,b) => b.isHost - a.isHost));
    const handlePlayerLeft      = ({ playerId }) => setPlayers(ps => ps.filter(p => p.playerId !== playerId));
    const handleHostLeft        = () => setHostLeft(true);
    const handleHostReturned    = () => setHostLeft(false);
    const handleSettingsUpdated = s => { if (!isHost) setGameSettings(s); };
    const handleGameStarted = ({
    players,
    gameSettings,
    drawPile,
    discardPile,
    hands,
    turnIndex,
    currentPlayerId
    }) => {
    // 1) Recupera el estado mínimo que ya tenías guardado
    const prev = JSON.parse(localStorage.getItem('lobbyState')) || {};

    // 2) Enriquécelo con TODO el payload del servidor
    const ns = {
    ...prev,
    players,
    gameSettings,
    drawPile,
    discardPile,
    hands,
    turnIndex,
     currentPlayerId,
    mySocketId: socket.id
    };

  // 3) Guarda y navega
  localStorage.setItem('lobbyState', JSON.stringify(ns));
  navigate(`/game/${code}`, { state: ns });
};
    const handleGameEnded       = () => {
      alert('La partida ha sido cancelada o finalizada.');
      localStorage.removeItem('lobbyState');
      navigate('/join-lobby');
    };
    const handleRoomFull        = () => {
      alert('La sala está llena o no existe.');
      localStorage.removeItem('lobbyState');
      navigate('/join-lobby');
    };

    socket.on('players-list',    handlePlayersList);
    socket.on('player-joined',   handlePlayersList);
    socket.on('player-left',     handlePlayerLeft);
    socket.on('host-left',       handleHostLeft);
    socket.on('host-returned',   handleHostReturned);
    socket.on('settings-updated',handleSettingsUpdated);
    socket.on('game-started',    handleGameStarted);
    socket.on('game-ended',      handleGameEnded);
    socket.on('room-full',       handleRoomFull);

    // — 4) Emitir join + get —
    if (!hasJoined.current) {
      socket.emit('join-room',
        code, resolvedUserId, effectiveClientId,
        username, avatar, isHost
      );
      hasJoined.current = true;
    }
    socket.emit('get-players', code);

    return () => {
      socket.off('players-list',    handlePlayersList);
      socket.off('player-left',      handlePlayerLeft);
      socket.off('host-left',        handleHostLeft);
      socket.off('host-returned',    handleHostReturned);
      socket.off('settings-updated', handleSettingsUpdated);
      socket.off('game-started',     handleGameStarted);
      socket.off('game-ended',       handleGameEnded);
      socket.off('room-full',        handleRoomFull);
    };
  }, [
    code, username, avatar, isHost,
    resolvedUserId, effectiveClientId,
    navigate, savedState
  ]);

  // El host emite settings al cambiar
  useEffect(() => {
    if (isHost) socket.emit('update-settings', code, gameSettings);
  }, [gameSettings, isHost, code]);

  // UI Handlers
  const handleTabChange  = tab => { if (isHost) setGameSettings(gs => ({ ...gs, activeTab: tab })); };
  const handleModeSelect = key => { if (isHost) setGameSettings(gs => ({ ...gs, selectedMode: key })); };
  const handleChange     = (k,v) => { if (isHost) setGameSettings(gs => ({ ...gs, [k]: v })); };
  const handleStartGame  = () => socket.emit('start-game', code, gameSettings);

  return (
    <div className="lobby">
      {/* Banner si el host se va */}
      {hostLeft && (
        <div className="host-alert">
          ⚠️ El host se ha desconectado. Esperando reconexión…
        </div>
      )}

      <h1>Código de Sala: <span>{code}</span></h1>

      {/* Lista de jugadores */}
      <h2>Jugadores:</h2>
      <ul>
        {players.map((p,i) => (
          <li key={p.playerId || i}>
            <img src={p.avatar} alt="avatar" />
            <span>{p.username}</span>
            {p.isHost && <span className="host-label">Host</span>}
          </li>
        ))}
      </ul>

      {/* Pestañas y ajustes (igual que antes) */}
      <div className="settings-tabs">
        <button className={gameSettings.activeTab==='modes'?'active':''} onClick={()=>handleTabChange('modes')}>⚙️ Modos</button>
        <button className={gameSettings.activeTab==='custom'?'active':''} onClick={()=>handleTabChange('custom')}>🔧 Ajustes</button>
      </div>
      {gameSettings.activeTab==='modes' ? (
        <div className="mode-cards">
          {AVAILABLE_MODES.map(m => (
            <div key={m.key}
              className={`mode-card ${gameSettings.selectedMode===m.key?'selected':''}`}
              onClick={()=>handleModeSelect(m.key)}
            >
              <img src={m.img} alt={m.title} /><h3>{m.title}</h3><p>{m.description}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="game-settings">
          <label>Cartas Iniciales:<input type="number" min="1" max="10"
            value={gameSettings.initialHandSize}
            onChange={e=>handleChange('initialHandSize', +e.target.value)}
            disabled={!isHost} /></label>
          <label>Especiales:<input type="checkbox"
            checked={gameSettings.enableSpecialCards}
            onChange={e=>handleChange('enableSpecialCards', e.target.checked)}
            disabled={!isHost} /></label>
        </div>
      )}

      {/* Botón de inicio (solo host, 2 jugadores) */}
      {isHost && players.length===2 && (
        <button onClick={handleStartGame}>Empezar Partida</button>
      )}
    </div>
  );
}
