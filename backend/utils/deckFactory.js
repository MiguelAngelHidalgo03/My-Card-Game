// backend/utils/deckFactory.js
export function createDeck(enableSpecialCards) {
  const colors = ['Verde','Azul','Naranja','Morada'];
  const values = ['0','1','2','3','4','5','6','7','8','9'];
  const deck = [];
  // 1) Cartas numéricas
  colors.forEach(color => {
    values.forEach(val => {
      deck.push({ frame: `${color}_${val}.svg` });
      if (val !== '0') deck.push({ frame: `${color}_${val}.svg` });
    });
  });
  // 2) Bloqueo y +2
  colors.forEach(color => {
    deck.push({ frame: `${color}_Bloqueo.svg` }, { frame: `${color}_Bloqueo.svg` });
    deck.push({ frame: `${color}_mas2.svg` },    { frame: `${color}_mas2.svg` });
  });
  // 3) Cambia color y +4 (aún no añadida)
  for (let i = 0; i < 4; i++) {
    deck.push({ frame: 'cambia_color.svg' });
   deck.push({ frame: 'mas4.svg' }); // cuando la crees
  }
  // 4) Reverso
  // deck.push({ frame: 'Reverso_Carta.svg' });
  // 5) Futuras especiales
  if (enableSpecialCards) {
    // …tu código para especiales
  }
  return deck;
}

// Helper para barajar Fisher–Yates
export function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
