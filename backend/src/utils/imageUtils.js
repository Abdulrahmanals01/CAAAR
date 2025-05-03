
/**
 * Standardized image handling utility functions
 */

// Base URL for images
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

/**
 * Get a standardized image URL
 * @param {string} imagePath - The path to the image 
 * @param {string} type - The type of image (cars, profiles, licenses)
 * @returns {string} - The full image URL
 */
const getImageUrl = (imagePath, type = '') => {
  if (!imagePath) {
    // Return placeholder image based on type
    return `${BASE_URL}/assets/images/${type}-placeholder.jpg`;
  }
  
  // Handle case when imagePath is already a full URL
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // Handle relative paths
  let fullPath = imagePath;
  
  // Ensure path starts with uploads/
  if (!fullPath.startsWith('uploads/')) {
    if (type) {
      fullPath = `uploads/${type}/${imagePath}`;
    } else {
      fullPath = `uploads/${imagePath}`;
    }
  }
  
  return `${BASE_URL}/${fullPath}`;
};

/**
 * Process image path to ensure consistent format
 * @param {string} imagePath - The path to process
 * @returns {string} - The processed path
 */
const processImagePath = (imagePath) => {
  if (!imagePath) return null;
  
  // Remove base URL if it exists
  let processedPath = imagePath;
  if (processedPath.startsWith(BASE_URL)) {
    processedPath = processedPath.substring(BASE_URL.length);
  }
  
  // Ensure path starts with a /
  if (!processedPath.startsWith('/')) {
    processedPath = '/' + processedPath;
  }
  
  // Remove any double slashes
  return processedPath.replace(/\/\//g, '/');
};

/**
 * Validate an uploaded image file
 * @param {object} file - The multer file object
 * @returns {object} - Validation result with valid flag and error message
 */
const validateImage = (file) => {
  // Check if file exists
  if (!file) {
    return { valid: false, error: 'No file uploaded' };
  }

  // Check mimetype
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return { 
      valid: false, 
      error: `Invalid file type. Only ${allowedMimeTypes.join(', ')} are allowed` 
    };
  }

  // Check file extension
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

module.exports = {
  getImageUrl,
  processImagePath,
  validateImage
};
