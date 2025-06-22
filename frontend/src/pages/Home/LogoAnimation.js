import React, { useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import anime from 'animejs';
import { ReactComponent as LogoGrande } from '../../img/Logo_Grande2.svg';

const LogoAnimation = forwardRef((props, ref) => {
  const wrapperRef = useRef(null);
  const svgRef = useRef(null);
  const timelineRef = useRef(null);
  const cartasAnimsRef = useRef([]);

  // Asigna el ref al SVG real cuando el wrapper cambia
  const setSVGRef = useCallback(() => {
    if (wrapperRef.current) {
      const svg = wrapperRef.current.querySelector('svg');
      if (svg) {
        svgRef.current = svg;
        // Forzar reflow para iOS/Android
        svg.style.display = 'none';
        void svg.offsetHeight;
        svg.style.display = '';
      }
    }
  }, []);

  // Ejecuta setSVGRef cuando el wrapper cambia
  useEffect(() => {
    setSVGRef();
  });

  // Animación principal, solo cuando el SVG está presente
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = svgRef.current;

    // Selecciona los paths de las líneas por id
    const lineasIds = [
      '#Linea_1', '#Linea_2', '#Linea_3', '#Linea_4',
      '#Linea_5', '#Linea_6', '#Linea_7', '#Linea_8',
      '#Linea_10', '#Linea_11'
    ];
    const lineas = lineasIds
      .map(id => svg.querySelector(id))
      .filter(Boolean);

    // Prepara los paths para la animación de dibujo
    lineas.forEach(path => {
      const length = path.getTotalLength();
      path.style.strokeDasharray = length;
      path.style.strokeDashoffset = length;
      path.style.opacity = 1;
    });

    // Animación de dibujo y desdibujo en loop
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
    const carta0 = svg.querySelector('#Carta_0');
    const carta5 = svg.querySelector('#Carta_5');
    const carta2 = svg.querySelector('#Carta_2');
    const carta8 = svg.querySelector('#Carta_8');

    cartasAnimsRef.current = [];

    const animateCarta = (carta, fromX, fromY, delay) => {
      if (!carta) return;
      const originalTransform = carta.getAttribute('transform') || '';
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

    animateCarta(carta0, 0, 500, 0);
    animateCarta(carta5, -500, 0, 300);
    animateCarta(carta2, 500, 0, 600);
    animateCarta(carta8, 0, -500, 800);

    return () => {
      timeline.pause();
      timelineRef.current = null;
      cartasAnimsRef.current.forEach(({ anim }) => anim.pause());
      cartasAnimsRef.current = [];
    };
  }, [svgRef.current]);

  // Exponer métodos al padre si lo necesitas
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