import express from 'express';
import {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse
} from '../controllers/courseController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { isAdmin } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Ochiq yo'llar (Barcha foydalanuvchilar uchun)
router.get('/', getCourses);
router.get('/:id', getCourseById);

// Faqat adminlar uchun himoyalangan yo'llar
router.post('/', authMiddleware, isAdmin, createCourse);
router.put('/:id', authMiddleware, isAdmin, updateCourse);
router.delete('/:id', authMiddleware, isAdmin, deleteCourse);

export default router;
