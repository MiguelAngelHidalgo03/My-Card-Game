import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import anime from 'animejs';
import { ReactComponent as LogoGrande } from '../../img/Logo_Grande2.svg';

const LogoAnimation = forwardRef((props, ref) => {
  const svgRef = useRef(null);
  const timelineRef = useRef(null);
  const cartasAnimsRef = useRef([]);
  const wrapperRef = useRef(null);

  // Forzar reflow para máxima compatibilidad iOS/Android
  useEffect(() => {
    const trySetSVGRef = () => {
      if (wrapperRef.current) {
        const svg = wrapperRef.current.querySelector('svg');
        if (svg) {
          svgRef.current = svg;
          svg.style.display = 'none';
          void svg.offsetHeight;
          svg.style.display = '';
        }
      }
    };
    trySetSVGRef();
    if (!svgRef.current) {
      setTimeout(trySetSVGRef, 50);
    }
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = svgRef.current;

    // Animación de líneas (igual que antes)
    const lineasIds = [
      '#Linea_1', '#Linea_2', '#Linea_3', '#Linea_4',
      '#Linea_5', '#Linea_6', '#Linea_7', '#Linea_8',
      '#Linea_10', '#Linea_11'
    ];
    const lineas = lineasIds
      .map(id => svg.querySelector(id))
      .filter(Boolean);

    lineas.forEach(path => {
      const length = path.getTotalLength();
      path.style.strokeDasharray = length;
      path.style.strokeDashoffset = length;
      path.style.opacity = 1;
    });

    const timeline = anime.timeline({ loop: true, direction: 'alternate', autoplay: true });
    timelineRef.current = timeline;

    timeline.add({
      targets: lineas,
      strokeDashoffset: [anime.setDashoffset, 0],
      easing: 'easeInOutSine',
      duration: 1200,
      delay: (el, i) => i * 200,
      opacity: [
        { value: 1, duration: 0 },
        { value: 1, duration: 1200 }
      ]
    });

    // Latido del logo (layer1)
    const layer1 = svg.querySelector('#layer1');
    if (layer1) {
      anime({
        targets: layer1,
        scale: [
          { value: 1.1, duration: 400 },
          { value: 1, duration: 400 }
        ],
        easing: 'easeInOutSine',
        loop: true,
        direction: 'alternate',
        autoplay: true
      });
    }

    // Animación de cartas
    const cartaIds = [
      { id: '#Carta_0', fromX: 0, fromY: 500, delay: 0 },
      { id: '#Carta_5', fromX: -500, fromY: 0, delay: 300 },
      { id: '#Carta_2', fromX: 500, fromY: 0, delay: 600 },
      { id: '#Carta_8', fromX: 0, fromY: -500, delay: 800 }
    ];

    cartasAnimsRef.current = [];

    const animateCarta = (carta, fromX, fromY, delay) => {
      if (!carta) return;
      // Guarda el transform original solo la primera vez
      let originalTransform = carta.getAttribute('data-original-transform');
      if (!originalTransform) {
        originalTransform = carta.getAttribute('transform') || '';
        carta.setAttribute('data-original-transform', originalTransform);
      }
      // Siempre restaura el transform original antes de animar
      carta.setAttribute('transform', originalTransform);
      carta.style.opacity = '0';

      const anim = anime({
        targets: { progress: 0 },
        progress: 1,
        delay,
        duration: 2000,
        easing: 'easeOutBack',
        update: (anim) => {
          const p = anim.animations[0].currentValue;
          const translateX = fromX * (1 - p);
          const translateY = fromY * (1 - p);
          // Aplica el translate ANTES del transform original
          carta.setAttribute(
            'transform',
            `translate(${translateX},${translateY}) ${originalTransform}`
          );
          carta.style.opacity = p;
        },
        complete: () => {
          carta.setAttribute('transform', originalTransform);
          carta.style.opacity = '1';
        }
      });
      cartasAnimsRef.current.push({ anim, carta, originalTransform });
    };

    // Ejecuta la animación para cada carta
    cartaIds.forEach(({ id, fromX, fromY, delay }) => {
      const carta = svg.querySelector(id);
      animateCarta(carta, fromX, fromY, delay);
    });

    return () => {
      timeline.pause();
      timelineRef.current = null;
      cartasAnimsRef.current.forEach(({ anim }) => anim.pause());
      cartasAnimsRef.current = [];
    };
  }, [svgRef.current]);

  useImperativeHandle(ref, () => ({
    stopAnimation: () => {
      if (timelineRef.current) timelineRef.current.pause();
      cartasAnimsRef.current.forEach(({ anim }) => anim.pause());
    }
  }));

  return (
    <span
      className="logo-animation-wrapper"
      ref={wrapperRef}
    >
      <LogoGrande className={props.className || ''} />
    </span>
  );
});

export default LogoAnimation;