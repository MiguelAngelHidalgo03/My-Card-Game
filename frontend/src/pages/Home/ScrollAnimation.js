// src/animations/scrollAnimations.js
import anime from 'animejs';

export function initScrollAnimations() {
  // 1. Creamos el IntersectionObserver
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const block = entry.target;
      obs.unobserve(block);

      // ① Fijar tamaño del bloque para evitar “jumps”
      const rect = block.getBoundingClientRect();
      block.style.setProperty('--block-w', `${rect.width}px`);
      block.style.setProperty('--block-h', `${rect.height}px`);
      block.classList.add('fixed-size');

      // Referencia a la imagen dentro de .rules-image, si existe
      const img = block.querySelector('.rules-image img');

      // Función que mide imagen, fija --img-h y lanza la animación
      function startAnimation() {
        if (img) {
          const imgRect = img.getBoundingClientRect();
          block.style.setProperty('--img-h', `${imgRect.height}px`);
        }

        // ② Animación de deformación con anime.js
        anime({
          targets: block,
          opacity:    [0, 1],
          scale:      [0.8, 1],
          skewX:      ['15deg', '0deg'],
          skewY:      ['10deg', '0deg'],
          duration:   2500,
          easing:     'easeOutElastic(1, .7)',
          complete: () => {
            // ③ Máquina de escribir en .animate-text
            const texts = block.querySelectorAll('.animate-text');
            texts.forEach(el => typeWriter(el, 35));

            // ④ Tras tipeo, expandir .rules-text si es bloque de reglas
            if (block.classList.contains('home-rules')) {
              const maxChars = Math.max(
                ...Array.from(texts).map(el => el.textContent.length)
              );
              setTimeout(() => {
                const rulesContainer = block.querySelector('.rules-text');
                if (rulesContainer) {
                  rulesContainer.classList.add('expanded');
                }
              }, maxChars * 35 + 100);
            }
          }
        });
      }

      // Si hay imagen y aún no se ha cargado, espera al evento load
      if (img && !img.complete) {
        img.addEventListener('load', startAnimation);
      } else {
        startAnimation();
      }
    });
  }, {
    threshold: 0,
    rootMargin: '0px'
  });

  // 2. Observa cada bloque que tenga la clase .scroll-block
  document.querySelectorAll('.scroll-block').forEach(block => {
    block.style.opacity = 0;
    block.style.transformOrigin = 'top center';
    observer.observe(block);
  });
}

// Helper: simula máquina de escribir y opcional callback al final
function typeWriter(el, speed, callback) {
  const original = el.textContent;
  el.textContent = '';
  el.style.visibility = 'visible';
  let i = 0;
  const timer = setInterval(() => {
    const ch = original.charAt(i);
    el.innerHTML += (ch === ' ' ? '&nbsp;' : ch);
    i++;
    if (i >= original.length) {
      clearInterval(timer);
      if (typeof callback === 'function') callback();
    }
  }, speed);
}
