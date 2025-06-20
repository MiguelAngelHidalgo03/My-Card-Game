import { io } from 'socket.io-client';

// Inicializa la conexión con el servidor de Socket.IO
const socket = io('https://www.1pa1.xyz'); // Cambia la URL si el backend está en otro dominio o puerto

export default socket;