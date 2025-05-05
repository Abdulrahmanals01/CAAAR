
const formatImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  
  const baseUrl = process.env.API_URL || "http://localhost:5000";
  
  
  if (imagePath.startsWith("http")) {
    return imagePath;
  }
  
  
  if (imagePath.startsWith("/mnt/") || imagePath.startsWith("C:")) {
    
    const parts = imagePath.split("/");
    const filename = parts[parts.length - 1];
    return `${baseUrl}/uploads/cars/${filename}`;
  }
  
  
  if (imagePath.startsWith("uploads/")) {
    return `${baseUrl}/${imagePath}`;
  }
  
  
  return `${baseUrl}/uploads/cars/${imagePath}`;
};
