export default class PlayerPanel {
  constructor(scene, gameState) {
    this.scene = scene;
    this.gameState = gameState;
    this.createPanels();
  }

  createPanels() {
    const s = this.scene;
    const d = s.debug;
    const { width, height } = s.scale;

    // PANEL RIVAL
    const rivalPlayer = s.remotePlayer;
    const rivalAvatarKey = rivalPlayer.avatar ? 'avatar-' + rivalPlayer.playerId : 'avatar-def';
    const rivalAv = s.add.image(0, 0, rivalAvatarKey)
      .setDisplaySize(d.avatarSize, d.avatarSize);

    const fontSizePx = `${Math.round((s.isMobile ? height : width) * 0.02)}px`;

    s.rivalCountText = s.add.text(
      d.avatarSize + 10, 0,
      `${s.remotePlayer.username} • ${this.gameState.remoteHand.length}`,
      {
        fontFamily: 'Montserrat, sans-serif',
        fontSize: fontSizePx,
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
        shadow: {
          offsetX: 2, offsetY: 2,
          color: '#000',
          blur: 2,
          fill: false,
        },
      }
    ).setOrigin(0, 0.5);

    s.rivalPanel = s.add.container(0, d.panelOffsetY, [rivalAv, s.rivalCountText]);

    // PANEL LOCAL
    const localPlayer = s.localPlayer;
    const localAvatarKey = localPlayer.avatar ? 'avatar-' + localPlayer.playerId : 'avatar-def';
    const localAv = s.add.image(0, 0, localAvatarKey)
      .setDisplaySize(d.avatarSize, d.avatarSize);

    s.localCountText = s.add.text(
      d.avatarSize + 10, 0,
      `${s.localPlayer.username} • ${this.gameState.localHand.length}`,
      {
        fontFamily: 'Montserrat, sans-serif',
        fontSize: fontSizePx,
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
        shadow: {
          offsetX: 2, offsetY: 2,
          color: '#000',
          blur: 2,
          fill: false,
        },
      }
    ).setOrigin(0, 0.5);

    s.localPanel = s.add.container(0, height - d.panelOffsetY, [localAv, s.localCountText]);
  }

  updateCount() {
    const s = this.scene;
    const d = s.debug;
    const { width, height } = s.scale;

    // Actualiza textos
    s.rivalCountText.setText(`${s.remotePlayer.username} • ${this.gameState.remoteHand.length}`);
    s.localCountText.setText(`${s.localPlayer.username} • ${this.gameState.localHand.length}`);

    // Reposiciona paneles centrados
    const rivalW = d.avatarSize + 10 + s.rivalCountText.width;
    s.rivalPanel.setPosition((width - rivalW) / 2, d.panelOffsetY);

    const localW = d.avatarSize + 10 + s.localCountText.width;
    s.localPanel.setPosition((width - localW) / 2, height - d.panelOffsetY);
  }
}