const express = require('express');
const app = express();
const port = 3001; // Puedes cambiar el puerto si es necesario

// Middleware para permitir JSON en las peticiones
app.use(express.json());

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('¡Backend de 1pa1 está corriendo!');
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
