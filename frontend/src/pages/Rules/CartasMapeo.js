import data from './cartas.json';

export const atlasMap = {};

data.textures.forEach((texture) => {
  const image = `/assests/Cartas/${texture.image}`; // ajusta según tu ruta real
  const atlasSize = texture.size; // Guardamos el tamaño del atlas completo
  texture.frames.forEach((frame) => {
    atlasMap[frame.filename] = {
      ...frame.frame,
      image,
      atlasSize
    };
  });
});
