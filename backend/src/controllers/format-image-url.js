// Helper function to format image URLs consistently
const formatImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  // Get the base URL
  const baseUrl = process.env.API_URL || "http://localhost:5000";
  
  // Case 1: If it's already a complete URL, return it
  if (imagePath.startsWith("http")) {
    return imagePath;
  }
  
  // Case 2: If it's an absolute path from the filesystem
  if (imagePath.startsWith("/mnt/") || imagePath.startsWith("C:")) {
    // Extract just the filename
    const parts = imagePath.split("/");
    const filename = parts[parts.length - 1];
    return `${baseUrl}/uploads/cars/${filename}`;
  }
  
  // Case 3: If it's already a proper relative path
  if (imagePath.startsWith("uploads/")) {
    return `${baseUrl}/${imagePath}`;
  }
  
  // Case 4: If it's just a filename
  return `${baseUrl}/uploads/cars/${imagePath}`;
};
