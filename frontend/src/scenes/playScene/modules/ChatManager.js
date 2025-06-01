import socket from "../../../utils/sockets";
import Phaser from 'phaser';
export default class ChatManager {
  constructor(scene) {
    this.scene = scene;
    this.phaserChatHandler = this.phaserChatHandler.bind(this);
  }

  setupListeners() {
    window.addEventListener('open-chat', () => {
      // abrir UI React
    });

    socket.off('chat-message', this.phaserChatHandler);
    socket.on('chat-message', this.phaserChatHandler);
  }

  phaserChatHandler({ username, text, avatar }) {
    // No notifiques si es tu propio mensaje o el chat está abierto
     console.log('[ChatManager] phaserChatHandler', username, text, avatar);

    if (this.scene.localPlayer && username === this.scene.localPlayer.username) return;
    if (window.__chatOpen) return;

    // Elige avatar
    let avatarKey = 'avatar-def';
    if (this.scene.textures.exists('avatar-remote') && username !== this.scene.localPlayer.username) {
      avatarKey = 'avatar-remote';
    }
    if (this.scene.textures.exists('avatar-local') && username === this.scene.localPlayer.username) {
      avatarKey = 'avatar-local';
    }

    this.showNotification(username, text, avatarKey);
  }

  showNotification(username, text, avatarKey) {
    // --- Toast visual usando Phaser ---
    console.log('[ChatManager] Mostrando notificación:', username, text, avatarKey);
  if (!this.scene.activeToasts) this.scene.activeToasts = [];

  const toastW  = 300;
  const toastH  = 80;
  const pad     = 12;
  const avatarS = 48;
  const border  = 3;
  const baseX   = Math.max(0, this.scene.scale.width - toastW - 20);
  const startY  = 120;
  const gapY    = 10;

  const toast = this.scene.add.container(
    this.scene.scale.width + 20,
    startY + (this.scene.activeToasts.length)*(toastH+gapY)
  );
  
  const bg = this.scene.add.rectangle(0, 0, toastW, toastH, 0xffffff)
      .setOrigin(0)
      .setStrokeStyle(border, 0x000000);

    const av = this.scene.add.image(pad, pad, avatarKey)
      .setDisplaySize(avatarS, avatarS)
      .setOrigin(0);

    const nameText = this.scene.add.text(
      pad + avatarS + pad/2,
      pad,
      username,
      {
        fontFamily: 'Montserrat, sans-serif',
        fontSize: '16px',
        fontWeight: '600',
        color: '#900'
      }
    ).setOrigin(0, 0);

    const msgText = this.scene.add.text(
      nameText.x,
      pad + avatarS/2,
      text,
      {
        fontFamily: 'Montserrat, sans-serif',
        fontSize: '14px',
        color: '#000',
        wordWrap: { width: toastW - nameText.x - pad }
      }
    ).setOrigin(0, 0);

    toast.add([ bg, av, nameText, msgText ]);
    toast.setSize(toastW, toastH);
    toast.setDepth(2000);
    toast.setAlpha(0);
    toast.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, toastW, toastH),
      Phaser.Geom.Rectangle.Contains
    ).on('pointerup', () => window.dispatchEvent(new CustomEvent('open-chat')));

    this.scene.activeToasts.push(toast);

    this.scene.tweens.add({
      targets: toast,
      x: baseX,
      alpha: 1,
      duration: 250,
      ease: 'Cubic.easeOut'
    });

    this.scene.activeToasts.forEach((t, i) => {
      this.scene.tweens.add({
        targets: t,
        y: startY + i * (toastH + gapY),
        duration: 200,
        ease: 'Cubic.easeOut'
      });
    });

    if (this.scene.activeToasts.length > 5) {
      const old = this.scene.activeToasts.shift();
      old.destroy();
    }

    this.scene.time.delayedCall(4000, () => {
      this.scene.tweens.add({
        targets: toast,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          const idx = this.scene.activeToasts.indexOf(toast);
          if (idx !== -1) this.scene.activeToasts.splice(idx, 1);
          toast.destroy();
          this.scene.activeToasts.forEach((t, i) => {
            this.scene.tweens.add({
              targets: t,
              y: startY + i * (toastH + gapY),
              duration: 200,
              ease: 'Cubic.easeOut'
            });
          });
        }
      });
    });
  }

  teardown() {
    socket.off('chat-message', this.phaserChatHandler);
    window.removeEventListener('open-chat', this.openChatListener);
  }
}