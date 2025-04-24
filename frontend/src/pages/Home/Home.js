import React, { useState } from 'react';
import './Home.css';
import fondoHome from '../../img/fondo_home.png'; // Ruta corregida

const Home = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const videoDemo = null; // Temporalmente null para simular la ausencia del video

  return (
    <div className="home">
      {/* Sección principal con el texto */}
      <div className="home-main">
        <div className="home-text">
          <h1>1pa1™ Web ya está disponible en todo el mundo</h1>
          <p>¡Ven y juega uno de los mejores juegos de cartas del mundo!</p>
          <button className="play-button" onClick={openModal}>¡Jugar!</button>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>×</button>
            <h2 className="modal-title">Elige una opción</h2>
            <button className="modal-button">Crear sala</button>
            <button className="modal-button">Unirse a una sala</button>
          </div>
        </div>
      )}

      {/* Sección de reglas */}
      <div className="home-rules">
        <div className="rules-image">
          <a href="/rules">
            <img src={require('../../img/img_rules.webp')} alt="Reglas" />
          </a>
        </div>
        <div className="rules-text">
          <div className="rule-item">Aprende a jugar 1pa1 en minutos.</div>
          <div className="rule-item">Domina las reglas y conviértete en un profesional.</div>
          <div className="rule-item">¡Reta a tus amigos y familiares!</div>
        </div>
      </div>

      {/* Sección del video */}
      <div className="home-video">
        {videoDemo ? (
          <video src={videoDemo} controls />
        ) : (
          <div className="video-placeholder">
            <p>El video estará disponible pronto.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
