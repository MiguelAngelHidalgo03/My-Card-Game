import socket from '../utils/sockets';
// // src/scenes/WinScene.js
import Phaser from 'phaser';
// import socket from '../utils/sockets';

export default class WinScene extends Phaser.Scene {
  constructor() {
    super({ key: 'WinScene' });
  }

  init(data) {
    // Contexto recibido desde PlayScene
    this.winnerName   = data.winnerName;
    this.code         = data.code;
    this.players      = data.players || [];
    this.gameSettings = data.gameSettings;
    // Usar la propiedad mySocketId enviada por PlayScene
    this.mySocketId   = data.mySocketId;
  }

  create() {
    const { width, height } = this.scale;

    // ─── Texto principal: quién ha ganado ────────────────────────────────
    this.add.text(
      width / 2,
      height / 2 - 60,
      `${this.winnerName} ha ganado!`,
      { fontSize: '48px', color: '#ffffff' }
    ).setOrigin(0.5);

    // ─── Botón “Volver al Lobby” ─────────────────────────────────────────
    this.add.text(
      width / 2,
      height / 2 + 20,
      'Volver al Lobby',
      {
        fontSize: '24px',
        backgroundColor: '#2196F3',
        padding: { x: 20, y: 10 },
        color: '#fff'
      }
    )
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', () => {
      // Limpieza de estado para evitar auto-reinicio en Lobby
      window.localStorage.removeItem('lobbyState');
      // Emitir evento global para React (GameCanvas)
      this.game.events.emit('go-to-lobby');
    });

    // ─── Lógica de rematch para el host ───────────────────────────────────
    const isHost = this.players.some(
      p => p.isHost && p.socketId === this.mySocketId
    );

    if (isHost) {
      // Botón “Nueva Partida”
      this.add.text(
        width / 2,
        height / 2 + 80,
        'Nueva Partida',
        {
          fontSize: '20px',
          backgroundColor: '#4CAF50',
          padding: { x: 16, y: 8 },
          color: '#fff'
        }
      )
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        
      console.log('WinScene — clic en Nueva Partida');
        // El host solicita al servidor reiniciar la partida
        socket.emit('start-game', this.code, this.gameSettings);
      });
    } else {
      // Mensaje para invitados en espera de rematch
      this.add.text(
        width / 2,
        height / 2 + 80,
        'Esperando al host para nueva partida…',
        { fontSize: '20px', color: '#cccccc' }
      ).setOrigin(0.5);
    }
  }
}
