import React, { useState, useContext , useEffect} from 'react';
import './Login.css';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { UserContext } from '../../context/UserContext';
import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const Login = () => {
  const { login } = useContext(UserContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const handleGoogleLogin = async () => {
    try {
      // Iniciar sesión con Google
      const { user, session, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });

      if (error) {
        console.error('Error al iniciar sesión con Google:', error);
        setMessage(`Error al iniciar sesión con Google: ${error.message}`);
        return;
      }

      // Enviar el token de acceso al backend para validar e iniciar sesión o registrar
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/auth/google-auth`, {
        access_token: session.access_token,
      });

      if (response.status === 200) {
        // Almacenar la información del usuario (puedes usar contexto, localStorage, etc.)
        console.log('Inicio de sesión exitoso:', response.data);
        navigate('/');
      }
    } catch (error) {
      console.error('Error al procesar el login con Google:', error);
      setMessage('Error al iniciar sesión con Google');
    }
  };
  
  
  
  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/login`, {
        email,
        password,
      });

      const { user, session } = response.data;

      if (!user || !user.username) {
        return setMessage('No se pudo obtener el usuario correctamente.');
      }

      // Guardar usuario en contexto y localStorage
      login({
        username: user.username,
        userId: user.user_id,
        profile_picture: user.profile_picture || '/assests/img/avatar1.png',
        token: session?.access_token || null,
      });

      setMessage('Inicio de sesión exitoso');
      navigate('/');

    } catch (error) {
      console.error('Error en login:', error);
      setMessage(error.response?.data?.error || 'Error al iniciar sesión');
    }
  };

  return (
    <div className="login-container">
      <h1>Iniciar Sesión</h1>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Entrar</button>
        <button onClick={handleGoogleLogin} className="google-btn">
           Iniciar sesión / Registrarse con Google
        </button>

        <p>¿No tienes cuenta? <Link to="/register">Regístrate aquí</Link></p>
        <p><Link to="/reset-request">¿Se te olvidó la contraseña?</Link></p>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default Login;
