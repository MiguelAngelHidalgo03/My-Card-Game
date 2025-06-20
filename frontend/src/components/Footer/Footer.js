import React from 'react';
import './Footer.css';

function Footer() {
  return (
    <div className="footer">
      <div className="footer-content">
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
        <p>
          <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">
            <img class="creativeImg" src="https://licensebuttons.net/l/by-sa/4.0/88x31.png" alt="Licencia Creative Commons" />
          </a>
          </p>
          <p class="CC">
          Esta obra está bajo una{' '}
          <a class="creativeEn" href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">
             licencia de Creative Commons Reconocimiento - Compartir Igual 4.0 Internacional
          </a>.
        </p>
      </div>
    </div>
  );
}

export default Footer;