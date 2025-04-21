// src/pages/Register/Register.js
import React, { useState } from 'react';
import './Register.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const randomAvatar = Math.floor(Math.random() * 4) + 1;

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    profile_picture: `/assets/img/avatar${randomAvatar}.png`,    language: 'es', // predeterminado a español
  });

  const [message, setMessage] = useState('');
  const navigate = useNavigate();

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
      console.log(response.data);
      setTimeout(() => navigate('/login'), 1500); // Redirige después de 1.5s
    } catch (error) {
      setMessage(error.response?.data?.error || 'Error al crear usuario');
    }
  };

  return (
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
        >
        <option value="es">-- Selecciona un idioma</option>
        <option value="es">Español</option>
        <option value="en">Inglés</option>
        </select>

        <button type="submit">Registrarse</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default Register;
