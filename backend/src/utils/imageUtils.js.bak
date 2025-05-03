/**
 * Utility functions for handling image paths and URLs
 */

const path = require('path');

/**
 * Formats image URLs consistently regardless of source format
 * @param {string} imagePath - The raw image path from the database
 * @param {string} type - The image type ('cars' or 'licenses')
 * @returns {string|null} - The formatted image URL or null if no image
 */
const formatImageUrl = (imagePath, type = 'cars') => {
  if (!imagePath) return null;

  // Get the base URL from environment or default
  const baseUrl = process.env.API_URL || "http://localhost:5000";
  
  // Normalize image paths to a consistent format
  
  // Case 1: If it's already a complete URL, return it
  if (imagePath.startsWith("http")) {
    return imagePath;
  }
  
  // Case 2: If it's an absolute path from the filesystem
  if (imagePath.startsWith("/mnt/") || imagePath.startsWith("C:")) {
    // Extract just the filename
    const filename = path.basename(imagePath);
    return `${baseUrl}/uploads/${type}/${filename}`;
  }
  
  // Case 3: If it's already a proper relative path with 'uploads'
  if (imagePath.startsWith("uploads/")) {
    return `${baseUrl}/${imagePath}`;
  }
  
  // Case 4: If it contains uploads path in the middle
  if (imagePath.includes("/uploads/")) {
    const parts = imagePath.split("/uploads/");
    return `${baseUrl}/uploads/${parts[1]}`;
  }
  
  // Case 5: If it's just a filename or relative path without 'uploads'
  return `${baseUrl}/uploads/${type}/${path.basename(imagePath)}`;
};

/**
 * Normalizes image paths for database storage
 * @param {string} imagePath - The raw image path
 * @param {string} type - The image type ('cars' or 'licenses')
 * @returns {string|null} - The normalized path for database storage
 */
const normalizeImagePath = (imagePath, type = 'cars') => {
  if (!imagePath) return null;
  
  // Goal is to store as: "uploads/cars/filename.jpg"
  
  // If it's already in the correct format, return it
  if (imagePath.startsWith("uploads/") && imagePath.includes(`/${type}/`)) {
    return imagePath;
  }
  
  // Extract filename and normalize
  const filename = path.basename(imagePath);
  return `uploads/${type}/${filename}`;
};

module.exports = {
  formatImageUrl,
  normalizeImagePath
};
