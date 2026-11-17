import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 1. Xavfsizlik sarlavhalari (Helmet) - tashqi CDN stillar va skriptlar bilan ishlashi uchun CSP moslangan
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);

// 2. CORS sozlamalari
app.use(
  cors({
    origin: true, // har qanday origin yoki localhost bilan ishlash uchun moslashuvchan
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// 3. Body parser va Cookie parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 4. Statik veb-sayt fayllari (Frontend)
app.use(express.static(path.join(__dirname, '../public')));

// 5. API Yo'nalishlari
app.use('/auth', authRoutes);
app.use('/', userRoutes);          // /profile va /admin/dashboard
app.use('/courses', courseRoutes); // /courses CRUD

// 6. Saytning SPA (Single Page) marshruti - bosh sahifani ochish
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 7. Noma'lum API yo'llari va xatoliklarni qayta ishlash
app.use(notFound);
app.use(errorHandler);

export default app;
