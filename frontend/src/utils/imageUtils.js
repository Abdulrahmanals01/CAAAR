/**
 * Simple image handling utilities
 */

// Base URL for API
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

/**
 * Get standardized image URL
 */
export const getImageUrl = (imagePath, type = '') => {
  if (!imagePath) {
    return `/assets/images/${type || 'car'}-placeholder.jpg`;
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

/**
 * Get placeholder image
 */
export const getPlaceholderImage = (type = 'car') => {
  return `/assets/images/${type}-placeholder.jpg`;
};
