import { useEffect, useRef, useState } from 'react';
import anime from 'animejs';
import './Fondo.css';

// SVG para PC
const SvgPc = (props) => (
  <svg
    ref={props.svgRef}
    id="visual"
    viewBox="0 0 960 540"
    width="100%"
    height="100%"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs id="defs7" />
    <path d="M0 82L120 55L240 55L360 28L480 77L600 66L720 39L840 28L960 71L960 0L840 0L720 0L600 0L480 0L360 0L240 0L120 0L0 0Z" fill="#FFFFFF" id="layer1" />
    <path d="M0 104L120 104L240 120L360 77L480 114L600 120L720 104L840 87L960 136L960 69L840 26L720 37L600 64L480 75L360 26L240 53L120 53L0 80Z" fill="#FFFFFF" id="layer2" />
    <path d="M0 152L120 190L240 228L360 158L480 217L600 179L720 195L840 147L960 212L960 134L840 85L720 102L600 118L480 112L360 75L240 118L120 102L0 102Z" fill="#FFFFFF" id="layer3" />
    <path d="M0 293L120 352L240 374L360 249L480 341L600 336L720 266L840 320L960 379L960 210L840 145L720 193L600 177L480 215L360 156L240 226L120 188L0 150Z" fill="#FFFFFF" id="layer4" />
    <path d="M0 347L120 390L240 395L360 298L480 395L600 384L720 320L840 379L960 438L960 377L840 318L720 264L600 334L480 339L360 247L240 372L120 350L0 291Z" fill="#FFFFFF" id="layer5" />
    <path d="M0 395L120 465L240 428L360 384L480 460L600 449L720 406L840 444L960 482L960 436L840 377L720 318L600 382L480 393L360 296L240 393L120 388L0 345Z" fill="#FFFFFF" id="layer6" />
    <path d="M0 541L120 541L240 541L360 541L480 541L600 541L720 541L840 541L960 541L960 480L840 442L720 404L600 447L480 458L360 382L240 426L120 463L0 393Z" fill="#FFFFFF" id="layer7" />
  </svg>
);

// SVG para móvil
const SvgMobile = (props) => (
  <svg
    ref={props.svgRef}
    id="visual"
    viewBox="0 0 540 1100"
    width="100%"
    height="100%"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs id="defs7" />
    <path d="m 0,234.80738 h 54 l 54,-97.51563 54,-12.83101 54,24.37891 54,98.79873 54,-24.37891 h 54 l 54,-50.04091 54,37.20991 54,37.20991 V 0 H 486 432 378 324 270 216 162 108 54 0 Z" fill="#FFFFFF" id="layer1" />
    <path d="m 0,349.57734 54,-13.12255 54,-125.97641 54,-49.86566 54,87.92103 54,51.17792 54,-13.12254 54,62.98821 54,-101.04359 54,87.92104 54,-24.93283 v -90.54555 l -54,-38.05537 -54,-38.05538 -54,51.17792 H 324 L 270,220.97641 216,119.93283 162,95 108,108.12254 54,207.85387 H 0 Z" fill="#FFFFFF" id="layer2" />
    <path d="m 1.1877909,650.64769 54.0000001,-128.45068 53.999999,-104.2147 54,127.23888 54,-69.07254 h 54 l 54,35.14217 h 54 l 54,-35.14217 54,139.35687 54,-93.30851 V 287.10803 l -54,23.02418 -54,-81.19053 -54,93.30852 -54,-58.16635 -54,12.11799 -54,-47.26016 -54,-81.19052 -54,46.04836 L 55.187791,310.13221 1.1877909,322.2502 Z" fill="#FFFFFF" id="layer3" />
    <path d="m 0,905.41088 54,-96.47481 54,-41.75775 54,-54.71706 54,179.99032 54,-138.23257 54,12.95931 54,69.11628 54,-82.07559 54,192.94963 54,-83.51551 V 487.83334 l -54,110.87404 -54,-165.5911 -54,41.75776 H 324 L 270,433.11628 H 216 L 162,515.19187 108,364 54,487.83334 0,640.46513 Z" fill="#FFFFFF" id="layer4" />
    <path d="M 4.5668513,933.61342 55.41306,785.25893 h 54.00002 l 52.034,-92.48072 58.34158,204.22826 50.43663,-167.62131 h 54 l 55.59737,75.14058 52.81221,-55.87376 58.7102,221.56839 50.84621,-148.35449 -2.04791,-96.33408 -51.62442,111.74753 -59.48841,-258.17534 -51.66538,109.82086 -55.966,-92.48074 -54.36862,-17.34012 -50.06801,184.96144 -59.11978,-240.83522 -52.44359,73.2139 L 52.586937,652.3179 1.331145,781.40557 Z" fill="#FFFFFF" id="layer5" />
    <path d="m 0,1009.3818 54,-126.76494 54,79.02231 54,-46.09634 54,79.0223 54,-111.94827 54,64.20563 54,47.74264 54,-47.74264 54,79.02231 54,-95.4853 V 800.30197 L 486,927.06691 432,737.74264 378,785.48528 324,721.27966 H 270 L 216,864.50759 162,690 108,769.02231 H 54 L 0,895.78725 Z" fill="#FFFFFF" id="layer6" />
    <path d="m 0,1110.6616 h 54 54 54 54 54 54 54 54 54 54 V 881.16139 L 486,985.97254 432,899.23228 378,951.63785 324,899.23228 270,828.75582 216,951.63785 162,864.89759 108,915.49608 54,828.75582 0,967.90165 Z" fill="#FFFFFF" id="layer7" />
  </svg>
);

// Responsive utility
function useScreen() {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => {
    const onResize = () => setW(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return w;
}

export default function BgMountains() {
  const w = useScreen();
  const svgRef = useRef();

  // Responsive: choose SVG
  const isMobile = w < 700;
  const SvgComponent = isMobile ? SvgMobile : SvgPc;

  // Parallax scroll (only desktop)
  useEffect(() => {
    if (isMobile) return;
    const svg = svgRef.current;
    if (!svg) return;
    const layers = [
      '#layer1', '#layer2', '#layer3', '#layer4', '#layer5', '#layer6', '#layer7'
    ].map(sel => svg.querySelector(sel)).filter(Boolean);

    const onScroll = () => {
      const y = window.scrollY;
      layers.forEach((el, idx) => {
        el.style.transform = `translateY(${y * (idx + 5) * 0.04}px)`;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [w, isMobile]);

  // Animaciones
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const layers = [
      '#layer1', '#layer2', '#layer3', '#layer4', '#layer5', '#layer6', '#layer7'
    ].map(sel => svg.querySelector(sel)).filter(Boolean);

    anime.remove(layers);

    const colors = [
      '#c868f5', // Morada
      '#11a4a2', // Azul
      '#d2f562', // Verde
      '#ff8444', // Naranja
      '#e8d9be' // Beige
    ];

    // Color para ambos (PC y móvil)
    anime({
      targets: layers,
      fill: colors,
      duration: 8000,
      delay: anime.stagger(200),
      loop: true,
      direction: 'alternate',
      easing: 'linear'
    });

    // "Respiración" solo en PC
    if (!isMobile) {
      anime({
        targets: layers,
        translateY: (el, i) => [0, (i + 1) * 12],
        easing: 'easeInOutSine',
        duration: 9000,
        loop: true,
        direction: 'alternate',
        delay: anime.stagger(120),
      });
    }

    return () => anime.remove(layers);
  }, [w, isMobile]);

  // SVG debe ocupar todo el fondo
  return (
    <div className="bg-svg-wrapper bg-lg" style={{
      width: '100vw',
      height: '100vh',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: -2,
      pointerEvents: 'none',
      overflow: 'hidden'
    }}>
      <SvgComponent svgRef={svgRef} />
    </div>
  );
}
