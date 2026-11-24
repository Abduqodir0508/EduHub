# EduHub API & Web Platformasi

EduHub o'quv platformasi uchun xavfsiz va to'liq arxitekturaga ega Node.js, Express.js va MongoDB (Mongoose) asosidagi RESTful API va interaktiv Veb-Platforma.

Loyihada **ES Modules** (`import` / `export`) sintaksisidan foydalanilgan.

---

## 🛠 Texnologiyalar to'plami (Tech Stack)
- **Runtime:** Node.js
- **Freymvork:** Express.js
- **Ma'lumotlar bazasi:** MongoDB & Mongoose ODM
- **Email xizmati:** `nodemailer` (100% bepul Gmail SMTP / App Passwords)
- **Xavfsizlik:** 
  - `helmet` (HTTP xavfsizlik sarlavhalari)
  - `cors` (Faqat ruxsat berilgan manzil va cookies uchun `credentials: true`)
  - `express-rate-limit` (Brute-force hujumlaridan himoya)
  - `bcrypt` (Parollarni 10 salt rounds bilan hash qilish)
  - `jsonwebtoken` (Access & Refresh JWT tokenlar)
  - `cookie-parser` (HttpOnly xavfsiz cookie orqali refresh token boshqaruvi)
  - **Email Verification (OTP):** 6 xonali tasdiqlash kodi va 60 soniyalik spamdan himoya

---

## 📁 Papka va fayllar tuzilmasi

```text
vazifull/
├── public/
│   ├── css/
│   │   └── style.css             # Maxsus stillar va animatsiyalar
│   ├── js/
│   │   └── app.js                # Frontend SPA mantiqi va API ulanishlari
│   ├── index.html                # Asosiy veb-sayt (Hero, Katalog, Modallar)
│   └── verify-email.html         # 6 xonali OTP email tasdiqlash sahifasi
├── src/
│   ├── config/
│   │   └── db.js                 # MongoDB ulanish sozlamalari
│   ├── controllers/
│   │   ├── authController.js     # Register, Login, Verify, Resend, Refresh, Logout
│   │   ├── courseController.js   # Kurslar uchun CRUD operatsiyalari
│   │   └── userController.js     # Profil va Admin Dashboard
│   ├── middleware/
│   │   ├── authMiddleware.js     # Bearer Access Token & isVerified tekshiruvi
│   │   ├── roleMiddleware.js     # Admin ruxsatini tekshirish (RBAC)
│   │   ├── rateLimit.js          # /auth/login uchun limit (5 so'rov/daqiqa)
│   │   └── errorMiddleware.js    # 404 va global xatoliklar qayta ishlovchisi
│   ├── models/
│   │   ├── Course.js             # Kurs Mongoose sxemasi
│   │   └── User.js               # Foydalanuvchi Mongoose sxemasi (isVerified, OTP)
│   ├── routes/
│   │   ├── authRoutes.js         # /auth yo'nalishlari
│   │   ├── courseRoutes.js       # /courses yo'nalishlari
│   │   └── userRoutes.js         # /profile va /admin/dashboard yo'nalishlari
│   ├── services/
│   │   └── mailService.js        # Gmail SMTP orqali xat jo'natish servisi
│   ├── utils/
│   │   └── token.js              # JWT generatsiya va cookie utilitalari
│   └── app.js                    # Express ilovasi va asosiy middleware'lar
├── .env                          # Muhit o'zgaruvchilari (maxfiy)
├── .env.example                  # Muhit o'zgaruvchilari namunasi
├── package.json                  # Bog'liqliklar va skriptlar
├── server.js                     # Serverni ishga tushirish kirish nuqtasi
└── README.md                     # Loyiha qo'llanmasi
```

---

## ⚙️ O'rnatish va Ishga tushirish

1. **Kutubxonalarni o'rnatish:**
   ```bash
   npm install
   ```

2. **Muhit o'zgaruvchilarini sozlash (.env):**
   ```env
   PORT=5000
   NODE_ENV=development
   MONGO_URI=mongodb+srv://...
   JWT_ACCESS_SECRET=eduhub_super_secret_access_key_2026
   JWT_ACCESS_EXPIRES_IN=15m
   JWT_REFRESH_SECRET=eduhub_super_secret_refresh_key_2026
   JWT_REFRESH_EXPIRES_IN=7d
   CLIENT_URL=http://localhost:3000

   # 100% Bepul Gmail SMTP (Email Verification uchun)
   SMTP_EMAIL=sizning_pochta@gmail.com
   SMTP_APP_PASSWORD=sizning_16_xonali_ilova_parolingiz
   ```

3. **Serverni ishga tushirish:**
   ```bash
   npm run dev
   ```

---

## 📧 100% Bepul Gmail SMTP (App Password) Qanday Olinadi?

Hech qanday karta yoki pullik obuna talab qilinmaydi:
1. Google hisobingizga kiring: [myaccount.google.com](https://myaccount.google.com)
2. **Security (Xavfsizlik)** bo'limiga o'ting va **2-Step Verification (2 bosqichli tekshirish)** yoqilganligiga ishonch hosil qiling.
3. Qidiruv maydoniga **"App passwords"** (yoki **"Ilova parollari"**) deb yozing.
4. Ilova nomiga **"EduHub"** deb yozib, **Create (Yaratish)** tugmasini bosing.
5. Chiqqan **16 xonali kod**ni (masalan: `abcd efgh ijkl mnop`) nusxalang va `.env` faylidagi `SMTP_APP_PASSWORD` ga qo'ying.

---

## 📌 API Endpointlar ro'yxati

### 1. Autentifikatsiya (`/auth`)

| Metod | Yo'l | Ruxsat | Tavsif |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Ommaviy | Ro'yxatdan o'tish (6 xonali OTP yuboradi) |
| `POST` | `/auth/verify-email` | Ommaviy | 6 xonali kod bilan emailni tasdiqlash va avtologin |
| `POST` | `/auth/resend-verification` | Ommaviy (60s cooldown) | Yangi 6 xonali tasdiqlash kodi so'rash |
| `POST` | `/auth/login` | Ommaviy (Limit: 5 req/min) | Tizimga kirish (Faqat tasdiqlangan foydalanuvchilar) |
| `POST` | `/auth/refresh` | Ommaviy (Cookie) | Yangi Access Token olish |
| `POST` | `/auth/logout` | Ommaviy (Cookie) | Tizimdan chiqish (Tokenni bekor qilish) |
