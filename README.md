# EduHub API - O'quv Platformasi Backend

EduHub o'quv platformasi uchun xavfsiz va to'liq arxitekturaga ega Node.js, Express.js va MongoDB (Mongoose) asosidagi RESTful API.

Loyihada **ES Modules** (`import` / `export`) sintaksisidan foydalanilgan.

---

## 🛠 Texnologiyalar to'plami (Tech Stack)
- **Runtime:** Node.js
- **Freymvork:** Express.js
- **Ma'lumotlar bazasi:** MongoDB & Mongoose ODM
- **Xavfsizlik:** 
  - `helmet` (HTTP xavfsizlik sarlavhalari)
  - `cors` (Faqat ruxsat berilgan manzil va cookies uchun `credentials: true`)
  - `express-rate-limit` (Brute-force hujumlaridan himoya)
  - `bcrypt` (Parollarni 10 salt rounds bilan hash qilish)
  - `jsonwebtoken` (Access & Refresh JWT tokenlar)
  - `cookie-parser` (HttpOnly xavfsiz cookie orqali refresh token boshqaruvi)

---

## 📁 Papka va fayllar tuzilmasi

```text
vazifull/
├── src/
│   ├── config/
│   │   └── db.js                 # MongoDB ulanish sozlamalari
│   ├── controllers/
│   │   ├── authController.js     # Register, Login, Refresh, Logout
│   │   ├── courseController.js   # Kurslar uchun CRUD operatsiyalari
│   │   └── userController.js     # Profil va Admin Dashboard
│   ├── middleware/
│   │   ├── authMiddleware.js     # Bearer Access Token tekshiruvi
│   │   ├── roleMiddleware.js     # Admin ruxsatini tekshirish (RBAC)
│   │   ├── rateLimit.js          # /auth/login uchun limit (5 so'rov/daqiqa)
│   │   └── errorMiddleware.js    # 404 va global xatoliklar qayta ishlovchisi
│   ├── models/
│   │   ├── Course.js             # Kurs Mongoose sxemasi
│   │   └── User.js               # Foydalanuvchi Mongoose sxemasi
│   ├── routes/
│   │   ├── authRoutes.js         # /auth yo'nalishlari
│   │   ├── courseRoutes.js       # /courses yo'nalishlari
│   │   └── userRoutes.js         # /profile va /admin/dashboard yo'nalishlari
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
   Loyiha ildizida `.env` faylini yarating yoki mavjudini sozlang:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGO_URI=mongodb://127.0.0.1:27017/eduhub
   JWT_ACCESS_SECRET=eduhub_super_secret_access_key_2026
   JWT_ACCESS_EXPIRES_IN=15m
   JWT_REFRESH_SECRET=eduhub_super_secret_refresh_key_2026
   JWT_REFRESH_EXPIRES_IN=7d
   CLIENT_URL=http://localhost:3000
   ```

3. **Serverni ishga tushirish:**
   - Ishlab chiqish (Development) rejimida:
     ```bash
     npm run dev
     ```
   - Ishlab chiqarish (Production) rejimida:
     ```bash
     npm start
     ```

---

## 📌 API Endpointlar ro'yxati

### 1. Autentifikatsiya (`/auth`)

| Metod | Yo'l | Ruxsat | Tavsif |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Ommaviy | Yangi foydalanuvchi qo'shish (email, password, role) |
| `POST` | `/auth/login` | Ommaviy (Limit: 5 req/min) | Tizimga kirish (Access Token JSON'da, Refresh Token cookie'da) |
| `POST` | `/auth/refresh` | Ommaviy (Cookie) | Yangi Access Token olish |
| `POST` | `/auth/logout` | Ommaviy (Cookie) | Tizimdan chiqish (Tokenni bekor qilish) |

#### Namunaviy so'rovlar:
- **POST `/auth/register`**
  ```json
  {
    "email": "admin@eduhub.uz",
    "password": "secretpassword123",
    "role": "admin"
  }
  ```

- **POST `/auth/login`**
  ```json
  {
    "email": "admin@eduhub.uz",
    "password": "secretpassword123"
  }
  ```
  *Javobda `accessToken` va HttpOnly `refreshToken` cookie qaytadi.*

---

### 2. Himoyalangan va Role-Based Yo'nalishlar (RBAC)

| Metod | Yo'l | Ruxsat | Tavsif |
| :--- | :--- | :--- | :--- |
| `GET` | `/profile` | Foydalanuvchi (Bearer Token) | Joriy foydalanuvchi ma'lumotlari |
| `GET` | `/admin/dashboard` | Admin (Bearer Token) | Admin boshqaruv paneli va statistika |

*So'rov yuborishda sarlavha (Header):*
```http
Authorization: Bearer <Sizning_Access_Tokeningiz>
```

---

### 3. Kurslar CRUD API (`/courses`)

| Metod | Yo'l | Ruxsat | Tavsif |
| :--- | :--- | :--- | :--- |
| `GET` | `/courses` | Ommaviy | Barcha kurslarni ko'rish |
| `GET` | `/courses/:id` | Ommaviy | Bitta kurs ma'lumotlarini olish |
| `POST` | `/courses` | Faqat Admin | Yangi kurs yaratish |
| `PUT` | `/courses/:id` | Faqat Admin | Kurs ma'lumotlarini tahrirlash |
| `DELETE`| `/courses/:id` | Faqat Admin | Kursni o'chirish |

#### Yangi kurs yaratish (`POST /courses`):
```json
{
  "title": "Node.js & Express.js Professional Kursi",
  "description": "Noldan boshlab mikroservislar va REST API yaratishgacha bo'lgan to'liq kurs.",
  "price": 1200000
}
```
