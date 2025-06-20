// src/components/Lobby/Lobby.js
import React, { useEffect, useState, useMemo, useContext, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import socket from '../../utils/sockets';
import './Lobby.css';
import { UserContext } from '../../context/UserContext';
import {
  animateCardEnter,
  animateCardHover,
  animateCardUnhover,
  animateCopyFeedback
} from './LobbyAnimation';

const AVAILABLE_MODES = [
  { key: 'noSpecials', title: '🚫 Modo Clásico', description: 'El juego clásico sin nuestras cartas especiales.', img: '/assests/img/GameModes/ClassicMode.png' },
  { key: 'normal', title: '🎲 Modo Normal', description: 'Se juega con las reglas estándar y nuestras cartas especiales.', img: '/assests/img/GameModes/1pa1mode.png' },
  { key: 'quick', title: '⏱️ Modo Rápido', description: 'Perfecto para partidas cortas y emocionantes.', img: '/assests/img/GameModes/FastMode.png' },
  { key: 'challenge', title: '🎯 Modo Desafío', description: 'Objetivos adicionales en cada partida.', img: '/assests/img/GameModes/Challenge.png' },
];


export default function Lobby() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(UserContext);
  const cardsRef = useRef([]);
  // ...dentro de Lobby.js...
const copyBtnRef = useRef();
const [copied, setCopied] = useState(false);
const [hoveredCard, setHoveredCard] = useState(null);
const isMobile = window.innerWidth <= 900;

const handleCopyCode = () => {
  if (!code) return;
  navigator.clipboard.writeText(code)
    .then(() => {
      setCopied(true);
      animateCopyFeedback(copyBtnRef.current);
      setTimeout(() => setCopied(false), 1200);
    })
    .catch(() => setCopied(false));
};
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
  const resolvedUserId = user?.userId ?? initUserId;

  const [players, setPlayers] = useState([]);
  const [gameSettings, setGameSettings] = useState({
    activeTab: 'modes',
    selectedMode: 'normal',
    initialHandSize: 7,
    enableSpecialCards: true,
    quickModeTimeLimit: 5,
  });
  const [hostLeft, setHostLeft] = useState(false);
  const hasJoined = useRef(false);


  useEffect(() => {
    animateCardEnter('.lobby-mode-card');
  }, []);

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
    const handlePlayersList = list => setPlayers([...list].sort((a, b) => b.isHost - a.isHost));
    const handlePlayerLeft = ({ playerId }) => setPlayers(ps => ps.filter(p => p.playerId !== playerId));
    const handleHostLeft = () => setHostLeft(true);
    const handleHostReturned = () => setHostLeft(false);
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
    const handleGameEnded = () => {
      alert('La partida ha sido cancelada o finalizada.');
      localStorage.removeItem('lobbyState');
      navigate('/join-lobby');
    };
    const handleRoomFull = () => {
      alert('La sala está llena o no existe.');
      localStorage.removeItem('lobbyState');
      navigate('/join-lobby');
    };

   socket.on('players-list', handlePlayersList);
socket.on('player-joined', handlePlayersList);
socket.on('player-left', handlePlayersList);
    socket.on('host-left', handleHostLeft);
    socket.on('host-returned', handleHostReturned);
    socket.on('settings-updated', handleSettingsUpdated);
    socket.on('game-started', handleGameStarted);
    socket.on('game-ended', handleGameEnded);
    socket.on('room-full', handleRoomFull);

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
    socket.off('players-list', handlePlayersList);
socket.off('player-joined', handlePlayersList);
socket.off('player-left', handlePlayersList);
      socket.off('host-left', handleHostLeft);
      socket.off('host-returned', handleHostReturned);
      socket.off('settings-updated', handleSettingsUpdated);
      socket.off('game-started', handleGameStarted);
      socket.off('game-ended', handleGameEnded);
      socket.off('room-full', handleRoomFull);
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
  const handleTabChange = tab => { if (isHost) setGameSettings(gs => ({ ...gs, activeTab: tab })); };
  const handleModeSelect = key => { if (isHost) setGameSettings(gs => ({ ...gs, selectedMode: key })); };
  const handleChange = (k, v) => { if (isHost) setGameSettings(gs => ({ ...gs, [k]: v })); };
  const handleStartGame = () => socket.emit('start-game', code, gameSettings);

  return (
    <div className="lobby-new">
      {/* Fondo animado */}
      <div className="lobby-bg-anim"></div>
<div className="lobby-room-token">
  <span>Sala</span>
  <strong>{code}</strong>
  <button
    className="copy-btn"
    ref={copyBtnRef}
    onClick={handleCopyCode}
    aria-label="Copiar código"
    type="button"
  >
     <svg width="22" height="22" viewBox="0 0 22 22">
    <rect x="5" y="5" width="10" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="2"/>
    <rect x="8" y="2" width="10" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="2"/>
  </svg>    {copied && <span className="copy-feedback">¡Copiado!</span>}
  </button>
</div>

      {/* Avatares en círculo */}
    <div className="lobby-players-circle">
 
<div className="lobby-players-circle">
  {players.map((p, i) => (
    <div
      key={p.playerId || i}
      className={`lobby-player-avatar${p.isHost ? ' host' : ''}${!p.status ? ' disconnected' : ''}`}
    >
      {p.isHost && (
        <span className="host-crown" title="Host">
          <svg width="28" height="20" viewBox="0 0 28 20" fill="none">
            <path d="M2 16L7 5L14 13L21 5L26 16Z" fill="#ffe95a" stroke="#bcae7c" strokeWidth="2"/>
            <circle cx="7" cy="5" r="2" fill="#ffe95a" stroke="#bcae7c" strokeWidth="1"/>
            <circle cx="21" cy="5" r="2" fill="#ffe95a" stroke="#bcae7c" strokeWidth="1"/>
            <circle cx="14" cy="13" r="2" fill="#ffe95a" stroke="#bcae7c" strokeWidth="1"/>
          </svg>
        </span>
      )}
      <img src={p.avatar} alt="avatar" />
      <span>{p.username}</span>
    </div>
  ))}
</div>
</div>

      {/* Selección de modo de juego */}
  <div className="lobby-btn-modes-wrapper">
  {isHost && players.length === 2 && (
<button className="lobby-start-btn-simple" type="button" onClick={handleStartGame}>
 JUGAR <svg
    className="play-icon"
    width="44"
    height="44"
    viewBox="0 0 44 44"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ verticalAlign: 'middle' }}
  >
    {/* Sombra cartoon */}
    <ellipse cx="22" cy="36" rx="12" ry="4" fill="#000" opacity="0.13"/>
    {/* Triángulo redondeado principal */}
    <path
      d="M13 9 Q13 6 18 9 L36 21 Q39 22 36 23 L18 35 Q13 38 13 34 Z"
      fill="#1d1c1c"
      stroke="#f7efdd"
      strokeWidth="2.5"
      strokeLinejoin="round"
      style={{ filter: 'drop-shadow(0 2px 2px #0002)' }}
    />
    {/* Brillo simple */}
    <path
      d="M18.5 14 Q22 20 22 28"
      stroke="#f7efdd"
      strokeWidth="0"
      opacity="0.7"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
</button>
  )}
  <div className="lobby-tab-pill">
    <span className="lobby-modes-title">Modos de juego</span>
  </div>
</div>
    <div className="lobby-mode-cards">
  {AVAILABLE_MODES.map((m, idx) => {
  const isComingSoon = idx >= AVAILABLE_MODES.length - 3;
  return (
    <div
      key={m.key}
      className={
        `lobby-mode-card${gameSettings.selectedMode === m.key ? ' selected' : ''}${hoveredCard === idx ? ' hovered' : ''}${isComingSoon ? ' coming-soon' : ''}`
      }
      ref={el => cardsRef.current[idx] = el}
      onClick={() => {
        if (!isComingSoon) handleModeSelect(m.key);
      }}
      onMouseEnter={() => setHoveredCard(idx)}
      onMouseLeave={() => setHoveredCard(null)}
      tabIndex={0}
      aria-label={m.title}
    >
      {/* Etiqueta "Seleccionado" */}
      {gameSettings.selectedMode === m.key && !isComingSoon && (
        <span className="mode-badge selected">Seleccionado</span>
      )}
      {/* Etiqueta "Próximamente" */}
      {isComingSoon && (
        <span className="badge coming-soon-badge">Próximamente?</span>
      )}
      <div className="lobby-mode-img-wrap">
        <img src={m.img} alt={m.title} />
      </div>
      <h3 className="lobby-mode-title">{m.title}</h3>
      <div className="lobby-mode-desc">
        <p>{m.description}</p>
      </div>
      {gameSettings.selectedMode === m.key && !isComingSoon && (
        <div className="lobby-mode-selected-glow"></div>
      )}
    </div>
  );
})}
</div>
      {/* Host alert */}
      {hostLeft && (
        <div className="host-alert">
          ⚠️ El host se ha desconectado. Esperando reconexión…
        </div>
      )}
    </div>
  );
}
