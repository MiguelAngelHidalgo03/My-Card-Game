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
    // Esta llamada redirige al login de Google
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:3000/login', // Asegúrate de usar la ruta correcta
      },
    });
  } catch (error) {
    console.error('Error durante el login con Google:', error);
    setMessage('Error al iniciar sesión con Google');
  }
};

useEffect(() => {
  const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session) {
      try {
        const access_token = session.access_token;

        const response = await axios.post(`${process.env.REACT_APP_API_URL}/auth/google-auth`, {
          access_token,
        });

        if (response.status === 200) {
          const { user } = response.data;

          login({
            username: user.username,
            userId: user.user_id,
            profile_picture: user.profile_picture || '/assets/img/avatar1.png',
            token: access_token,
          });

          navigate('/');  // Redirigir después de iniciar sesión exitosamente
        }
      } catch (err) {
        console.error('Error al autenticar en el backend:', err);
      }
    }
  });

  return () => authListener.subscription.unsubscribe();
}, [login, navigate]);


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

      {/* Prevenir el comportamiento predeterminado del formulario cuando se hace clic en el botón de Google */}
      <button
        type="button" // Cambiar el tipo de botón a "button" para evitar el submit del formulario
        onClick={handleGoogleLogin}
        className="google-btn"
      >
        Iniciar sesión / Registrarse con Google
      </button>

      <p>¿No tienes cuenta? <Link to="/register">Regístrate aquí</Link></p>
      <p><Link to="/reset-request">¿Se te olvidó la contraseña?</Link></p>
    </form>
    {message && <p>{message}</p>}
  </div>
  
);
}

export default Login;
