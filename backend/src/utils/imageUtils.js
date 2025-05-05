

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

const getImageUrl = (imagePath, type = '') => {
  if (!imagePath) {
    return `${BASE_URL}/assets/images/${type}-placeholder.jpg`;
  }
  
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  let fullPath = imagePath;
  
  if (!fullPath.startsWith('uploads/')) {
    if (type) {
      fullPath = `uploads/${type}/${imagePath}`;
    } else {
      fullPath = `uploads/${imagePath}`;
    }
  }
  
  return `${BASE_URL}/${fullPath}`;
};

const processImagePath = (imagePath) => {
  if (!imagePath) return null;
  
  let processedPath = imagePath;
  if (processedPath.startsWith(BASE_URL)) {
    processedPath = processedPath.substring(BASE_URL.length);
  }
  
  if (!processedPath.startsWith('/')) {
    processedPath = '/' + processedPath;
  }
  
  return processedPath.replace(/\/+/g, '/');
};

const validateImage = (file) => {
  if (!file) {
    return { valid: false, error: 'No file uploaded' };
  }

  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return { 
      valid: false, 
      error: `Invalid file type. Only ${allowedMimeTypes.join(', ')} are allowed` 
    };
  }

  const ext = file.originalname.split('.').pop().toLowerCase();
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif'];
  if (!allowedExtensions.includes(ext)) {
    return { 
      valid: false, 
      error: `Invalid file extension. Only ${allowedExtensions.join(', ')} are allowed` 
    };
  }

  return { valid: true };
};

const formatImageUrl = getImageUrl;
const normalizeImagePath = processImagePath;

module.exports = {
  getImageUrl,
  processImagePath,
  validateImage,
  formatImageUrl,
  normalizeImagePath
};
