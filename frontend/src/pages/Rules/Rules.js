import React, { useState, useRef } from 'react';
import './Rules.css';
import CartaSprite from './CartaSprite';
import {useTheme, useMediaQuery } from '@mui/material';

const Rules = () => {
  const [seccion, setSeccion] = useState('cartas'); // Sección inicial
  const [cartaIndex, setCartaIndex] = useState(0); // índice para cartas especiales
  const carouselRef = useRef(null);
  const scrollByAmount = 200;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const cartasEspeciales = [
    {
      nombre: "lumos.svg",
      alt: "Carta Hechizo Lumos",
      descripcion: "Carta “Hechizo Lumos”: Inspirada en Harry Potter. El jugador que la use puede mirar cartas del oponente, dependiendo del número de la carta."
    },
    {
      nombre: "perder_apuesta.svg",
      alt: "Carta Perdí mi apuesta",
      descripcion: "Carta “Perdí mi apuesta”: Te permite intercambiar tu mano completa con la del oponente."
    },
    {
      nombre: "multa.svg",
      alt: "Carta Multa por ser tan sexy",
      descripcion: "Carta “Multa por ser tan sexy”: Impide que el rival use un tipo de carta concreta durante 1 o 2 turnos."
    },
    {
      nombre: "ten_huevos_robar.svg",
      alt: "Carta Ten huevos a robar",
      descripcion: "Carta “Ten huevos a robar”: El oponente tendrá que robar todas las cartas durante los dos próximos turnos."
    },
    {
      nombre: "1pa1_sin_camiseta.svg",
      alt: "Carta 1 pa 1 sin camiseta",
      descripcion: "Carta “1 pa 1 sin camiseta”: Ambos jugadores tiran su carta más alta. El que tenga la más baja roba dos cartas."
    },
    {
      nombre: "misteriosa.svg",
      alt: "Carta Misteriosa",
      descripcion: "Carta “Misteriosa”: Se elige una carta especial al azar para aplicar su efecto."
    },
    {
      nombre: "lgtb.svg",
      alt: "Carta LGTB",
      descripcion: "Carta “LGTB”: Cambia el color de todas las cartas normales de un jugador."
    }
  ];

const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -scrollByAmount, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: scrollByAmount, behavior: 'smooth' });
    }
  };

  const NavBotones = (
  <div className="rules-nav">
    <div className="rules-nav-buttons">
      <button onClick={() => setSeccion('cartas')}>✨ Cartas Especiales</button>
      <button onClick={() => setSeccion('modos')}>⚙️ Modos de Juego</button>
    </div>
  </div>
  );
 
  return (
   <div className="rules-page">
    {/* Contenido dinámico */}
       {seccion === 'cartas' && (
        <div className="rules-section">
          {NavBotones}
          <h2>✨ Cartas Especiales</h2>

          <div className="carousel-buttons">
            <button onClick={scrollLeft}>⬅️ </button>
            <button onClick={scrollRight}>➡️</button>
          </div>

          <div className="mini-carousel" ref={carouselRef}>
            {cartasEspeciales.map((carta, index) => (
              <div
                key={index}
                className={`mini-card-wrapper ${index === cartaIndex ? 'active' : ''}`}
                onClick={() => setCartaIndex(index)}
              >
                <CartaSprite
                  nombre={carta.nombre}
                  className="mini-card"
                  alt={carta.alt}
                  scale={isMobile ? 0.2 : 0.25}                />
                <div className="mini-card-name">{carta.alt}</div>
              </div>
            ))}
          </div>

         <div className="special-card big-card">
  <CartaSprite
    nombre={cartasEspeciales[cartaIndex].nombre}
    className="special-card-image-large"
    alt={cartasEspeciales[cartaIndex].alt}
    scale={isMobile ? 0.4 : 0.7}
  />

  {/* NUEVO CONTENEDOR SOLO PARA MÓVIL */}
  <div className={`big-card-nav-wrapper ${isMobile ? 'mobile' : ''}`}>
    <button
      className="big-card-nav left"
      onClick={() =>
        setCartaIndex((prev) => (prev === 0 ? cartasEspeciales.length - 1 : prev - 1))
      }
    >
      ⬅️
    </button>
    <button
      className="big-card-nav right"
      onClick={() =>
        setCartaIndex((prev) => (prev === cartasEspeciales.length - 1 ? 0 : prev + 1))
      }
    >
      ➡️
    </button>
     </div>

     <h3 className="big-card-name">{cartasEspeciales[cartaIndex].alt}</h3>
     <p className="card-description">{cartasEspeciales[cartaIndex].descripcion}</p>
    </div>
        </div>
      )}
      {seccion === 'modos' && (
        <div className="rules-section">
          {NavBotones}
          <h2>⚙️ Modos de Juego</h2>

          <div className="special-card">
            <img src="/assests/img/GameModes/ClassicMode.png" alt="🚫 Modo Clásico" className="special-card-image" />
            <p><strong>🚫 Modo Clásico:</strong> El juego clásico sin nuestras cartas especiales.</p>
          </div>
          
          <div className="special-card">
        <div className="image-container coming-soon">
            <img src="/assests/img/GameModes/1pa1mode.png" alt="🎲 Modo Normal" className="special-card-image" />
            <span className="coming-soon-badge">Próximamente</span>
       </div>
          <p><strong>🎲 Modo Normal:</strong> Se juega con las reglas estándar y nuestras cartas especiales.</p>
      </div>

      <div className="special-card">
       <div className="image-container coming-soon">
         <img src="/assests/img/GameModes/FastMode.png" alt="⏱️ Modo Rápido" className="special-card-image" />
         <span className="coming-soon-badge">Próximamente</span>
       </div>
          <p><strong>⏱️ Modo Rápido (Contrarreloj):</strong> Perfecto para partidas cortas y emocionantes.</p>
      </div>

      <div className="special-card">
       <div className="image-container coming-soon">
         <img src="/assests/img/GameModes/Challenge.png" alt="🎯 Modo Desafío" className="special-card-image" />
         <span className="coming-soon-badge">Próximamente</span>
       </div>
         <p><strong>🎯 Modo Desafío:</strong> Objetivos adicionales en cada partida.</p>
      </div>
      </div>
      )}
    </div>
  );
};

export default Rules;
