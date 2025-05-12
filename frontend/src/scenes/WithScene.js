import Phaser from 'phaser';

export default class WinScene extends Phaser.Scene {
  constructor() {
    super({ key: 'WinScene' });
  }

  create() {
    const { winner, code, players, gameSettings, socketId } = this.sys.settings.data;

    // (si los necesitas en propiedades de instancia)
    this.winner      = winner;
    this.code        = code;
    this.players     = players;
    this.gameSettings= gameSettings;
    



    this.add.text(400, 250, `${this.winner} ha ganado!`, {
      fontSize: '48px',
      color: '#ffffff'
    }).setOrigin(0.5);

    const btn = this.add.text(400, 350, 'Volver al Lobby', {
      fontSize: '24px',
      backgroundColor: '#2196F3',
      padding: { x: 20, y: 10 },
      color: '#fff'
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true });

    btn.on('pointerup', () => this.scene.start('LobbyScene', {
      code: this.code,
      players: this.players,
      gameSettings: this.gameSettings,
      mySocketId: this.socketId
    }));
  }
}
