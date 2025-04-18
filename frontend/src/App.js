import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import ResetRequest from "./pages/ResetPassword/ResetRequest";  // Página donde el usuario solicita el restablecimiento
import VerifyOtpAndReset from "./pages/ResetPassword/VerifyOtpAndReset";  // Página donde el usuario verifica el código y cambia la contraseña
import Navbar from './components/Navbar/Navbar';
import Home from './pages/Home/Home';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import Config from './pages/Config/Config'; // Importación correcta
import Rules from './pages/Rules/Rules'; // Importar la página de reglas
import About from './pages/About/About'; // Importar la página de sobre nosotros

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>

        {/* Ruta para la página de inicio */}
        <Route path="/" element={<Home />} />

        {/* Ruta para la página de registro */}
        <Route path="/register" element={<Register />} />

        {/* Ruta para la página de inicio de sesión */}
        <Route path="/login" element={<Login />} />

        {/* Ruta para la página de perfil de usuario */}
        <Route path="/Config" element={<Config />} />

        {/* Ruta para solicitar el restablecimiento de la contraseña */}
        <Route path="/reset-request" element={<ResetRequest />} />

        {/* Ruta para verificar el código y cambiar la contraseña */}
        <Route path="/reset-password" element={<VerifyOtpAndReset />} />

        {/* Redirección por defecto, puedes ponerla a "/reset-request" o cualquier otra ruta */}
        <Route path="/" element={<Navigate to="/reset-request" />} />
  
        {/* Ruta para la página de reglas */}
        <Route path="/rules" element={<Rules />} />

        {/* Ruta para la página de "Sobre Nosotros" */}
        <Route path="/about" element={<About />} />

      </Routes>
    </Router>
  );
}

export default App;
