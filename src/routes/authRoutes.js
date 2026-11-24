import express from 'express';
import {
  register,
  login,
  verifyEmail,
  resendVerification,
  refreshToken,
  logout
} from '../controllers/authController.js';
import { loginLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

// Ro'yxatdan o'tish (OTP kod yuboriladi)
router.post('/register', register);

// Tizimga kirish (1 daqiqada 5 ta so'rov bilan cheklangan)
router.post('/login', loginLimiter, login);

// Emailni 6 xonali OTP kod orqali tasdiqlash
router.post('/verify-email', verifyEmail);

// Tasdiqlash kodini qayta yuborish (60s cheklov)
router.post('/resend-verification', resendVerification);

// Refresh token orqali yangi access token olish
router.post('/refresh', refreshToken);

// Tizimdan chiqish
router.post('/logout', logout);

export default router;
