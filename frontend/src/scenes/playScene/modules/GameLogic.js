import socket from "../../../utils/sockets";

// src/scenes/playScene/modules/GameLogic.js

export default class GameLogic {
  constructor(scene, gameState) {
    this.scene = scene;
    this.gameState = gameState;
  }

  setupSocket(sck) {
    // Remote card played
    sck.on('card-played', ({ by, cardFrame }) => {
      if (by !== this.scene.localPlayer.username) {
        // Apply remote play
        this.gameState.playCard(by, /* index inferred by GameState */ 0);
        this.scene.handView.updateHandsAndLayout();
      }
    });
    // Remote card drawn
    sck.on('card-drawn', ({ by }) => {
      if (by !== this.scene.localPlayer.username) {
        this.gameState.drawCard(by);
        this.scene.handView.updateHandsAndLayout();
      }
    });
  }

  playCard(card, idx) {
  const played = this.gameState.playCard(this.scene.localPlayer.username, idx);
  socket.emit('card-played', {
    by: this.scene.localPlayer.username,
    cardFrame: played.frame,
    cardIndex: idx // <-- Añade esto
  });
  this.scene.handView.updateHandsAndLayout();
}
  drawCard() {
  // Ya no emitas nada, solo bloquea input y espera la animación del backend
  this.scene.isAnimating = true;
  this.scene.input.enabled = false;
  // El backend emitirá los eventos y el frontend animará y actualizará la mano tras game-state
}
}
