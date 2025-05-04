// routes/userRoutes.js
import express from 'express';
import { createUser } from '../controllers/userController.js';
import  { googleAuth ,loginUser, logoutUser } from '../controllers/loginUserController.js';
import {  getUserProfile, updateUserProfile, changePassword,changeUserEmail } from '../controllers/userProfileController.js';
const router = express.Router();

// Ruta para crear un usuario
router.post('/signup', createUser);
// Ruta para iniciar sesión
router.post('/login', loginUser);
// Ruta para cerrar sesión
router.post('/logout', logoutUser);

// Ruta para obtener el perfil del usuario
router.get('/profile/:userId', getUserProfile);

// Ruta para actualizar el perfil del usuario
router.put('/profile', updateUserProfile);

// Ruta para cambiar la contraseña del usuario
router.post('/change-password', changePassword);

// Ruta para cambiar la el correo del usuario
router.post('/change-email', changeUserEmail);

// Ruta para manejar la autenticación con Google
router.post('/google-auth', googleAuth);



export default router;
