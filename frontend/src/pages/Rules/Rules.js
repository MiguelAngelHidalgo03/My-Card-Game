import React from 'react';
import './Rules.css';

const Rules = () => {
  return (
    <div className="rules-page">
      {/* Sección de reglas */}
      <div className="rules-section">
        <h1>🎯 Objetivo del Juego</h1>
        <p className="highlight">
          El objetivo principal es ser el primer jugador en quedarse sin cartas en la mano.
        </p>
        <p>
          Para lograrlo, los jugadores deben ir colocando cartas que coincidan en color o número con la que está en la pila del centro. Si no pueden jugar, deben robar una carta. Quien se quede sin cartas primero, gana la partida.
        </p>
      </div>

      {/* Sección Preparación */}
      <div className="rules-section">
        <h2>🛠️ Preparación del Juego</h2>
        <ul className="rules-list">
          <li>Se puede jugar entre 2 o más personas.</li>
          <li>Cada jugador recibe entre 7 y 10 cartas (pueden decidirlo al inicio).</li>
          <li>Se coloca una carta boca arriba en el centro para comenzar la pila de descarte.</li>
          <li>El resto de las cartas forman la pila de robo.</li>
        </ul>
      </div>

      {/* Sección Turnos */}
      <div className="rules-section">
        <h2>🔁 Turnos</h2>
        <ul className="rules-list">
          <li>En su turno, cada jugador debe jugar una carta que coincida en color o número con la carta superior de la pila de descarte.</li>
          <li>Si no puede jugar, debe robar una carta.</li>
          <li>Si la carta robada puede jugarse, puede lanzarla inmediatamente.</li>
          <li>Si no, su turno termina.</li>
        </ul>
      </div>

      {/* Sección de cartas especiales */}
      <div className="rules-section">
        <h2>✨ Cartas Especiales</h2>
        <div className="special-card">
          <img src="/assets/cards/lumos.jpg" alt="Carta Hechizo Lumos" className="special-card-image" />
          <p><strong>🔮 Carta “Hechizo Lumos”:</strong> Inspirada en Harry Potter. El jugador que la use puede mirar cartas del oponente, dependiendo del número de la carta (por ejemplo, ver 2 cartas si es un 2). Así puedes anticipar sus jugadas.</p>
        </div>
        <div className="special-card">
          <img src="/assets/cards/intercambio.jpg" alt="Carta Perdí mi apuesta" className="special-card-image" />
          <p><strong>♻️ Carta “Perdí mi apuesta”:</strong> Te permite intercambiar tu mano completa con la del oponente. Es arriesgada, pero puede cambiar toda la partida.</p>
        </div>
        <div className="special-card">
          <img src="/assets/cards/multa.jpg" alt="Carta Multa por ser tan sexy" className="special-card-image" />
          <p><strong>🚫 Carta “Multa por ser tan sexy”:</strong> Impide que el rival use un tipo de carta concreta (color, número o categoría especial) durante 1 o 2 turnos. Brutal para romper estrategias.</p>
        </div>
        <div className="special-card">
          <img src="/assets/cards/robar.jpg" alt="Carta Ten huevos a robar" className="special-card-image" />
          <p><strong>🥚 Carta “Ten huevos a robar”:</strong> El oponente tendrá que robar todas las cartas que le tocarían durante los dos próximos turnos. Le llenas la mano y frenas su avance.</p>
        </div>
        <div className="special-card">
          <img src="/assets/cards/duelo.jpg" alt="Carta 1 pa 1 sin camiseta" className="special-card-image" />
          <p><strong>🥊 Carta “1 pa 1 sin camiseta”:</strong> Ambos jugadores tiran su carta más alta. El que tenga la más baja roba dos cartas. (Variante alternativa: Si se prefiere, se puede lanzar un dado. El número más bajo roba dos cartas.)</p>
        </div>
        <div className="special-card">
          <img src="/assets/cards/misteriosa.jpg" alt="Carta Misteriosa" className="special-card-image" />
          <p><strong>❓ Carta “Misteriosa”:</strong> ¿Suerte o caos? Cuando se juega, se elige una carta especial al azar para aplicar su efecto. ¡Puede pasar cualquier cosa… o nada!</p>
        </div>
        <div className="special-card">
          <img src="/assets/cards/lgtb.jpg" alt="Carta LGTB" className="special-card-image" />
          <p><strong>🏳️‍🌈 Carta “LGTB”:</strong> Cambia el color de todas las cartas normales de un jugador (puedes afectar al oponente o a ti mismo, es al 50%). Ideal para romper patrones de jugada.</p>
        </div>
      </div>

      {/* Sección Modos de Juego */}
      <div className="rules-section">
        <h2>⚙️ Modos de Juego</h2>
        <div className="special-card">
          <img src="/assets/cards/normal.jpg" alt="Modo Normal" className="special-card-image" />
          <p><strong>🎲 Modo Normal:</strong> Se juega con las reglas estándar y las cartas especiales. Ideal para partidas equilibradas.</p>
        </div>
        <div className="special-card">
          <img src="/assets/cards/rapido.jpg" alt="Modo Rápido" className="special-card-image" />
          <p><strong>⏱️ Modo Rápido (Contrarreloj):</strong> Tienes poco tiempo para jugar tu carta (por ejemplo, 5 segundos). Perfecto para partidas cortas y emocionantes.</p>
        </div>
        <div className="special-card">
          <img src="/assets/cards/torneo.jpg" alt="Modo Torneo" className="special-card-image" />
          <p><strong>🏆 Modo Torneo:</strong> Cada jugador acumula puntos por ganar partidas. El primero que llegue a 10 puntos gana el torneo.</p>
        </div>
        <div className="special-card">
          <img src="/assets/cards/desafio.jpg" alt="Modo Desafío" className="special-card-image" />
          <p><strong>🎯 Modo Desafío:</strong> Hay objetivos adicionales, como ganar sin usar cartas especiales o en menos de 10 turnos.</p>
        </div>
        <div className="special-card">
          <img src="/assets/cards/sin_especiales.jpg" alt="Modo sin Cartas Especiales" className="special-card-image" />
          <p><strong>🚫 Modo sin Cartas Especiales:</strong> Se juega solo con cartas normales. Ideal para partidas relajadas.</p>
        </div>
      </div>
    </div>
  );
};

export default Rules;