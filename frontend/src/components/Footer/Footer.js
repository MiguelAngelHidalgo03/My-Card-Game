import React from 'react';
import './Footer.css';

function Footer() {
  return (
    <div className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h4>Contactos</h4>
          <p>Miguel Ángel</p>
          <p>Kang Ping</p>
          <p>Juan Aleksander</p>
        </div>
        <div className="footer-section">
          <h4>GitHub</h4>
          <ul>
            <li><a href="https://github.com/MiguelAngelHidalgo03" target="_blank" rel="noopener noreferrer">Miguel Ángel</a></li>
            <li><a href="https://github.com/KiRy15" target="_blank" rel="noopener noreferrer">Kang Ping</a></li>
            <li><a href="https://github.com/jchangoz" target="_blank" rel="noopener noreferrer">Juan Aleksander</a></li>
            <li><a href="https://github.com/MiguelAngelHidalgo03/My-Card-Game" target="_blank" rel="noopener noreferrer">Proyecto 1pa1</a></li>
          </ul>
        </div>
        <div className="footer-section">
          <h4>LinkedIn</h4>
          <ul>
            <li><a href="https://www.linkedin.com/in/miguelangelhidalgomartinez/" target="_blank" rel="noopener noreferrer">Miguel Ángel</a></li>
            <li><a href="https://linkedin.com/in/kang-ping" target="_blank" rel="noopener noreferrer">Kang Ping</a></li>
            <li><a href="https://linkedin.com/in/juan-aleksander" target="_blank" rel="noopener noreferrer">Juan Aleksander</a></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© 2025 1pa1. Todos los derechos reservados.</p>
        <p>Creado con ❤️ por el equipo.</p>
        <div className="footer-links">
          <a href="/privacy-policy" className="footer-link">Privacy Policy</a>
          <span> | </span>
          <a href="/manage-cookies" className="footer-link">Manage Cookies</a>
        </div>
      </div>
    </div>
  );
}

export default Footer;