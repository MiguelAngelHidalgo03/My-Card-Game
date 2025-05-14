// src/components/Lobby/Lobby.js
import React, { useEffect, useState, useMemo, useContext, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import socket from '../../utils/sockets';
import './Lobby.css';
import { UserContext } from '../../context/UserContext';

const AVAILABLE_MODES = [
  {
    key: 'normal',
    title: '🎲 Modo Normal',
    description: 'Se juega con las reglas estándar y las cartas especiales. Ideal para partidas equilibradas.',
    img: '/assests/img/GameModes/1pa1mode.png',
  },
  {
    key: 'quick',
    title: '⏱️ Modo Rápido',
    description: 'Tienes poco tiempo para jugar tu carta. Perfecto para partidas cortas y emocionantes.',
    img: '/assests/img/GameModes/FastMode.png',
  },
  {
    key: 'tournament',
    title: '🏆 Modo Torneo',
    description: 'Cada jugador acumula puntos por ganar partidas. El primero que llegue a 10 puntos gana el torneo.',
    img: '/assests/img/GameModes/TournamentMode.png',
  },
  {
    key: 'challenge',
    title: '🎯 Modo Desafío',
    description: 'Hay objetivos adicionales, como ganar sin usar cartas especiales o en menos de 10 turnos.',
    img: '/assests/img/GameModes/Challenge.png',
  },
  {
    key: 'noSpecials',
    title: '🚫 Modo sin Cartas Especiales',
    description: 'Se juega solo con cartas normales. Ideal para partidas relajadas.',
    img: '/assests/img/GameModes/ClassicMode.png',
  },
];
const Lobby = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(UserContext);
  
  const storedUser = useMemo(() => {
  const s = localStorage.getItem('user');
  return s ? JSON.parse(s) : null;
   }, []);



  const { code, username, avatar, isHost } =
    location.state ||
    JSON.parse(localStorage.getItem('lobbyState')) ||
    {};

  const [players, setPlayers] = useState([]);
  const [gameSettings, setGameSettings] = useState({
    activeTab: 'modes',
    selectedMode: 'normal',
    initialHandSize: 7,
    enableSpecialCards: true,
    quickModeTimeLimit: 5,
  });

  const hasJoined = useRef(false);

  useEffect(() => {
    
    if (!code || !username || !avatar) {
      navigate('/join-lobby');
      return;
    }   const userId = user?.userId ?? storedUser?.userId ?? null;
    console.log(
      '→ join-room:',
      { code, userId, username, avatar, isHost }
    );
    // Guardar en localStorage
    localStorage.setItem(
      'lobbyState',
      JSON.stringify({ code, username, avatar, isHost, userId })
    );


    if (!hasJoined.current) {
      socket.emit('join-room', code, userId, username, avatar, isHost);
      hasJoined.current = true;
    }
    // Siempre pedir lista actualizada
    socket.emit('get-players', code);

    const updatePlayers = list => {
      const sorted = [...list].sort((a, b) => b.isHost - a.isHost);
      setPlayers(sorted);
    };

    socket.on('players-list', updatePlayers);
    socket.on('player-joined', updatePlayers);

    socket.on('settings-updated', newSettings => {
      if (!isHost) setGameSettings(newSettings);
    });

    socket.on('game-started', ({ settings: srvSettings, players: srvPlayers }) => {
      navigate('/game', {
        state: { code, players: srvPlayers, gameSettings: srvSettings }
      });
    });

    socket.on('room-full', () =>
      alert('La sala está llena. Solo se permiten 2 jugadores.')
    );

    return () => {
      socket.off('players-list', updatePlayers);
      socket.off('player-joined', updatePlayers);
      socket.off('settings-updated');
      socket.off('game-started');
      socket.off('room-full');
    };
  }, [
    code,
    username,
    avatar,
    isHost,
    user,   
    storedUser,      // 👉 añadido
    navigate
  ]);

  // Emitir ajustes si eres host
  useEffect(() => {
    if (isHost) {
      socket.emit('update-settings', code, gameSettings);
    }
  }, [gameSettings, isHost, code]);

   // ─── CONTROLADORES UI ────────────────────────────────────────────
  const handleTabChange = tab => {
    if (!isHost) return;
    setGameSettings(gs => ({ ...gs, activeTab: tab }));
  };

  const handleModeSelect = modeKey => {
    if (!isHost) return;
    setGameSettings(gs => ({ ...gs, selectedMode: modeKey }));
  };

  const handleChange = (key, value) => {
    if (!isHost) return;
    setGameSettings(gs => ({ ...gs, [key]: value }));
  };

  const handleStartGame = () => socket.emit('start-game', code, gameSettings);
 // ─── RENDER ────────────────────────────────────────
  return (
    <div className="lobby">
      <h1>Código de Sala: <span>{code}</span></h1>
      <h2>Jugadores:</h2>
      <ul>
        {players.map((p,i) => (
          <li key={i}>
            <img src={p.avatar} alt="avatar"/>
            <span>{p.username}</span>
            {p.isHost && <span className="host-label">Host</span>}
          </li>
        ))}
      </ul>

     
      {/* ─── PESTAÑAS ───────────────────────────────────────── */}
      <div className="settings-tabs">
        <button
          className={gameSettings.activeTab === 'modes' ? 'active' : ''}
          onClick={() => handleTabChange('modes')}
        >
          ⚙️ Modos de Juego
        </button>
        <button
          className={gameSettings.activeTab === 'custom' ? 'active' : ''}
          onClick={() => handleTabChange('custom')}
        >
          🔧 Ajustes Personalizados
        </button>
      </div>

      {/* ─── MODOS DE JUEGO ─────────────────────────────────────── */}
      {gameSettings.activeTab === 'modes' ? (
        <div className="mode-cards">
          {AVAILABLE_MODES.map(mode => (
            <div
              key={mode.key}
              className={`mode-card ${
                gameSettings.selectedMode === mode.key ? 'selected' : ''
              }`}
              onClick={() => handleModeSelect(mode.key)}
            >
              <img src={mode.img} alt={mode.title} />
              <h3>{mode.title}</h3>
              <p>{mode.description}</p>
            </div>
          ))}
        </div>

      // Ajustes personalizados
      ) : (
        <div className="game-settings">
          <h3>Ajustes Personalizados</h3>

          <label>
            Cartas Iniciales:
            <input
              type="number"
              min="1"
              max="10"
              value={gameSettings.initialHandSize}
              onChange={e =>
                handleChange('initialHandSize', +e.target.value)
              }
              disabled={!isHost}
            />
          </label>

          <label>
            Cartas Especiales:
            <input
              type="checkbox"
              checked={gameSettings.enableSpecialCards}
              onChange={e =>
                handleChange('enableSpecialCards', e.target.checked)
              }
              disabled={!isHost}
            />
          </label>

          {/* AÑADE AQUÍ MÁS CONTROLES */}
        </div>
      )}

      {isHost && players.length === 2 && (
       <button onClick={handleStartGame}>Empezar Partida</button>
      )}
    </div>
  );
};

export default Lobby;
