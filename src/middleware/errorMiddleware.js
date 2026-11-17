// 404 Not Found xatolarini ushlash
export const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Topilmadi - ${req.originalUrl}`
  });
};

// Global xatoliklarni qayta ishlash
export const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Mongoose CastError (noto'g'ri ObjectId)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = 'Resurs topilmadi: Noto\'g\'ri ID formati';
  }

  // Mongoose Duplicate Key Error (masalan, bir xil email)
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `Ushbu ${field} bilan foydalanuvchi allaqachon mavjud`;
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
