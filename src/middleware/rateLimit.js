import rateLimit from 'express-rate-limit';

// /auth/login uchun 1 daqiqada maksimal 5 ta so'rov
export const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 daqiqa
  max: 5, // Cheklov: 5 ta urinish
  message: {
    success: false,
    message: 'Juda ko\'p urinish amalga oshirildi. Iltimos, 1 daqiqadan so\'ng qayta urinib ko\'ring.'
  },
  standardHeaders: true, // `RateLimit-*` sarlavhalarini qaytarish
  legacyHeaders: false   // `X-RateLimit-*` sarlavhalarini o'chirish
});
