import GUI from 'lil-gui';
import socket from '../../utils/sockets';
export default function mountDebugGUI(scene, debug, applyLayout) {
  const gui = new GUI();

  // Toggle general
  gui
    .add({ enabled: true }, 'enabled')
    .name('🔍 Debug activado')
    .onChange(val => console.log('[Debug] debugMode =', val));

  // 🎨 Fondo
  const fBg = gui.addFolder('🎨 Fondo');
  fBg.addColor(debug, 'bgColor').name('Color fondo').onChange(applyLayout);
  fBg.open();

  // 👥 Panel Jugadores
  const fPlayers = gui.addFolder('👥 Panel Jugadores');
  fPlayers.add(debug, 'panelOffsetY', 0, scene.scale.height / 2)
    .name('Offset Y Panel')
    .onChange(applyLayout);
  fPlayers.add(debug, 'avatarSize', 16, 128)
    .name('Tamaño Avatar')
    .onChange(applyLayout);
  fPlayers.open();

  // ✨ Resalte Turno
  const fHighlight = gui.addFolder('✨ Resalte Turno');
  fHighlight.add(debug, 'highlightStroke', 1, 10)
    .name('Grosor Resalte')
    .onChange(applyLayout);
  fHighlight.addColor(debug, 'highlightColorLocal')
    .name('Color Tu Turno')
    .onChange(applyLayout);
  fHighlight.addColor(debug, 'highlightColorRemote')
    .name('Color Rival Turno')
    .onChange(applyLayout);
  fHighlight.open();

  // 🃏 Mano Local
  const fLocal = gui.addFolder('🃏 Mano Local');
  fLocal.add(debug, 'cardY', 0, scene.scale.height).name('Y Mano').onChange(applyLayout);
  fLocal.add(debug, 'cardOverlap', 0, scene.scale.width).name('Overlap Mano').onChange(applyLayout);
  fLocal.add(debug, 'cardScale', 0.2, 2).name('Escala Mano').onChange(applyLayout);
  fLocal.addColor(debug, 'cardTint').name('Color Mano').onChange(applyLayout);
  fLocal.open();

  // 👥 Mano Rival
  const fRival = gui.addFolder('👥 Mano Rival');
  fRival.add(debug, 'rivalY', 0, scene.scale.height).name('Y Rival').onChange(applyLayout);
  fRival.add(debug, 'rivalOverlap', 0, scene.scale.width).name('Overlap Rival').onChange(applyLayout);
  fRival.add(debug, 'rivalScale', 0.2, 2).name('Escala Rival').onChange(applyLayout);
  fRival.addColor(debug, 'rivalTint').name('Color Rival').onChange(applyLayout);
  fRival.open();

  // 📥 Descarte
  const fDisc = gui.addFolder('📥 Descarte');
  fDisc.add(debug, 'discardX', 0, scene.scale.width).name('X Descarte').onChange(applyLayout);
  fDisc.add(debug, 'discardY', 0, scene.scale.height).name('Y Descarte').onChange(applyLayout);
  fDisc.add(debug, 'discardScale', 0.2, 2).name('Escala Descarte').onChange(applyLayout);
  fDisc.addColor(debug, 'discardTint').name('Color Descarte').onChange(applyLayout);
  fDisc.open();

  // 📦 Mazo
  const fDraw = gui.addFolder('📦 Mazo');
  fDraw.add(debug, 'drawX', 0, scene.scale.width).name('X Mazo').onChange(applyLayout);
  fDraw.add(debug, 'drawY', 0, scene.scale.height).name('Y Mazo').onChange(applyLayout);
  fDraw.add(debug, 'drawScale', 0.1, 2).name('Escala Mazo').onChange(applyLayout);
  fDraw.addColor(debug, 'drawTint').name('Color Mazo').onChange(applyLayout);
  fDraw.open();

  // 🏳️ Rendirse
  const fSurr = gui.addFolder('🏳️ Rendirse');
  fSurr.add({ surrender: () => scene.surrenderBtn.emit('pointerup') }, 'surrender')
    .name('Forzar rendición');
  fSurr.add(debug, 'surrenderX', 0, scene.scale.width)
    .name('X Rendirse')
    .onChange(x => scene.surrenderBtn.setPosition(x, debug.surrenderY));
  fSurr.add(debug, 'surrenderY', 0, scene.scale.height)
    .name('Y Rendirse')
    .onChange(y => scene.surrenderBtn.setPosition(debug.surrenderX, y));
  fSurr.add(debug, 'surrenderFontSize', 10, 40)
    .name('Tamaño Texto')
    .onChange(size => scene.surrenderBtn.setStyle({ fontSize: `${size}px` }));
  fSurr.add(debug, 'surrenderPaddingX', 0, 20)
    .name('Padding X')
    .onChange(px => {
      const style = scene.surrenderBtn.style;
      style.padding = { x: px, y: debug.surrenderPaddingY };
      scene.surrenderBtn.setStyle(style);
    });
  fSurr.add(debug, 'surrenderPaddingY', 0, 20)
    .name('Padding Y')
    .onChange(py => {
      const style = scene.surrenderBtn.style;
      style.padding = { x: debug.surrenderPaddingX, y: py };
      scene.surrenderBtn.setStyle(style);
    });
  fSurr.open();

  // ✋ Hover & Tap Lift
  const fLift = gui.addFolder('✋ Elevación Carta');
  fLift.add(debug, 'liftOffset', 0, 100).name('Offset Elevación').onChange(applyLayout);
  fLift.add(debug, 'liftDuration', 50, 1000).name('Duración Elevación ms');
  fLift.open();
    const fScroll = gui.addFolder('◀️▶️ Desplazamiento');
  fScroll.add(debug, 'arrowMargin', 0, 100)
    .name('Margen flechas')
    .onChange(applyLayout);
  fScroll.open();
  const fTest = gui.addFolder('🔧 Test');
  fTest
    .add({ addTestCard: () => scene.addDebugCard() }, 'addTestCard')
    .name('Añadir carta de prueba');
  fTest
  .add({ emptyHand: () => {
    // Solo si es tu turno
    if (scene.gameState.currentPlayerId === scene.playerId) {
      socket.emit('debug-empty-hand', { code: scene.code, playerId: scene.playerId });
    } else {
      alert('Solo puedes vaciar tu mano en tu turno');
    }
  }}, 'emptyHand')
  .name('Vaciar mi mano (debug)');
  fTest.open();

  const fUno = gui.addFolder('🟩 Botón UNO');
 Object.keys(scene.unoBtnOffsets).forEach(pos => {
  const folder = fUno.addFolder(pos);
  folder.add(scene.unoBtnOffsets[pos], 'x', -300, 300, 1).name('Offset X').onChange(() => {
    if (scene.unoBtn && scene.unoBtnPosition === pos) {
      // Recalcula la posición real
      const d = scene.debug;
      if (pos === 'left-draw') {
        scene.unoBtn.x = d.drawX + scene.unoBtnOffsets['left-draw'].x;
        scene.unoBtn.y = d.drawY + scene.unoBtnOffsets['left-draw'].y;
      } else if (pos === 'right-discard') {
        scene.unoBtn.x = d.discardX + scene.unoBtnOffsets['right-discard'].x;
        scene.unoBtn.y = d.discardY + scene.unoBtnOffsets['right-discard'].y;
      } else if (pos === 'above-handmodal') {
        scene.unoBtn.x = scene.scale.width + scene.unoBtnOffsets['above-handmodal'].x;
        scene.unoBtn.y = d.cardY + scene.unoBtnOffsets['above-handmodal'].y;
      }
    }
  });
  folder.add(scene.unoBtnOffsets[pos], 'y', -300, 300, 1).name('Offset Y').onChange(() => {
    if (scene.unoBtn && scene.unoBtnPosition === pos) {
      // Igual que arriba
      const d = scene.debug;
      if (pos === 'left-draw') {
        scene.unoBtn.x = d.drawX + scene.unoBtnOffsets['left-draw'].x;
        scene.unoBtn.y = d.drawY + scene.unoBtnOffsets['left-draw'].y;
      } else if (pos === 'right-discard') {
        scene.unoBtn.x = d.discardX + scene.unoBtnOffsets['right-discard'].x;
        scene.unoBtn.y = d.discardY + scene.unoBtnOffsets['right-discard'].y;
      } else if (pos === 'above-handmodal') {
        scene.unoBtn.x = scene.scale.width + scene.unoBtnOffsets['above-handmodal'].x;
        scene.unoBtn.y = d.cardY + scene.unoBtnOffsets['above-handmodal'].y;
      }
    }
  });
  folder.open();
});




  return gui;
}
