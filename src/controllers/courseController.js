import Course from '../models/Course.js';

/**
 * @desc    Barcha kurslarni olish
 * @route   GET /courses
 * @access  Public
 */
export const getCourses = async (req, res, next) => {
  try {
    const courses = await Course.find()
      .populate('createdBy', 'email role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Yagona kursni ID orqali olish (ixtiyoriy, qo'shimcha qulaylik)
 * @route   GET /courses/:id
 * @access  Public
 */
export const getCourseById = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id).populate('createdBy', 'email role');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Kurs topilmadi'
      });
    }

    res.status(200).json({
      success: true,
      data: course
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Yangi kurs yaratish
 * @route   POST /courses
 * @access  Private (Faqat Admin)
 */
export const createCourse = async (req, res, next) => {
  try {
    const { title, description, price } = req.body;

    if (!title || !description || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'title, description va price maydonlari kiritilishi shart'
      });
    }

    const course = await Course.create({
      title,
      description,
      price,
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Kurs muvaffaqiyatli yaratildi',
      data: course
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Kursni yangilash
 * @route   PUT /courses/:id
 * @access  Private (Faqat Admin)
 */
export const updateCourse = async (req, res, next) => {
  try {
    const { title, description, price } = req.body;

    let course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Yangilanishi kerak bo\'lgan kurs topilmadi'
      });
    }

    course = await Course.findByIdAndUpdate(
      req.params.id,
      {
        ...(title && { title }),
        ...(description && { description }),
        ...(price !== undefined && { price })
      },
      {
        new: true,
        runValidators: true
      }
    ).populate('createdBy', 'email role');

    res.status(200).json({
      success: true,
      message: 'Kurs muvaffaqiyatli yangilandi',
      data: course
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Kursni o'chirish
 * @route   DELETE /courses/:id
 * @access  Private (Faqat Admin)
 */
export const deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'O\'chirilishi kerak bo\'lgan kurs topilmadi'
      });
    }

    await Course.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Kurs muvaffaqiyatli o\'chirildi'
    });
  } catch (error) {
    next(error);
  }
};
