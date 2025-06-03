import Phaser from 'phaser';

const COLOR_MAP = {
 Verde:   0xd2f562,  // #d2f562
  Azul:    0x11a4a2,  // #11a4a2
  Naranja: 0xf5a267,  // #f5a267
  Morada:  0xc868f5 // #c868f5
};

export default class ColorSelector {
  /**
   * Muestra el overlay y devuelve la promesa que resuelve con el color elegido.
   * @param {Phaser.Scene} scene
   * @param {number} x — coordenada del discard
   * @param {number} y
   * @returns {Promise<string>}
   */
  static show(scene, x, y) {
    return new Promise(resolve => {
      // Fondo semitransparente
      const bg = scene.add.rectangle(0, 0, scene.scale.width, scene.scale.height, 0x000000, 0.7)
        .setOrigin(0)
        .setDepth(9000)
        .setInteractive();

      // Contenedor para círculos de color
      const container = scene.add.container(x, y).setDepth(9001);

      const radius = 60;
      const offset = 100;
      const entries = Object.entries(COLOR_MAP);

      entries.forEach(([name, hex], i) => {
        const angle = (Math.PI / 2) * i - Math.PI / 4;
        const cx = Math.cos(angle) * offset;
        const cy = Math.sin(angle) * offset;

        // Sombra manual: círculo más grande y oscuro detrás
        const shadow = scene.add.circle(cx + 4, cy + 6, radius + 8, 0x000000, 0.25)
          .setDepth(9000);

        // Círculo grande
        const circle = scene.add.circle(cx, cy, radius, hex)
          .setStrokeStyle(6, 0xffffff)
          .setInteractive({ cursor: 'pointer' });

        // Texto centrado con el nombre del color
        const label = scene.add.text(cx, cy, name, {
          fontFamily: 'Arial',
          fontSize: '28px',
          color: '#fff',
          fontStyle: 'bold',
          align: 'center',
          stroke: '#000',
          strokeThickness: 4,
        }).setOrigin(0.5);

        // Animación de hover
        circle.on('pointerover', () => {
          scene.tweens.add({
            targets: [circle, label],
            scale: 1.15,
            duration: 120,
            ease: 'Back.Out'
          });
        });
        circle.on('pointerout', () => {
          scene.tweens.add({
            targets: [circle, label],
            scale: 1,
            duration: 120,
            ease: 'Back.In'
          });
        });

        // Animación y selección al hacer click
        circle.on('pointerup', () => {
          scene.tweens.add({
            targets: [circle, label],
            scale: 1.3,
            angle: 360,
            duration: 500,
            yoyo: true,
            ease: 'Cubic.Out',
            onComplete: () => {
              bg.destroy();
              container.destroy();
              shadow.destroy();
              resolve(name); // El nombre coincide exactamente con el del deck
            }
          });
        });

        container.add(shadow);
        container.add(circle);
        container.add(label);
      });

      // Animación de entrada: los círculos giran y aparecen
      scene.tweens.add({
        targets: container,
        angle: { from: -30, to: 0 },
        scale: { from: 0.7, to: 1 },
        duration: 400,
        ease: 'Back.Out'
      });
    });
  }
}