// src/pages/Register/Register.js
import React, { useState, useContext } from 'react';
import './Register.css';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { UserContext } from '../../context/UserContext';
import { handleGoogleLogin, useGoogleAuthListener } from '../../utils/useGoogleLoginRegistrer';

const Register = () => {
  const randomAvatar = Math.floor(Math.random() * 4) + 1;
  const { login } = useContext(UserContext);
  const navigate = useNavigate();

  useGoogleAuthListener(login, navigate);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    profile_picture: `/assets/img/avatar${randomAvatar}.png`, 
    language: '',
  });
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ 
      ...formData, 
      [e.target.name]: e.target.value 
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/signup`, formData);
      setMessage('Usuario creado exitosamente');

      // Después de crear usuario, hacer login automático
      const loginResponse = await axios.post(`${process.env.REACT_APP_API_URL}/login`, {
        email: formData.email,
        password: formData.password,
      });

      const { user, session } = loginResponse.data;

      if (!user || !user.username) {
        return setMessage('No se pudo iniciar sesión después del registro.');
      }

      login({
        username: user.username,
        userId: user.user_id,
        profile_picture: user.profile_picture || `/assets/img/avatar${randomAvatar}.png`,
        token: session?.access_token || null,
      });

      navigate('/');
    } catch (error) {
      setMessage(error.response?.data?.error || 'Error al crear usuario');
    }
  };

  return (
  <div className="register-wrapper">
    <div className="register-container">
      <h1>Crear Cuenta</h1>
      <form onSubmit={handleRegister}>
        <input
          type="text"
          name="username"
          placeholder="Nombre de usuario"
          value={formData.username}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Correo electrónico"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Contraseña"
          value={formData.password}
          onChange={handleChange}
          required
        />
        <select
          name="language"
          value={formData.language}
          onChange={handleChange}
          required
        >
          <option value="" disabled>-- Seleccione idioma --</option>
          <option value="es">Español</option>
          <option value="en">Inglés</option>
        </select>
        <button type="submit" className="normal-btn">Registrarse</button>
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
        Registrarse con Google
      </button>
       <p>
        ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
      </p>
      <p>
        <Link to="/reset-request">¿Se te olvidó la contraseña?</Link>
      </p>
      {message && <p>{message}</p>}
    </div>
  </div>
  );
};

export default Register;
