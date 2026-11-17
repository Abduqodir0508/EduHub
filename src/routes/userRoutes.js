import express from 'express';
import { getProfile, getAdminDashboard } from '../controllers/userController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { isAdmin } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Himoyalangan profil yo'li (Barcha autentifikatsiyadan o'tgan foydalanuvchilar uchun)
router.get('/profile', authMiddleware, getProfile);

// Faqat adminlar uchun maxsus dashboard yo'li
router.get('/admin/dashboard', authMiddleware, isAdmin, getAdminDashboard);

export default router;
