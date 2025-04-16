import express from 'express';
import { updateAvatar, getAvatars } from '../controllers/avatarController.js';

const router = express.Router();

// Ruta para actualizar el avatar
router.post('/update-avatar', updateAvatar);

// Ruta para obtener la lista de avatares disponibles
router.get('/avatars', getAvatars);

export default router;