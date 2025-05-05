

export const getImageUrl = (imagePath, type) => {
  if (!imagePath) return null;
  
  
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  
  const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  
  
  let normalizedPath = imagePath;
  
  
  if (normalizedPath.startsWith('uploads/')) {
    normalizedPath = normalizedPath.substring(8);
  }
  
  
  if (type && !normalizedPath.includes(type)) {
    return `${baseUrl}/uploads/${type}/${normalizedPath}`;
  }
  
  return `${baseUrl}/uploads/${normalizedPath}`;
};

export const getPlaceholderImage = (type) => {
  const placeholders = {
    'cars': '/assets/images/car-placeholder.jpg',
    'profile': '/assets/images/profile-placeholder.jpg',
    'license': '/assets/images/license-placeholder.jpg'
  };
  
  return placeholders[type] || placeholders['cars'];
};

export const getImageWithFallback = (imagePath, type) => {
  const imageUrl = getImageUrl(imagePath, type);
  return imageUrl || getPlaceholderImage(type);
};
