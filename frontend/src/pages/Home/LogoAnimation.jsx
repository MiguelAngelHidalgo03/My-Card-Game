import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import anime from 'animejs';
import { ReactComponent as LogoGrande } from '../../img/Logo_Grande.svg';

const LogoAnimation = forwardRef((props, ref) => {
  const svgRef = useRef(null);
  const timelineRef = useRef(null); // Guardar timeline aquí
  const cartasAnimRef = useRef([]);

  useEffect(() => {
    if (!svgRef.current) return;
    
    const svg = svgRef.current;

    const layer1 = svgRef.current.querySelector('#layer1');

    const lineasIzquierda = ['#Linea_1_grupo', '#Linea_2_grupo', '#Linea_3_grupo', '#Linea_4_grupo']
      .map(id => svgRef.current.querySelector(id))
      .filter(Boolean);

    const lineasDerecha = ['#Linea_8_grupo', '#Linea_7_grupo', '#Linea_6_grupo', '#Linea_5_grupo']
      .map(id => svgRef.current.querySelector(id))
      .filter(Boolean);

    const lineasAbajo = ['#Linea_11_grupo', '#Linea_10_grupo']
      .map(id => svgRef.current.querySelector(id))
      .filter(Boolean);
       // Establecer transform-origin para que las líneas crezcan desde el extremo correcto
 lineasIzquierda.forEach(linea => {
  linea.style.transformOrigin = 'left center';
  linea.style.transform = 'scaleX(1)';
  linea.style.opacity = '1';
});

lineasDerecha.forEach(linea => {
  linea.style.transformOrigin = 'right center';
  linea.style.transform = 'scaleX(1)';
  linea.style.opacity = '1';
});

lineasAbajo.forEach(linea => {
  linea.style.transformOrigin = 'center top';
  linea.style.transform = 'scaleY(1)';
  linea.style.opacity = '1';
});

    const carta0 = svgRef.current.querySelector('#Carta_0');
    const carta5 = svgRef.current.querySelector('#Carta_5');
    const carta2 = svgRef.current.querySelector('#Carta_2');
    const carta8 = svgRef.current.querySelector('#Carta_8');

    const borde = svgRef.current.querySelector('#Borde_1');

    const bordeRect = borde.getBoundingClientRect();

    const posInicialIzq = lineasIzquierda[0]?.getBoundingClientRect().x || 0;
    const posInicialDer = lineasDerecha[0]?.getBoundingClientRect().x || 0;
    const posInicialAba = lineasAbajo[0]?.getBoundingClientRect().y || 0;

    const extra = 2000; // cuánto sobrepasan el borde

    const distanciaIzq = posInicialIzq - (bordeRect.x - extra); // hacia la izquierda (positivo)
    const distanciaDer = (bordeRect.x + bordeRect.width + extra) - posInicialDer; // hacia la derecha
    const distanciaAbajo = (bordeRect.y + bordeRect.height + extra) - posInicialAba; // hacia abajo

    const timeline = anime.timeline({  loop: true, autoplay: true });

    timelineRef.current = timeline;
    
  // Líneas izquierda
    timeline.add({
      targets: lineasIzquierda,
      translateX: [
        { value: 0, duration: 0 },
        { value: -distanciaIzq, duration: 3000 }
      ],
      scale: [
        { value: 1, duration: 0 },
        { value: 4, duration: 3000 }
      ],
      opacity: [
        { value: 1, duration: 0 },
        { value: 0, duration: 500, delay: 2500 }
      ],
      easing: 'linear',
      duration: 3500,
      delay: (el, i) => i * 150
    }, 0);

    // Líneas derecha
    timeline.add({
      targets: lineasDerecha,
      translateX: [
        { value: 0, duration: 0 },
        { value: distanciaDer, duration: 3000 }
      ],
       scale: [
        { value: 1, duration: 0 },
        { value: 4, duration: 3000 }
      ],
      opacity: [
        { value: 1, duration: 0 },
        { value: 0, duration: 500, delay: 2500 }
      ],
      easing: 'linear',
      duration: 3500,
      delay: (el, i) => i * 150
    }, 0);

    // Líneas abajo
    timeline.add({
      targets: lineasAbajo,
      translateY: [
        { value: 0, duration: 0 },
        { value: distanciaAbajo, duration: 3000 }
      ],
      scale: [
        { value: 1, duration: 0 },
        { value: 4, duration: 3000 }
      ],
      opacity: [
        { value: 1, duration: 0 },
        { value: 0, duration: 500, delay: 2500 }
      ],
      easing: 'linear',
      duration: 3500,
      delay: (el, i) => i * 150
    }, 0);

 //latido
  timeline.add({
  targets: layer1,
  scale: [
    { value: 1.1, duration: 1750 },
    { value: 1, duration: 1750 }
  ],
  easing: 'easeInOutSine',
   begin: () => {
    if (props.onPulse) props.onPulse();
  },

}, 0);

     // === FUNCIÓN PARA ANIMAR HACIA POSICIÓN ORIGINAL ===
    const animateCarta = (carta, fromX, fromY, delay) => {
      if (!carta) return;

      const originalTransform = carta.getAttribute('transform') || '';

      // Inicial opacidad a 0
      carta.style.opacity = '0';

      anime({
        targets: { progress: 0 },
        progress: 1,
        delay: 500,
        duration: 2000,
        easing: 'easeOutBack',
        update: (anim) => {
          const p = anim.animations[0].currentValue;
          const translateX = fromX * (1 - p);
          const translateY = fromY * (1 - p);

          // Concatenar translate con transform original
          carta.setAttribute(
            'transform',
            `translate(${translateX},${translateY}) ${originalTransform}`
          );
          carta.style.opacity = p; // animar opacidad de 0 a 1
        },
        complete: () => {
          // Al final dejamos solo la matriz original
          carta.setAttribute('transform', originalTransform);
          carta.style.opacity = '1';
        }
      });
    };

    // Animar cartas con desplazamientos fijos (px)
    animateCarta(carta0, 0, 500, 0);      // desde abajo (+Y)
    animateCarta(carta5, -500, 0, 300);   // desde izquierda (-X)
    animateCarta(carta2, 500, 0, 600);    // desde derecha (+X)
    animateCarta(carta8, 0, -500, 800);   // desde arriba (-Y)

   
 return () => {
      timeline.pause();
      timelineRef.current = null;
    };
  }, []);
  


   // Método para detener la animación y resetear estilos
  useImperativeHandle(ref, () => ({
    stopAnimation: () => {
      if (!timelineRef.current) return;

      timelineRef.current.loop = false;
      timelineRef.current.seek(timelineRef.current.duration);
      timelineRef.current.pause();

      // Resetear transformaciones y opacidad a estado original
      const svg = svgRef.current;
      if (svg) {
        const lineasIzquierda = ['#Linea_1_grupo', '#Linea_2_grupo', '#Linea_3_grupo', '#Linea_4_grupo']
          .map(id => svg.querySelector(id))
          .filter(Boolean);
        const lineasDerecha = ['#Linea_8_grupo', '#Linea_7_grupo', '#Linea_6_grupo', '#Linea_5_grupo']
          .map(id => svg.querySelector(id))
          .filter(Boolean);
        const lineasAbajo = ['#Linea_11_grupo', '#Linea_10_grupo']
          .map(id => svg.querySelector(id))
          .filter(Boolean);
        const cartas = ['#Carta_0', '#Carta_5', '#Carta_2', '#Carta_8']
          .map(id => svg.querySelector(id))
          .filter(Boolean);
        const layer1 = svg.querySelector('#layer1');

        [...lineasIzquierda].forEach(linea => {
          linea.style.transformOrigin = 'left center';
          linea.style.transform = 'scaleX(1) translateX(0)';
          linea.style.opacity = '1';
        });
        [...lineasDerecha].forEach(linea => {
          linea.style.transformOrigin = 'right center';
          linea.style.transform = 'scaleX(1) translateX(0)';
          linea.style.opacity = '1';
        });
        [...lineasAbajo].forEach(linea => {
          linea.style.transformOrigin = 'center top';
          linea.style.transform = 'scaleY(1) translateY(0)';
          linea.style.opacity = '1';
        });

        cartas.forEach(carta => {
          carta.style.opacity = '1';
          carta.setAttribute('transform', '');
        });

        if (layer1) {
          layer1.style.transform = 'scale(1)';
        }
      }

      timelineRef.current = null;
      console.log('Animación terminada y estado reseteado.');
    }
  }));

  return <LogoGrande ref={svgRef}  />;
});

export default LogoAnimation;