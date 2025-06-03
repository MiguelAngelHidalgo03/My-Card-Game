// src/scenes/playScene/modules/TurnManager.js
import Phaser from 'phaser';

export default class TurnManager {
  constructor(scene, gameState) {
    this.scene = scene;
    this.gameState = gameState;
    this.highlight = null;
  }

  update() {
  const s = this.scene;
  console.log('[TurnManager] playerId:', s.playerId, 'currentPlayerId:', this.gameState.currentPlayerId);

  const isLocal = this.gameState.isLocalTurn(s.playerId);
  console.log('[TurnManager] update: s.playerId=', s.playerId, 'gameState.currentPlayerId=', this.gameState.currentPlayerId);

  // 1) Enable or disable all Phaser input based on whose turn it is
  s.input.enabled = isLocal;

  // 2) Show "¡Tu turno!" toast solo si es tu turno
  if (isLocal && !s._turnToastShown) {
  s._turnToastShown = true;
  if (typeof s.showNotification === 'function') {
    s.showNotification('¡Tu turno!', '', 'avatar-local');
  } else {
    // Animación temática UNO
    const group = s.add.container(s.scale.width / 2, s.scale.height / 2 - 150).setDepth(9999);

// Círculo arcoiris degradado
const bg = s.add.graphics();
const centerX = 0, centerY = 0, radius = 90;
const rainbow = [0xff0000, 0xff7f00, 0xffff00, 0x00ff00, 0x0000ff, 0x4b0082, 0x9400d3];
const arcWidth = 18;
for (let i = 0; i < rainbow.length; i++) {
    bg.lineStyle(arcWidth, rainbow[i], 1);
    const startAngle = Phaser.Math.DegToRad((i / rainbow.length) * 360);
    const endAngle = Phaser.Math.DegToRad(((i + 1) / rainbow.length) * 360);
    bg.beginPath();
    bg.arc(centerX, centerY, radius - (arcWidth / 2), startAngle, endAngle, false);
    bg.strokePath();
}
group.add(bg);

// Texto central
const text = s.add.text(0, 0, '¡TU TURNO!', {
  fontFamily: 'Arial Black, Arial, sans-serif',
  fontSize: '38px',
  fontStyle: 'bold',
  color: '#fff',
  stroke: '#000',
  strokeThickness: 8,
  shadow: { offsetX: 0, offsetY: 4, color: '#000', blur: 8, fill: true }
}).setOrigin(0.5);
group.add(text);

// Animación de entrada (zoom y fade)
group.setScale(0.7).setAlpha(0);
s.tweens.add({
  targets: group,
  scale: 1,
  alpha: 1,
  duration: 350,
  ease: 'Cubic.Out',
  onComplete: () => {
    // Pulso animado
    s.tweens.add({
      targets: group,
      scale: 1.08,
      yoyo: true,
      repeat: 2,
      duration: 200,
      onComplete: () => {
        // Animación de salida (fade out y zoom)
        s.tweens.add({
          targets: group,
          alpha: 0,
          scale: 0.7,
          duration: 250,
          ease: 'Cubic.Out',
          delay: 800, 
          onComplete: () => group.destroy()
        });
      }
    });
  }
});
  }
}
  if (!isLocal) {
    s._turnToastShown = false;
  }

  // 3) Update the hand & panel counts (in case they changed)
  if (s.handView) {
    s.handView.layout();
  }
  if (s.playerPanel) {
    s.playerPanel.updateCount();
  }

  // 4) Move the highlight circle around the active player's panel
  if (this.highlight) {
    this.highlight.destroy();
  }
  if (!s.playerPanel || !s.playerPanel.localPanel || !s.playerPanel.rivalPanel) return;
  const panel = isLocal ? s.playerPanel.localPanel : s.playerPanel.rivalPanel;
  if (!panel) return;
  const color = isLocal ? s.debug.highlightColorLocal : s.debug.highlightColorRemote;
  const stroke = s.debug.highlightStroke;
  const radius = s.debug.avatarSize / 2 + stroke / 2;
  this.highlight = s.add.circle(panel.x, panel.y, radius).setStrokeStyle(stroke, color);
}
}
