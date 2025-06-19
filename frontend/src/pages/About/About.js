import React, { useState } from 'react';
import './About.css';

const About = () => {
  const [seccion, setSeccion] = useState('nosotros');

  const NavBotones = (
    <div className="about-nav">
      <div className="about-nav-buttons">
        <button onClick={() => setSeccion('nosotros')}>👥 Sobre nosotros</button>
        <button onClick={() => setSeccion('equipo')}>👨‍💻 Nuestro equipo</button>
        <button onClick={() => setSeccion('idea')}>💡 Cómo surgió la idea</button>
        <button onClick={() => setSeccion('herramientas')}>🛠️ Herramientas</button>
      </div>
    </div>
  );

  return (
    <div className="about-page">
  

      {seccion === 'nosotros' && (
        <div className="about-section">
            {NavBotones}
          <h1>Sobre nosotros</h1>
          <p>
            Somos tres estudiantes apasionados por el desarrollo y los videojuegos. Este proyecto forma parte de nuestro Trabajo de Fin de Grado, y decidimos crearlo porque queríamos hacer algo que no solo fuese funcional, sino también divertido, visual y original.
            <br /><br />
            Desde siempre nos han encantado los juegos de cartas, y por eso quisimos reinventar el clásico UNO con un toque diferente, moderno y con un humor más cercano a nuestra generación. Nuestro objetivo era claro: crear un juego fácil de entender, pero con reglas inesperadas y cartas especiales que dieran giros divertidos a cada partida.
            <br /><br />
            Más que un trabajo académico, esto es para nosotros una forma de demostrar lo que podemos hacer cuando combinamos diseño, programación y creatividad. Y por supuesto, esperamos que quienes jueguen se lo pasen tan bien como nosotros desarrollándolo.
          </p>
        </div>
      )}

      {seccion === 'equipo' && (
        <div className="about-section">
            {NavBotones}
          <h2>Nuestro equipo</h2>
          <div className="team">
            <div className="team-member">
              <img src="/assets/team/member1.jpg" alt="Miembro 1" className="team-image" />
              <h3>Miguel Ángel Hidalgo Martínez</h3>
              <p>Full Stack Web Developer</p>
            </div>
            <div className="team-member">
              <img src="/assets/team/member2.jpg" alt="Miembro 2" className="team-image" />
              <h3>Juan Aleksander Chango Zaruma</h3>
              <p>Full Stack Web Developer</p>
            </div>
            <div className="team-member">
              <img src="/assets/team/member3.jpg" alt="Miembro 3" className="team-image" />
              <h3>Kang Ping Ye</h3>
              <p>Full Stack Web Developer</p>
            </div>
          </div>
        </div>
      )}

      {seccion === 'idea' && (
        <div className="about-section">
            {NavBotones}
          <h2>Cómo surgió la idea</h2>
          <p>
            Estábamos en clase, una de esas famosas guardias en las que el tiempo parece ir más lento que el compilador de Java. Por aburrimiento (y por espíritu competitivo, no vamos a mentir), abrimos un UNO online para echar unas partidas rápidas. Entre risas, piques absurdos y frases tipo “¡no me lo puedo creer, otra +4!”, algo hizo clic.
            <br /><br />
            Justo ese mismo día, como si el destino hubiese repartido su propia carta especial, nos comunicaron que había que pensar en una idea para el Trabajo de Fin de Grado.
            <br /><br />
            Y ahí, en medio del caos digital de colores, robas, saltos de turno y alguna que otra trampa amistosa, surgió la chispa.
            <br /><br />
            ¿Y si creamos nuestra propia versión del UNO?<br />
            ¿Y si lo hacemos con cartas absurdas, pero divertidas?<br />
            ¿Y si… este juego es nuestro TFG?
            <br /><br />
            Así nació la idea. No en un laboratorio, ni en una lluvia de ideas seria. Nació en una guardia, con un juego de cartas y tres mentes que no sabían si se estaban distrayendo… o empezando algo épico.
          </p>
        </div>
      )}

      {seccion === 'herramientas' && (
        <div className="about-section">
            {NavBotones}
          <h2>Herramientas que Usamos</h2>
          <ul>
            <li>React para el desarrollo frontend.</li>
            <li>Node.js y Express para el backend.</li>
            <li>MongoDB para la base de datos.</li> {/* Aquí faltaba el nombre de la BD */}
            <li>Figma para el diseño de interfaces.</li>
            <li>GitHub para la colaboración y control de versiones.</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default About;
