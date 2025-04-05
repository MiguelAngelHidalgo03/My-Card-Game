// Importamos Express
const express = require('express');

// Creamos una instancia de la aplicación Express
const app = express();

// Definimos el puerto
const port = process.env.PORT || 5000;

// Middleware para manejar las solicitudes JSON
app.use(express.json());

// Ruta básica para verificar que el servidor está funcionando
app.get('/', (req, res) => {
  res.send('Hello, 1pa1 backend is working!');
});

// Iniciamos el servidor
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
