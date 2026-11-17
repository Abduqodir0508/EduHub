import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import {
  generateAccessToken,
  generateRefreshToken,
  setRefreshTokenCookie,
  clearRefreshTokenCookie
} from '../utils/token.js';

/**
 * @desc    Yangi foydalanuvchini ro'yxatdan o'tkazish
 * @route   POST /auth/register
 * @access  Public
 */
export const register = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email va parol kiritilishi shart'
      });
    }

    // Foydalanuvchi mavjudligini tekshirish
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Ushbu email bilan foydalanuvchi allaqachon mavjud'
      });
    }

    // Parolni bcrypt bilan 10 salt rounds yordamida hash qilish
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Yangi foydalanuvchi yaratish
    const user = await User.create({
      email,
      password: hashedPassword,
      role: role && ['user', 'admin'].includes(role) ? role : 'user'
    });

    res.status(201).json({
      success: true,
      message: 'Foydalanuvchi muvaffaqiyatli ro\'yxatdan o\'tdi',
      data: {
        id: user._id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Foydalanuvchini tizimga kiritish (Login)
 * @route   POST /auth/login
 * @access  Public
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email va parol kiritilishi shart'
      });
    }

    // Foydalanuvchini email orqali qidirish
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email yoki parol noto\'g\'ri'
      });
    }

    // Parolni tekshirish
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email yoki parol noto\'g\'ri'
      });
    }

    // Tokenlarni yaratish
    const payload = { id: user._id, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Refresh tokenni bazada saqlash
    user.refreshToken = refreshToken;
    await user.save();

    // Refresh tokenni httpOnly cookie qilib yuborish
    setRefreshTokenCookie(res, refreshToken);

    // Access tokenni JSON ko'rinishida qaytarish
    res.status(200).json({
      success: true,
      message: 'Tizimga muvaffaqiyatli kirildi',
      accessToken,
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Refresh token orqali yangi access token olish
 * @route   POST /auth/refresh
 * @access  Public (Cookie orqali)
 */
export const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token topilmadi, iltimos qaytadan kiring'
      });
    }

    // Refresh tokenni tekshirish
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      return res.status(403).json({
        success: false,
        message: 'Refresh token muddati tugagan yoki yaroqsiz'
      });
    }

    // Foydalanuvchi va bazadagi refresh tokenni tekshirish
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== token) {
      return res.status(403).json({
        success: false,
        message: 'Refresh token yaroqsiz yoki bekor qilingan'
      });
    }

    // Yangi access token yaratish
    const newAccessToken = generateAccessToken({ id: user._id, role: user.role });

    res.status(200).json({
      success: true,
      message: 'Yangi access token berildi',
      accessToken: newAccessToken
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Tizimdan chiqish (Logout)
 * @route   POST /auth/logout
 * @access  Public
 */
export const logout = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;

    if (token) {
      // Bazadagi refresh tokenni tozalash
      const user = await User.findOne({ refreshToken: token });
      if (user) {
        user.refreshToken = null;
        await user.save();
      }
    }

    // Cookie'dagi refresh tokenni tozalash
    clearRefreshTokenCookie(res);

    res.status(200).json({
      success: true,
      message: 'Tizimdan muvaffaqiyatli chiqildi'
    });
  } catch (error) {
    next(error);
  }
};
