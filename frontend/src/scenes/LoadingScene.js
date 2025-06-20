import Phaser from 'phaser';

export default class LoadingScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LoadingScene' });
    this.waitingForFocus = false;
    this._minLoadingTime = 2000;
    this._startTime = 0;
    this._bar = null;
    this._barWidth = 0;
    this._loadingDone = false;
    this._barBg = null;
  }

  init(data) {
    this.nextSceneData = data;
  }

  preload() {
    const { width, height } = this.scale;
    this.add.rectangle(width / 2, height / 2, width, height, 0x222222, 0.95);

    const isSmall = width < 500;
    const loadingFontSize = isSmall ? '16px' : '28px';
    this._barWidth = isSmall ? Math.min(220, width * 0.85) : Math.min(400, width * 0.7);
    const barHeight = isSmall ? 16 : 28;

    this.add.rectangle(width / 2, height / 2, width, height, 0x222222, 0.95);

    const loadingText = this.add.text(
      width / 2,
      height / 2 - (isSmall ? 32 : 60),
      'Cargando sprites y recursos...',
      {
        fontSize: loadingFontSize,
        color: '#fff',
        fontFamily: 'Arial Black, Arial, sans-serif'
      }
    ).setOrigin(0.5);

    this._barBg = this.add.rectangle(width / 2, height / 2, this._barWidth, barHeight, 0x444444).setOrigin(0.5);
    this._bar = this.add.rectangle(width / 2 - this._barWidth / 2, height / 2, 0, barHeight, 0xD2F562).setOrigin(0, 0.5);

    this._startTime = Date.now();
    this._realProgress = 0;
    this._loadingDone = false;

    this.load.on('progress', (value) => {
      this._realProgress = value;
    });

    // Si la pestaña NO está activa, espera
    if (document.hidden) {
      loadingText.setText('Activa esta pestaña para continuar la carga...');
      this.waitingForFocus = true;
      const onFocus = () => {
        if (!document.hidden) {
          this.waitingForFocus = false;
          document.removeEventListener('visibilitychange', onFocus);
          this.scene.restart(this.nextSceneData); // reinicia la escena y carga assets
        }
      };
      document.addEventListener('visibilitychange', onFocus);
      return;
    }

    // Carga todos los assets necesarios para PlayScene
    this.load.multiatlas('cards', '/assests/Cartas/cartas.json', '/assests/Cartas/');
    this.load.multiatlas('cambiacolor', '/assests/cambiacolor/cambiacolor.json', '/assests/cambiacolor/');
    this.load.multiatlas('mas4', '/assests/mas4/mas4.json', '/assests/mas4/');
    this.load.image('fondoMobile', '/assests/img/framegreen.png');
    this.load.image('fondoDesktop', '/assests/img/Background2.png');
    this.load.image('mesa', '/assests/img/Ring_Solo.png');
    this.load.image('Persona', '/assests/img/Persona.png');
    this.load.image('Persona2', '/assests/img/Persona2.png');
    this.load.image('PersonaChica', '/assests/img/PersonaChica.png');
    this.load.image('PersonaChica2', '/assests/img/PersonaChica2.png');
    this.load.image('avatar-def', '/assests/img/avatar-default.png');

    if (this.nextSceneData && this.nextSceneData.players) {
      this.nextSceneData.players.forEach(p => {
        if (p.avatar) {
          this.load.image('avatar-' + p.playerId, p.avatar, { crossOrigin: 'anonymous' });
        }
      });
    }

    this.load.on('complete', () => {
      this._loadingDone = true;
      // Espera a que pasen los 5 segundos en update()
    });
  }

  update() {
    // Calcula el progreso visual en función del tiempo y del progreso real
    const elapsed = Date.now() - this._startTime;
    const timeProgress = Math.min(elapsed / this._minLoadingTime, 1);
    // El progreso visual es el menor entre el real y el del tiempo
    const visualProgress = Math.min(this._realProgress, timeProgress);

    if (this._bar) {
      this._bar.width = this._barWidth * visualProgress;
    }

    // Si la carga real ha terminado y han pasado los 5 segundos, avanza de escena
    if (this._loadingDone && timeProgress >= 1) {
      this.scene.start('PlayScene', this.nextSceneData);
    }
  }

  create() {
    window._phaserActiveScene = this.scene.key;
    window.dispatchEvent(new Event('phaser-scene-changed'));
  }
}