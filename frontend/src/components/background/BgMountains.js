import { ReactComponent as BgSm } from '../../img/backgroundMovil.svg';
import { ReactComponent as BgMd } from '../../img/backgroundtablet.svg';
import { ReactComponent as BgLg } from '../../img/backgroundPCA.svg';
import { useEffect, useState } from 'react';
import anime from 'animejs';

/* hook para saber ancho de pantalla ------------------------ */
function useScreen() {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => {
    const onResize = () => setW(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return w;
}

/* componente ----------------------------------------------- */
export default function BgMountains() {
  const w = useScreen();               // se actualiza al resize

  /* elige SVG y clase */
  let Svg, sizeClass;
  if (w < 1050) {        // móvil
    Svg = BgSm;
    sizeClass = 'bg-sm';
  } else if (w < 1600){ // tablet / portátil
    Svg = BgMd;
    sizeClass = 'bg-md';
  } else {              // escritorio ancho
    Svg = BgLg;
    sizeClass = 'bg-lg';
  }

  /* ① parallax scroll ------------------------------------- */
  useEffect(() => {
    const layers = [
      'layer1','layer2','layer3','layer4','layer5','layer6','layer7'
    ].map(id => document.getElementById(id)).filter(Boolean);

    const onScroll = () => {
      const y = window.scrollY;
      layers.forEach((el, idx) => {
        el.style.transform = `translateY(${y * (idx + 5) * 0.04}px)`;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();                 // posición inicial
    return () => window.removeEventListener('scroll', onScroll);
  }, [w]);                      // se rehace al cambiar de SVG

  /* ② “respiración” lenta --------------------------------- */
  useEffect(() => {
    anime.remove('#layer1, #layer2, #layer3, #layer4, #layer5, #layer6, #layer7');

    anime({
      targets : ['#layer1','#layer2','#layer3','#layer4','#layer5','#layer6','#layer7'],
      translateY: (el,i)=>[0,(i+1)*3],
      direction : 'alternate',
      duration  : 2500,
      easing    : 'easeInOutSine',
      loop      : true,
      delay     : (el,i)=> i*30
    });
  }, [w]);                      // reinicia con el nuevo SVG

  return (
    <div className={`bg-svg-wrapper ${sizeClass}`}>
      <Svg />
    </div>
  );
}
