import React, { useEffect, useState, useRef } from 'react';
import './Home.css';
import anime from 'animejs';
import { Link } from 'react-router-dom';
import { animacionIntroGuantes } from './HomeAnimation.js';
import { initScrollAnimations } from './ScrollAnimation.js';
import video from '../../video/kitten.mp4';
import LogoAnimation from './LogoAnimation';
import './LogoAnimation.css';

const Home = ({ onPulse }) => {
  const [introDone, setIntroDone] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showLogo, setShowLogo] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [logoOculto, setLogoOculto] = useState(true);
  const logoRef = useRef(null);


  /* ─────────────────── Intro + cleanup ─────────────────── */
  useEffect(() => {
    // 1. bloquea scroll mientras corre la intro
    document.body.style.overflow = 'hidden';

    // 2. lanza la animación y guarda la instancia del timeline
    const tl = animacionIntroGuantes(() => {
      // callback al terminar la intro+
       setLogoOculto(false);
      setIntroDone(true);
      document.body.style.overflow = 'auto';   // restaura scroll
    });

    // 3. función de limpieza: se ejecuta al desmontar Home (cambiar de ruta)
    return () => {
      if (tl) tl.pause();          // detiene el timeline para que no siga corriendo
      anime.remove('*');
      document.body.style.overflow = 'auto';           // borra listeners que anime.js pudiera dejar
    };
  }, []);

  useEffect(() => {
    if (introDone) {
      initScrollAnimations();  // inicializamos las scroll-animations
    }
  }, [introDone]);
  useEffect(() => {
    if (introDone) {
      setLogoOculto(false);
    }
  }, [introDone]);

  useEffect(() => {
    if (!introDone) return;
    anime({
      targets: '#lineDrawing .lines path',
      strokeDashoffset: [anime.setDashoffset, 0],
      easing: 'easeInOutSine',
      duration: 1000,
      delay: (el, i) => i * 150,
      direction: 'alternate',
      loop: true
    });
  }, [introDone]);

  useEffect(() => {
    // Espera 2 segundos para mostrar el logo
    const timer = setTimeout(() => {
      setShowLogo(true);
    }, 2000);

    // Limpieza por si el componente se desmonta antes
    return () => clearTimeout(timer);
  }, []);

  const handleLogoClick = () => {
    if (window.innerWidth < 700) {
      setModalOpen(true);
      return;
    }
    setShowOptions(prev => !prev);

    if (logoRef.current) {
      logoRef.current.stopAnimation && logoRef.current.stopAnimation();
      // console.log('Click detectado y animación detenida');
    }
  };

  return (
    <>
      <div className="home">

        {!introDone && (
          <>
            <div className="impact-wave" id="impact-wave"></div>
            <div className="flash-effect" id="flash-effect"></div>
            <div className="intro-container">
              <img
                src={require('../../img/guanteDerecho.png')}
                alt="Guante Izquierdo"
                className="guante-izquierdo"
              />
              <img
                src={require('../../img/guante.png')}
                alt="Guante Derecho"
                className="guante-derecho"
              />
            </div>
          </>
        )}

        <div id="confeti-container"></div>

        <div className={`container ${showOptions ? 'show-options' : ''}`}>
          <div
            className={`logo-container ${showOptions ? 'moved-right' : ''}`}
            onClick={handleLogoClick}
            style={{ cursor: 'pointer' }}
            aria-label="Toggle options"
          >
            {showLogo && (
              <div className="logo-wrapper">
                <LogoAnimation ref={logoRef}
                  className={`logo-normal${logoOculto ? ' logo-oculto' : ''}`}
                  aria-label="Logo"
                  onPulse={onPulse} />
                <div className={`options-container${showOptions ? ' visible' : ''}`}>
                  <Link to="/create-lobby" className="option-button osu-style-button">
                    Crear Sala
                  </Link>
                  <Link to="/join-lobby" className="option-button osu-style-button">
                    Unirse a una Sala
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CONTENIDO PRINCIPAL (siempre en el DOM, oculto hasta introDone) */}
        <div id="page-content" className="page-content">

          {/* ─── BLOQUE 1: Home Main ───────────────────────── */}
          <div className="home-main"></div>

          {/* ─── BLOQUE 3: Reglas ──────────────────────────── */}

          {/* ─── BLOQUE 4: Vídeo ───────────────────────────── */}


        </div>
        <OptionsModal visible={modalOpen} onClose={() => setModalOpen(false)} />

      </div>
    </>
  );
};

export default Home;

function OptionsModal({ visible, onClose }) {
  if (!visible) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <Link to="/create-lobby" className="option-button osu-style-button">
          Crear Sala
        </Link>
        <Link to="/join-lobby" className="option-button osu-style-button">
          Unirse a una Sala
        </Link>
        <button className="close-modal" onClick={onClose}>Cerrar</button>
      </div>
    </div>
  );
}