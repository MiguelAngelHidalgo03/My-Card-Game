import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Phaser from 'phaser';
import PlayScene from '../../scenes/playScene';
import WinScene from '../../scenes/WithScene';

export default function GameCanvas() {
  const container = useRef(null);
  const { state } = useLocation();
  const navigate = useNavigate();
  const saved = JSON.parse(localStorage.getItem('lobbyState') || 'null');

  useEffect(() => {
    const gameState = state?.players
    ? state
    : (saved && saved.players ? saved : null);

  if (!gameState) {
    navigate('/lobby');
    return;
  }

    const parent = container.current;
    // función que monta Phaser en el tamaño del contenedor
    const createGame = () => {
      // limpia cualquier instancia previa
      if (window._phaserGame) {
        window._phaserGame.destroy(true);
      }

      const cfg = {
        type: Phaser.AUTO,
        parent,
        scale: {
          mode: Phaser.Scale.RESIZE,           // ↪️ ajusta a cualquier tamaño
          autoCenter: Phaser.Scale.CENTER_BOTH,
          width: parent.clientWidth,
          height: parent.clientHeight,
        },
        physics: { default: 'arcade' },
        scene: [PlayScene, WinScene],
      };

      const game = new Phaser.Game(cfg);
      window._phaserGame = game; // opcional: referenciar globalmente

      // arranca la escena pasándole el estado
      game.scene.start('PlayScene', {
        code: state.code,
        players: state.players,
        gameSettings: state.gameSettings,
      });
    };

    // monta al inicio
    createGame();
    // vuelve a montar / redimensionar si cambias de tamaño de ventana
    window.addEventListener('resize', createGame);

    return () => {
      window.removeEventListener('resize', createGame);
      if (window._phaserGame) {
        window._phaserGame.destroy(true);
        delete window._phaserGame;
      }
    };
  }, [state, navigate]);

  return (
    <div
      ref={container}
      className="game-canvas"
      style={{
        position: 'absolute',
        top: 0,   // o la altura de tu navbar
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
      }}
    />
  );
}