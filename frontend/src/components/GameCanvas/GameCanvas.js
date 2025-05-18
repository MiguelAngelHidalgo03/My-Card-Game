// src/components/GameCanvas/GameCanvas.js
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import Phaser from 'phaser';
import PlayScene from '../../scenes/playScene/playScene';
import WinScene  from '../../scenes/WithScene';
import socket    from '../../utils/sockets';
import Alert     from '@mui/material/Alert';
import Slide     from '@mui/material/Slide';
import ChatWindow from '../../scenes/playScene/ChatWindows';

// import { debug } from 'console';

export default function GameCanvas() {
  useEffect(() => {
    // Al montar GameCanvas, desactivamos el overlay
    document.body.classList.add('no-overlay');
    return () => {
      // Al desmontar (volver al lobby, etc.), lo quitamos
      document.body.classList.remove('no-overlay');
    };
  }, []);


  const { code: urlCode } = useParams();
  const { state }         = useLocation();
  const navigate          = useNavigate();
  const container         = useRef(null);
  const timeoutRef        = useRef();
  const leftRef           = useRef();
  const endRef            = useRef();
  const resizeDebounceRef = useRef();
  const debugMode = process.env.NODE_ENV === 'development';
  

  // Persistir clientId para invitados
  const clientId = useMemo(() => {
    let id = localStorage.getItem('clientId');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('clientId', id);
      console.log('[GameCanvas] Nuevo clientId generado:', id);
    }
    return id;
  }, []);
  const savedLobby = JSON.parse(localStorage.getItem('lobbyState') || '{}');
  const chatUsername = state?.username || savedLobby.username;
  const chatAvatar   = state?.avatar   || savedLobby.avatar;

  // Estados para mostrar alertas
  const [reconnected, setReconnected] = useState(false);
  const [playerLeft,  setPlayerLeft]  = useState(false);
  const [gameEnded,   setGameEnded]   = useState(false);

  useEffect(() => {
    let onResizeHandler;

    // — Handlers de socket —
    const handleReconnected = () => {
      setReconnected(true);
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setReconnected(false), 3000);
    };

    const handlePlayerLeft = () => {
      setPlayerLeft(true);
      clearTimeout(leftRef.current);
      leftRef.current = setTimeout(() => setPlayerLeft(false), 3000);
    };

    // const handleGameEnded = ({ winnerPlayerId }) => {
    //   setGameEnded(true);
    //   // Opcional: redirigir a lobby tras X segundos
    //   clearTimeout(endRef.current);
    //   endRef.current = setTimeout(() => {
    //     setGameEnded(false);
    //     localStorage.removeItem('lobbyState');
    //     navigate('/lobby');
    //   }, 3000);
    // };

    const handleRoomFull = () => {
      alert('La sala ya está llena o no existe. Serás redirigido.');
      navigate('/lobby');
    };

    const handleError = msg => {
      alert(`Error: ${msg}`);
      navigate('/lobby');
    };

    socket.on('reconnected',   handleReconnected);
    socket.on('player-left',   handlePlayerLeft);
    socket.on('game-started', payload => {
     // 1) Recuperar el estado previo (con userId, username, avatar, isHost, clientId…)
  const prev = JSON.parse(localStorage.getItem('lobbyState') || '{}');

  // 2) Mezclar *prev* + *payload* + socket.id
  const newState = {
    ...prev,             // userId, username, avatar, isHost, clientId, code…
    ...payload,          // code, players, gameSettings, drawPile, discardPile, hands, turnIndex
   mySocketId: socket.id
 };
 // 3) Persistir
   localStorage.setItem('lobbyState', JSON.stringify(newState));

   const gm = window._phaserGame;
  if (gm) {
    // Si WinScene seguía activa, la detenemos
    if (gm.scene.isActive('WinScene')) {
      gm.scene.stop('WinScene');
    }
    // Ahora arrancamos PlayScene con el nuevo estado
    gm.scene.start('PlayScene', {
      ...newState,
      debugMode
    });
  }
 });
    socket.on('room-full',     handleRoomFull);
    socket.on('error',         handleError);

    // Función principal de carga
    async function loadAndStart() {
      let gameState = state?.players ? { ...state } : null;
      if (!gameState) {
        try {
          const raw = localStorage.getItem('lobbyState');
          const obj = raw ? JSON.parse(raw) : null;
          if (obj?.players && obj.code === urlCode) gameState = obj;
        } catch {}
      }
      if (!gameState) {
        try {
          const res = await fetch(`/api/game/${urlCode}`);
          if (!res.ok) throw new Error();
          gameState = await res.json();
        } catch {
          return navigate('/lobby');
        }
      }

      const {
  code,
  players,
  gameSettings,
  drawPile,
  discardPile,
  hands,
  turnIndex,
  userId = null,
  username,
  avatar,
  isHost
} = gameState;


      // Emitir join-room
     socket.emit('join-room',
      code, userId, clientId, username, avatar, isHost
      );

      // Guardar state actualizado
      const newState = {
      code,
      players,
      gameSettings,
      drawPile,
      discardPile,
      hands,
      turnIndex,
      userId,
      username,
      avatar,
      isHost,
      clientId
      };
      // Guardar en localStorage
      localStorage.setItem('lobbyState', JSON.stringify(newState));

      // Preparar Phaser
      const parent = container.current;
      if (!parent) return navigate('/lobby');
      const w = parent.clientWidth, h = parent.clientHeight;
      if (w === 0 || h === 0) return;

      // Destruir instancia previa
      if (window._phaserGame) {
        window._phaserGame.destroy(true);
        delete window._phaserGame;
      }

      // Crear nueva instancia Phaser
      const cfg = {
        type: Phaser.AUTO,
        parent,
        scale: {
          mode: Phaser.Scale.RESIZE,
          autoCenter: Phaser.Scale.CENTER_BOTH,
          width:  w,
          height: h
        },
        physics: { default: 'arcade' },
        scene: [ PlayScene, WinScene ]
      };
      const game = new Phaser.Game(cfg);
      window._phaserGame = game;
      game.events.on('go-to-lobby', () => {
        navigate('/lobby');
      });
      game.events.on('restart-game', payload => {
        game.scene.start('PlayScene', { ...payload, debugMode });
      });

      const enriched = { ...newState, mySocketId: socket.id, debugMode };
      game.scene.start('PlayScene', enriched);

      // Debounce resize
      onResizeHandler = () => {
        clearTimeout(resizeDebounceRef.current);
        resizeDebounceRef.current = setTimeout(() => {
          const w2 = parent.clientWidth, h2 = parent.clientHeight;
          if (window._phaserGame && w2 > 0 && h2 > 0) {
            window._phaserGame.scale.resize(w2, h2);
          }
        }, 100);
      };
      window.addEventListener('resize', onResizeHandler);
    }

    loadAndStart();

    return () => {
      // Limpiar todo
      socket.off('reconnected', handleReconnected);
      socket.off('player-left',  handlePlayerLeft);
      
      socket.off('game-started');
      // socket.off('game-ended',   handleGameEnded);
      socket.off('room-full',    handleRoomFull);
      socket.off('error',        handleError);

      clearTimeout(timeoutRef.current);
      clearTimeout(leftRef.current);
      clearTimeout(endRef.current);
      clearTimeout(resizeDebounceRef.current);

      window.removeEventListener('resize', onResizeHandler);
      if (window._phaserGame) {
        window._phaserGame.destroy(true);
        delete window._phaserGame;
      }
    };
  }, [urlCode, state, navigate, clientId, debugMode]);

  return (
    <>
      {/* Reconexión */}
      {reconnected && (
        <Slide direction="down" in={reconnected}>
          <Alert
            variant="filled"
            severity="success"
            sx={{
              position:'absolute', top:16,
              left:'50%', transform:'translateX(-50%)',
              zIndex:9999
            }}
          >
            🔌 Conexión restablecida
          </Alert>
        </Slide>
      )}

      {/* Jugador desconectado */}
      {playerLeft && (
        <Slide direction="down" in={playerLeft}>
          <Alert
            variant="filled"
            severity="warning"
            sx={{
              position:'absolute', top:16,
              left:'50%', transform:'translateX(-50%)',
              zIndex:9999
            }}
          >
            ⚠️ Un jugador se ha desconectado
          </Alert>
        </Slide>
      )}

      {/* Partida finalizada */}
      {gameEnded && (
        <Slide direction="down" in={gameEnded}>
          <Alert
            variant="filled"
            severity="info"
            sx={{
              position:'absolute', top:16,
              left:'50%', transform:'translateX(-50%)',
              zIndex:9999
            }}
          >
            🏁 Partida finalizada. Volviendo al lobby…
          </Alert>
        </Slide>
      )}

      <div
        ref={container}
        className="game-canvas"
        style={{
          position:'absolute',
          top:0, left:0, right:0, bottom:0,
          overflow:'hidden'
        }}
      />
      <ChatWindow
      code={urlCode}
      username={chatUsername}
      avatar={chatAvatar}
      />
    </>
  );
}
