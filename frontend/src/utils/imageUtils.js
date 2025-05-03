// Centralized image utility functions

/**
 * Get the full URL for an image
 * @param {string} imagePath - The image path (can be partial or full)
 * @param {string} type - The image type (cars, profiles, licenses)
 * @returns {string|null} The full image URL or null if no image
 */
export const getImageUrl = (imagePath, type) => {
  if (!imagePath) return null;
  
  // Handle already formatted URLs
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Handle relative URLs
  const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  
  // Normalize the path
  let normalizedPath = imagePath;
  
  // Remove any leading 'uploads/' as it's included in the URL construction
  if (normalizedPath.startsWith('uploads/')) {
    normalizedPath = normalizedPath.substring(8);
  }
  
  // Ensure type is included in the path if not already
  if (type && !normalizedPath.includes(type)) {
    return `${baseUrl}/uploads/${type}/${normalizedPath}`;
  }
  
  return `${baseUrl}/uploads/${normalizedPath}`;
};

/**
 * Get placeholder image for a specific type
 * @param {string} type - The image type (cars, profile, license)
 * @returns {string} The placeholder image path
 */
export const getPlaceholderImage = (type) => {
  const placeholders = {
    'cars': '/assets/images/car-placeholder.jpg',
    'profile': '/assets/images/profile-placeholder.jpg',
    'license': '/assets/images/license-placeholder.jpg'
  };
  
  return placeholders[type] || placeholders['cars'];
};

/**
 * Format image URL with fallback
 * @param {string} imagePath - The image path
 * @param {string} type - The image type
 * @returns {string} The formatted image URL or placeholder
 */
export const getImageWithFallback = (imagePath, type) => {
  const imageUrl = getImageUrl(imagePath, type);
  return imageUrl || getPlaceholderImage(type);
};
