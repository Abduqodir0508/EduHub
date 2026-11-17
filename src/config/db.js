import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`[Database] MongoDB muvaffaqiyatli ulandi: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[Database Error] MongoDB ulanishida xatolik: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
