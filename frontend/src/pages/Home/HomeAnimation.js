import anime from 'animejs';

export function animacionIntroGuantes(callback) {
  const flash = document.getElementById('flash-effect');
  // ► leer variables definidas en :root / media-query
  const css = getComputedStyle(document.documentElement);
  const START = parseFloat(css.getPropertyValue('--punch-start'));
  const SHOW = parseFloat(css.getPropertyValue('--punch-show'));
  const BACK = parseFloat(css.getPropertyValue('--punch-back'));
  const HIT = parseFloat(css.getPropertyValue('--punch-hit'));
  const SCALE = parseFloat(css.getPropertyValue('--punch-scale')) || 1.3;
  const EXIT = parseFloat(css.getPropertyValue('--punch-exit')); // 95
  const timeline = anime.timeline({
    easing: 'easeOutExpo'
  });
  function lanzarConfeti() {
    const colores = ['#FF3D00', '#FFEB3B', '#4CAF50', '#2196F3', '#E91E63'];
    const cantidad = 150;
    const contenedor = document.getElementById('confeti-container');

    for (let i = 0; i < cantidad; i++) {
      const confeti = document.createElement('div');
      confeti.classList.add('confeti');
      confeti.style.backgroundColor = colores[Math.floor(Math.random() * colores.length)];
      confeti.style.left = `${Math.random() * 100}%`;
      confeti.style.top = `-10px`;
      confeti.style.width = `${6 + Math.random() * 4}px`;
      confeti.style.height = `${10 + Math.random() * 6}px`;

      contenedor.appendChild(confeti);

      anime({
        targets: confeti,
        translateY: [0, window.innerHeight + 50],
        translateX: [(Math.random() - 0.5) * 200],
        rotate: Math.random() * 720,
        duration: 2000 + Math.random() * 2000,
        delay: Math.random() * 400,
        easing: 'easeOutCubic',
        complete: () => confeti.remove()
      });
    }
  }

  timeline
    /* 1. SHOW  ------------------------------------------------------------- */
    .add({
      targets: ['.guante-izquierdo', '.guante-derecho'],
      translateX: (el, i) => i === 0
        ? [`${START}%`, `${SHOW}%`]
        : [`${-START}%`, `-${SHOW}%`],
      duration: 600,
      easing: 'easeOutExpo'
    })

    /* 2. BACK  ------------------------------------------------------------- */
    .add({
      targets: ['.guante-izquierdo', '.guante-derecho'],
      translateX: (el, i) => i === 0
        ? [`${SHOW}%`, `${BACK}%`]
        : [`-${SHOW}%`, `-${BACK}%`],
      duration: 350,
      easing: 'easeInQuad'
    })

    /* 3. HIT  -------------------------------------------------------------- */
    .add({
      targets: ['.guante-izquierdo', '.guante-derecho'],
      translateX: (el, i) => i === 0
        ? [`${BACK}%`, `${HIT}%`]
        : [`-${BACK}%`, `-${HIT}%`],
      scale: [1, SCALE, 1.08],
      rotateZ: (el, i) => i === 0 ? [0, -12, 0] : [0, 12, 0],
      duration: 600,
      easing: 'easeOutBack'
    })

    /* 4. EXIT  – sale disparado desde **HIT** hasta el borde --------------- */
    .add({
      targets: ['.guante-izquierdo', '.guante-derecho'],
      translateX: (el, i) => i === 0
        ? [`${HIT}%`, `${EXIT}%`]          // izq  5 → 95
        : [`-${HIT}%`, `-${EXIT}%`],       // der -5 → -95
      opacity: [1, 0],
      duration: 300,
      easing: 'easeInQuad'
    })

    .add({
      targets: '#impact-wave',
      scale: [0, 10],
      opacity: [0.8, 0],
      duration: 600,
      easing: 'easeOutQuad'
    }, '-=100')

    .add({
      targets: ['.guante-izquierdo', '.guante-derecho'],
      opacity: [1, 0],
      duration: 300,
      easing: 'easeOutQuad'
    }, '-=350')
    .add({
      targets: flash,
      opacity: [0, 1, 0],
      duration: 600,
      easing: 'easeInQuad'
    }, '-=500')
    .add({
      targets: '#page-content',
      opacity: [0, 1],
      duration: 600,
      easing: 'easeOutQuad',
      begin: () => {
        // quita la clase 'visible' solo cuando empiece la animación
        document.getElementById('page-content').classList.add('visible');
      },
      complete: () => {
        callback();
      }
    }, '-=720')
    .add({
      targets: '.logo-normal',
      opacity: [0, 1],
      scale: [0, 1.45, 1.35],
      duration: 1400,
      easing: 'easeOutBack',
      // complete: ... (esto también lo quitas)
    }, '-=480')
    .add({
      begin: () => {
        lanzarConfeti();
      }
    }, '-=950')
  return timeline;
}
