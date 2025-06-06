import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import anime from 'animejs';
import { ReactComponent as LogoGrande } from '../../img/Logo_Grande2.svg';

const LogoAnimation = forwardRef((props, ref) => {
  const svgRef = useRef(null);
  const timelineRef = useRef(null);
  const cartasAnimsRef = useRef([]);

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
      // layer1.setAttribute('transform', 'scale(1)');
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

    // Guardar instancias de animaciones para poder detenerlas
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
      // Detener animaciones de cartas si el componente se desmonta
      cartasAnimsRef.current.forEach(({ anim }) => anim.pause());
      cartasAnimsRef.current = [];
    };
  }, []);

  // Método para detener la animación y resetear estilos

  return <LogoGrande ref={svgRef} />;
});

export default LogoAnimation;