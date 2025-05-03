// Standardize image handling across the application
const fs = require('fs');
const path = require('path');

// Create a utility function for standardized image handling
const imageUtilsContent = `
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
    return \`\${BASE_URL}/assets/images/\${type}-placeholder.jpg\`;
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
      fullPath = \`uploads/\${type}/\${imagePath}\`;
    } else {
      fullPath = \`uploads/\${imagePath}\`;
    }
  }
  
  return \`\${BASE_URL}/\${fullPath}\`;
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
  return processedPath.replace(/\\/\\\//g, '/');
};

module.exports = {
  getImageUrl,
  processImagePath
};
`;

// Path to the backend image utils file
const backendImageUtilsPath = path.join(__dirname, 'backend/src/utils/imageUtils.js');

// Write the backend image utils file
fs.writeFileSync(backendImageUtilsPath, imageUtilsContent);

// Path to the frontend image utils file
const frontendImageUtilsPath = path.join(__dirname, 'frontend/src/utils/imageUtils.js');

// Write the frontend image utils file
fs.writeFileSync(frontendImageUtilsPath, `
/**
 * Standardized image handling utility functions
 */

// Base URL for API
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

/**
 * Get a standardized image URL
 * @param {string} imagePath - The path to the image 
 * @param {string} type - The type of image (cars, profiles, licenses)
 * @returns {string} - The full image URL
 */
export const getImageUrl = (imagePath, type = '') => {
  if (!imagePath) {
    // Return placeholder image based on type
    return \`/assets/images/\${type}-placeholder.jpg\`;
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
      fullPath = \`uploads/\${type}/\${imagePath}\`;
    } else {
      fullPath = \`uploads/\${imagePath}\`;
    }
  }
  
  return \`\${BASE_URL}/\${fullPath}\`;
};

/**
 * Get appropriate placeholder image based on type
 * @param {string} type - The type of placeholder (cars, profiles, licenses)
 * @returns {string} - The placeholder image URL
 */
export const getPlaceholderImage = (type = 'car') => {
  return \`/assets/images/\${type}-placeholder.jpg\`;
};
`);

// Update frontend Car API
const carApiPath = path.join(__dirname, 'frontend/src/api/cars.js');
let carApiContent = fs.readFileSync(carApiPath, 'utf8');

// Ensure the getImageUrl import is at the top
if (!carApiContent.includes('import { getImageUrl }')) {
  carApiContent = `import axios from '../utils/axiosConfig';
import { getImageUrl } from '../utils/imageUtils';

${carApiContent.replace('import axios from \'../utils/axiosConfig\';', '')}`;
}

// Replace any image processing code with the standardized version
carApiContent = carApiContent.replace(
  /if \(car\.image && !car\.image_url\) \{[\s\S]*?\}/g,
  `if (car.image && !car.image_url) {
      car.image_url = getImageUrl(car.image, 'cars');
    }`
);

fs.writeFileSync(carApiPath, carApiContent);

// Update all components that handle images
const componentsToUpdate = [
  'frontend/src/components/cars/CarCard.jsx',
  'frontend/src/pages/CarDetails.jsx',
  'frontend/src/pages/ManageCars.jsx'
];

componentsToUpdate.forEach(componentPath => {
  const fullPath = path.join(__dirname, componentPath);
  
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Add import if not present
    if (!content.includes('import { getImageUrl }')) {
      const importStatement = `import { getImageUrl } from '../utils/imageUtils';`;
      content = content.replace(/import React[^;]*;/, match => `${match}\n${importStatement}`);
    }
    
    // Replace direct image URL constructions
    content = content.replace(/(`|'|")\${(?:process\.env\.REACT_APP_API_URL|'[^']*'|"[^"]*")}\/uploads\/[^`'"]*(`|'|")/g, 
      `getImageUrl(car.image, 'cars')`);
    
    // Replace other image URL patterns
    content = content.replace(/\${baseUrl}\/\${imagePath}/g, 'getImageUrl(imagePath, "cars")');
    
    fs.writeFileSync(fullPath, content);
  }
});

console.log('Image handling has been standardized successfully');
