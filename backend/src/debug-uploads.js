// Debug middleware for all routes
const debugMiddleware = (req, res, next) => {
  console.log('---------- DEBUG REQUEST ----------');
  console.log('URL:', req.originalUrl);
  console.log('Method:', req.method);
  console.log('Body:', req.body);
  console.log('Files:', req.file || req.files || 'No files');
  console.log('----------------------------------');
  next();
};

module.exports = debugMiddleware;
