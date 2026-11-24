import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import {
  generateAccessToken,
  generateRefreshToken,
  setRefreshTokenCookie,
  clearRefreshTokenCookie
} from '../utils/token.js';
import { sendVerificationEmail } from '../services/mailService.js';

/**
 * @desc    Yangi foydalanuvchini ro'yxatdan o'tkazish va 6 xonali OTP yuborish
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
      // Agar foydalanuvchi mavjud bo'lsa, lekin hali emailini tasdiqlamagan bo'lsa:
      if (!existingUser.isVerified) {
        // Yangi kod generatsiya qilish va yuborish
        const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
        existingUser.verificationCode = newOtp;
        existingUser.verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 daqiqa
        existingUser.lastVerificationResend = new Date();
        await existingUser.save();

        await sendVerificationEmail(existingUser.email, newOtp);

        return res.status(200).json({
          success: true,
          requireVerification: true,
          email: existingUser.email,
          message: 'Siz allaqachon ro\'yxatdan o\'tgansiz, lekin email tasdiqlanmagan. Yangi tasdiqlash kodi emailingizga yuborildi.'
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Ushbu email bilan tasdiqlangan hisob allaqachon mavjud'
      });
    }

    // Parolni bcrypt bilan hash qilish (10 salt rounds)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 6 xonali tasodifiy OTP kod yaratish
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Yangi foydalanuvchi yaratish (isVerified: false)
    const user = await User.create({
      email,
      password: hashedPassword,
      role: role && ['user', 'admin'].includes(role) ? role : 'user',
      isVerified: false,
      verificationCode: otpCode,
      verificationCodeExpires: new Date(Date.now() + 15 * 60 * 1000), // 15 daqiqa
      lastVerificationResend: new Date()
    });

    // Emailga tasdiqlash kodini yuborish
    await sendVerificationEmail(user.email, otpCode);

    res.status(201).json({
      success: true,
      requireVerification: true,
      email: user.email,
      message: 'Ro\'yxatdan muvaffaqiyatli o\'tildi! 6 xonali tasdiqlash kodi emailingizga yuborildi.',
      data: {
        id: user._id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Foydalanuvchini tizimga kiritish (Login) - faqat isVerified bo'lsa
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

    // EMAIL TASDIQLANGANLIGINI TEKSHIRISH (Email Verification Check)
    if (!user.isVerified) {
      // Agar kodi muddati o'tgan bo'lsa, yangi kod yuboramiz
      if (!user.verificationCode || !user.verificationCodeExpires || user.verificationCodeExpires < Date.now()) {
        const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
        user.verificationCode = newOtp;
        user.verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000);
        user.lastVerificationResend = new Date();
        await user.save();
        await sendVerificationEmail(user.email, newOtp);
      }

      return res.status(403).json({
        success: false,
        requireVerification: true,
        email: user.email,
        message: 'Elektron pochtangiz hali tasdiqlanmagan. Iltimos, pochtangizga yuborilgan 6 xonali kodni kiriting.'
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
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Emailni 6 xonali OTP kod orqali tasdiqlash
 * @route   POST /auth/verify-email
 * @access  Public
 */
export const verifyEmail = async (req, res, next) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'Email va 6 xonali tasdiqlash kodi kiritilishi shart'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Foydalanuvchi topilmadi'
      });
    }

    if (user.isVerified) {
      return res.status(200).json({
        success: true,
        message: 'Emailingiz allaqachon tasdiqlangan. Tizimga kirishingiz mumkin.'
      });
    }

    // Kodni va muddatini tekshirish
    if (user.verificationCode !== code.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Tasdiqlash kodi noto\'g\'ri'
      });
    }

    if (user.verificationCodeExpires < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'Tasdiqlash kodining amal qilish muddati tugagan (15 daqiqa). Qayta yangi kod oling.'
      });
    }

    // Email muvaffaqiyatli tasdiqlandi
    user.isVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpires = null;

    // Foydalanuvchini darhol tizimga kiritish uchun tokenlar berish
    const payload = { id: user._id, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    user.refreshToken = refreshToken;
    await user.save();

    setRefreshTokenCookie(res, refreshToken);

    res.status(200).json({
      success: true,
      message: 'Emailingiz muvaffaqiyatli tasdiqlandi va tizimga kirildi!',
      accessToken,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        isVerified: true
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Tasdiqlash kodini qayta yuborish (60 soniyalik cheklov bilan)
 * @route   POST /auth/resend-verification
 * @access  Public
 */
export const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email kiritilishi shart'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Ushbu email bilan foydalanuvchi topilmadi'
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Emailingiz allaqachon tasdiqlangan'
      });
    }

    // 60 soniyalik spam cheklovi (Rate Limiting)
    if (user.lastVerificationResend) {
      const timeElapsed = Date.now() - new Date(user.lastVerificationResend).getTime();
      const cooldownTime = 60 * 1000; // 60 soniya

      if (timeElapsed < cooldownTime) {
        const remainingSeconds = Math.ceil((cooldownTime - timeElapsed) / 1000);
        return res.status(429).json({
          success: false,
          message: `Iltimos, yangi kod yuborish uchun yana ${remainingSeconds} soniya kuting.`,
          remainingSeconds
        });
      }
    }

    // Yangi 6 xonali OTP yaratish
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationCode = newOtp;
    user.verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000);
    user.lastVerificationResend = new Date();
    await user.save();

    await sendVerificationEmail(user.email, newOtp);

    res.status(200).json({
      success: true,
      message: 'Yangi 6 xonali tasdiqlash kodi emailingizga yuborildi.'
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

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        requireVerification: true,
        email: user.email,
        message: 'Elektron pochtangiz tasdiqlanmagan'
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
