import anime from 'animejs';

export function animateCardEnter(selector) {
  anime({
    targets: selector,
    opacity: [0, 1],
    translateY: [40, 0],
    delay: anime.stagger(80),
    duration: 700,
    easing: 'easeOutExpo'
  });
}

export function animateCardHover(card) {
  anime({
    targets: card,
    scale: 1.06,
    boxShadow: '0 0 32px #ffe95a88',
    duration: 300,
    easing: 'easeOutBack'
  });
}

export function animateCardUnhover(card) {
  anime({
    targets: card,
    scale: 1,
    boxShadow: '0 6px 24px #bcae7c33',
    duration: 300,
    easing: 'easeOutExpo'
  });
}

export function animateCopyFeedback(selector) {
  anime({
    targets: selector,
    scale: [1, 1.15, 1],
    backgroundColor: [
      '#ffe95a', '#fffbe6', '#ffe95a'
    ],
    duration: 600,
    easing: 'easeInOutQuad'
  });
}