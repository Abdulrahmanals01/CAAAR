/**
 * Global error handling middleware
 * This provides consistent error responses across the application
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error occurred:', err);
  
  // Determine status code
  const statusCode = err.statusCode || 500;
  
  // Format error response
  const errorResponse = {
    message: err.message || 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.stack : {}
  };
  
  // If this is a validation error from express-validator
  if (err.errors && Array.isArray(err.errors)) {
    errorResponse.validationErrors = err.errors;
  }
  
  res.status(statusCode).json(errorResponse);
};

module.exports = errorHandler;
