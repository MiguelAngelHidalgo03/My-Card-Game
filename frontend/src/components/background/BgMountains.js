import { ReactComponent as BgSm } from '../../img/backgroundMovil.svg';
import { ReactComponent as BgMd } from '../../img/backgroundtablet.svg';
import { ReactComponent as BgLg } from '../../img/backgroundPCA.svg';
import { useEffect, useState } from 'react';
import './Fondo.css';
import anime from 'animejs';

function useScreen() {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => {
    const onResize = () => setW(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return w;
}

export default function BgMountains({ pulseTrigger }) {
  const w = useScreen();

  const colors = ['#64E9F5', '#D2F567', '#C868F5', '#F5A267'];
  const [bgColor, setBgColor] = useState('#0b0b0b');
  const [index, setIndex] = useState(0);
  const [currentColor, setCurrentColor] = useState(colors[0]);

  let Svg, sizeClass;
  if (w < 1050) {
    Svg = BgSm;
    sizeClass = 'bg-sm';
  } else if (w < 1600) {
    Svg = BgMd;
    sizeClass = 'bg-md';
  } else {
    Svg = BgLg;
    sizeClass = 'bg-lg';
  }

   // Animación de escala tras 1 segundo
useEffect(() => {
  const timeout = setTimeout(() => {
    anime({
      targets: '.bg-svg-wrapper',
      scale: [0, 1],
      duration: 1200,
      easing: 'easeOutExpo',
    });
  }, 1000);
  return () => clearTimeout(timeout);
}, []);

// Loop de cambio de color tras 1 segundo, cada 1 segundo
useEffect(() => {
  let interval;
  const timeout = setTimeout(() => {
    interval = setInterval(() => {
      setIndex(prevIndex => {
        const nextIndex = (prevIndex + 1) % colors.length;
        setBgColor(colors[nextIndex]);
        return nextIndex;
      });
    }, 1500); // cada 1 segundo
  }, 1000); // empieza tras 1 segundo

  return () => {
    clearTimeout(timeout);
    if (interval) clearInterval(interval);
  };
}, [colors]);

 return (
    <div
      className={`bg-svg-wrapper ${sizeClass}`}
      style={{
        '--dynamic-color': currentColor,
        filter: 'brightness(0.7) saturate(0.7)',
        transformOrigin: 'center',
        scale: 1,
      }}
  >
    <div className="bg-color-layer" style={{ backgroundColor: bgColor }} />
    <div className="tv-effect">
      <Svg />
    </div>
  </div>
);
}