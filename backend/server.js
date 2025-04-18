// server.js
import dotenv from 'dotenv'; // Asegúrate de cargar las variables de entorno al inicio
import express from 'express';
import userRoutes from './routes/userRoutes.js';
import avatarRoutes from './routes/avatarRoutes.js';
import cors from "cors";
import resetPasswordRoutes from "./routes/resetPassword.js"; // Cambiar require por import
dotenv.config(); // Cargar las variables de entorno

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
  origin: 'http://localhost:3000', // Cambia esto por la URL de tu frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));
app.use(express.json());  // Para parsear los cuerpos de solicitud en formato JSON

// Usar las rutas de usuarios
app.use('/api', userRoutes, avatarRoutes);

// Configurar CORS
app.use("/api", resetPasswordRoutes);

// Iniciar servidor
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

app.get('/', (req, res) => {
    res.send('¡Backend de 1pa1 está corriendo!');
  });
  
app.use((req, res) => {
    res.status(404).json({ message: 'Ruta no encontrada' });
  });

// Middleware para manejar errores
app.use((err, req, res, next) => {
    console.error(err.stack); // Log del error
    res.status(500).json({ message: 'Error interno del servidor' });
});