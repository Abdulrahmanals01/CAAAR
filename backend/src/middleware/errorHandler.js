
const errorHandler = (err, req, res, next) => {
  console.error('Error occurred:', err);
  
  
  const statusCode = err.statusCode || 500;
  
  
  const errorResponse = {
    message: err.message || 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.stack : {}
  };
  
  
  if (err.errors && Array.isArray(err.errors)) {
    errorResponse.validationErrors = err.errors;
  }
  
  res.status(statusCode).json(errorResponse);
};

module.exports = errorHandler;
