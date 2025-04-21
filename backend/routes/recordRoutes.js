import express from 'express';
import {getPlayerRecordsByUser} from '../controllers/playerRecordController.js';

const router = express.Router();

router.get('/user/:user_id/records', getPlayerRecordsByUser);

export default router;