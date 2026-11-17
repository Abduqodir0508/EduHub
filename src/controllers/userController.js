import User from '../models/User.js';
import Course from '../models/Course.js';

/**
 * @desc    Joriy foydalanuvchi profilini olish
 * @route   GET /profile
 * @access  Private (authMiddleware)
 */
export const getProfile = async (req, res, next) => {
  try {
    // req.user authMiddleware orqali yuklangan
    res.status(200).json({
      success: true,
      data: req.user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Admin dashboard ma'lumotlarini olish
 * @route   GET /admin/dashboard
 * @access  Private (Admin only)
 */
export const getAdminDashboard = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCourses = await Course.countDocuments();

    res.status(200).json({
      success: true,
      message: 'Admin Dashboard ma\'lumotlari muvaffaqiyatli yuklandi',
      data: {
        admin: {
          id: req.user._id,
          email: req.user.email,
          role: req.user.role
        },
        stats: {
          totalUsers,
          totalCourses
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
