import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authMiddleware = async (req, res, next) => {
  try {
    let token;

    // Authorization header mavjudligini tekshirish
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Avtorizatsiyadan o\'tilmagan: Token topilmadi'
      });
    }

    // Access tokenni tekshirish
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // Foydalanuvchini bazadan qidirish
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Foydalanuvchi topilmadi yoki token yaroqsiz'
      });
    }

    // EMAIL TASDIQLANGANLIGINI TEKSHIRISH (Verified check)
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        requireVerification: true,
        email: user.email,
        message: 'Elektron pochtangiz tasdiqlanmagan. Iltimos, pochtangizni tasdiqlang.'
      });
    }

    // req.user ga foydalanuvchini biriktirish
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token yaroqsiz yoki muddati tugagan',
      error: error.message
    });
  }
};
