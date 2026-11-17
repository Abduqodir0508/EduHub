import express from 'express';
import {
  register,
  login,
  refreshToken,
  logout
} from '../controllers/authController.js';
import { loginLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

// Ro'yxatdan o'tish
router.post('/register', register);

// Tizimga kirish (1 daqiqada 5 ta so'rov bilan cheklangan)
router.post('/login', loginLimiter, login);

// Refresh token orqali yangi access token olish
router.post('/refresh', refreshToken);

// Tizimdan chiqish
router.post('/logout', logout);

export default router;
