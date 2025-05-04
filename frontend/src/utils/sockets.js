import { io } from 'socket.io-client';

// Inicializa la conexión con el servidor de Socket.IO
const socket = io('http://localhost:5000'); // Cambia la URL si el backend está en otro dominio o puerto

export default socket;