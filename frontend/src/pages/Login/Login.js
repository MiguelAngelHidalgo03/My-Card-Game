// src/pages/Login/Login.js
import React, { useState, useContext } from 'react';
import './Login.css';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { UserContext } from '../../context/UserContext';
import {
  handleGoogleLogin,
  useGoogleAuthListener,
} from '../../utils/useGoogleLoginRegistrer';

const Login = () => {
  const { login } = useContext(UserContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  // ⬇️ Escucha el login con Google y gestiona lógica asociada
  useGoogleAuthListener(login, navigate);

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

      login({
        username: user.username,
        userId: user.user_id,
        profile_picture: user.profile_picture || '/assets/img/avatar1.png',
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
        <button type="submit" className="normal-btn">
          Entrar
        </button>
      </form>

      <button
        type="button"
        onClick={handleGoogleLogin}
        className="google-login-button"
      >
        <img
          src="https://developers.google.com/identity/images/g-logo.png"
          alt="Google logo"
          className="google-logo"
        />
        Iniciar sesión con Google
      </button>

      <p>
        ¿No tienes cuenta? <Link to="/register">Regístrate aquí</Link>
      </p>
      <p>
        <Link to="/reset-request">¿Se te olvidó la contraseña?</Link>
      </p>

      {message && <p className="login-message">{message}</p>}
    </div>
  );
};

export default Login;
