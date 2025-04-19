// Add these helper functions at the top of your carController.js file

// Debug function to log image paths
const logImagePath = (prefix, imagePath) => {
  console.log(`${prefix} - Original image path:`, imagePath);
  if (!imagePath) {
    console.log(`${prefix} - No image path provided`);
    return null;
  }
  
  // Extract filename
  const filename = imagePath.includes('/') ? imagePath.split('/').pop() : imagePath;
  console.log(`${prefix} - Extracted filename:`, filename);
  
  const fullUrl = `${process.env.API_URL || 'http://localhost:5000'}/uploads/cars/${filename}`;
  console.log(`${prefix} - Generated full URL:`, fullUrl);
  return fullUrl;
};

// Ensure consistent image URL generation
const formatImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  // For direct paths like 'uploads/cars/image.jpg'
  if (imagePath.includes('uploads/cars/')) {
    return `${process.env.API_URL || 'http://localhost:5000'}/${imagePath}`;
  }
  
  // For just filenames
  return `${process.env.API_URL || 'http://localhost:5000'}/uploads/cars/${imagePath}`;
};
