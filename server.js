import dotenv from 'dotenv';
dotenv.config();

import app from './src/app.js';
import connectDB from './src/config/db.js';

const PORT = process.env.PORT || 5000;

// MongoDB bilan ulanish va serverni ishga tushirish
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`[Server] EduHub API serveri http://localhost:${PORT} portida ishlamoqda`);
      console.log(`[Environment] Rejim: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error(`[Server Error] Serverni ishga tushirishda xatolik yuz berdi: ${error.message}`);
    process.exit(1);
  }
};

startServer();
