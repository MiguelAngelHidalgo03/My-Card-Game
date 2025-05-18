import GUI from 'lil-gui';

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

  // 🃏 Mano Local
  const fLocal = gui.addFolder('🃏 Mano Local');
  fLocal.add(debug, 'cardY', 0, scene.scale.height).name('Y Mano').onChange(applyLayout);
  fLocal.add(debug, 'spacing', 0, scene.scale.width).name('Espaciado').onChange(applyLayout);
  fLocal.add(debug, 'cardScale', 0.2, 2).name('Escala').onChange(applyLayout);
  fLocal.addColor(debug, 'cardTint').name('Color cartas').onChange(applyLayout);
  fLocal.open();

  // 👥 Mano Rival
  const fRival = gui.addFolder('👥 Mano Rival');
  fRival.add(debug, 'rivalY', 0, scene.scale.height).name('Y Rival').onChange(applyLayout);
  fRival.add(debug, 'rivalSpacing', 0, scene.scale.width).name('Esp. Rival').onChange(applyLayout);
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
  fDraw.add(debug, 'drawX', 335.872, scene.scale.width).name('X Mazo').onChange(applyLayout);
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

  return gui;
}
