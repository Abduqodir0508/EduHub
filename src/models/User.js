import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email kiritilishi shart'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Iltimos, to\'g\'ri email formatini kiriting'
      ]
    },
    password: {
      type: String,
      required: [true, 'Parol kiritilishi shart'],
      minlength: [6, 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak']
    },
    role: {
      type: String,
      enum: {
        values: ['user', 'admin'],
        message: 'Rol faqat "user" yoki "admin" bo\'lishi mumkin'
      },
      default: 'user'
    },
    refreshToken: {
      type: String,
      default: null
    },
    // Email tasdiqlash maydonlari
    isVerified: {
      type: Boolean,
      default: false
    },
    verificationCode: {
      type: String,
      default: null
    },
    verificationCodeExpires: {
      type: Date,
      default: null
    },
    lastVerificationResend: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Parolni tekshirish uchun yordamchi metod
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// JSON ko'rinishida qaytarilganda maxfiy ma'lumotlarni yashirish
userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.refreshToken;
  delete userObject.verificationCode;
  delete userObject.verificationCodeExpires;
  return userObject;
};

const User = mongoose.model('User', userSchema);

export default User;
