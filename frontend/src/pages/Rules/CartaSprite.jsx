import React from 'react';
import { atlasMap } from './CartasMapeo';

const CartaSprite = ({ nombre, className = '', alt = '', scale = 1 }) => {
  const carta = atlasMap[nombre];
  if (!carta) {
    return <div style={{ color: 'red' }}>❌ Carta "{nombre}" no encontrada</div>;
  }

  const { x, y, w, h, image, atlasSize } = carta;

  const scaledWidth = w * scale;
  const scaledHeight = h * scale;

  return (
    <div
      className={`inline-block ${className}`}
      style={{
        width: `${scaledWidth}px`,
        height: `${scaledHeight}px`,
        backgroundImage: `url(${image})`,
        backgroundPosition: `-${x * scale}px -${y * scale}px`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: `${atlasSize.w * scale}px ${atlasSize.h * scale}px`, // ← ESCALA CORRECTA DEL ATLAS ENTERO
      }}
      role="img"
      aria-label={alt || nombre}
    />
  );
};

export default CartaSprite;
