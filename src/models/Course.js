import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Kurs nomi kiritilishi shart'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Kurs tavsifi kiritilishi shart'],
      trim: true
    },
    price: {
      type: Number,
      required: [true, 'Kurs narxi kiritilishi shart'],
      min: [0, 'Kurs narxi manfiy bo\'lishi mumkin emas']
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

const Course = mongoose.model('Course', courseSchema);

export default Course;
