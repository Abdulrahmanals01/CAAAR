const { normalizeImagePath, formatImageUrl } = require('../utils/imageUtils');

/**
 * Middleware to standardize image paths in request files
 */
const standardizeImagePaths = (req, res, next) => {
  if (req.file) {
    // Determine image type based on route or field name
    let imageType = 'misc';
    
    if (req.originalUrl.includes('/cars')) {
      imageType = 'cars';
    } else if (req.originalUrl.includes('/auth')) {
      imageType = 'licenses';
    } else if (req.file.fieldname === 'license_image') {
      imageType = 'licenses';
    }
    
    // Normalize the file path
    req.file.originalPath = req.file.path;
    req.file.path = normalizeImagePath(req.file.path, imageType);
    
    console.log(`Standardized image path: ${req.file.originalPath} -> ${req.file.path}`);
  }
  
  next();
};

/**
 * Middleware to ensure response objects with image fields have proper image_url
 */
const addImageUrls = (req, res, next) => {
  // Store the original send function
  const originalSend = res.send;
  
  // Override the send function
  res.send = function(body) {
    try {
      // If body is a string (already stringified JSON), parse it
      if (typeof body === 'string') {
        body = JSON.parse(body);
      }
      
      // Process single object response
      if (body && typeof body === 'object' && !Array.isArray(body)) {
        if (body.image && !body.image_url) {
          // Detect image type
          const imageType = body.license_image ? 'licenses' : 'cars';
          body.image_url = formatImageUrl(body.image, imageType);
        }
        
        if (body.license_image && !body.license_image_url) {
          body.license_image_url = formatImageUrl(body.license_image, 'licenses');
        }
      }
      
      // Process array response
      if (Array.isArray(body)) {
        body = body.map(item => {
          if (item && typeof item === 'object') {
            if (item.image && !item.image_url) {
              const imageType = item.license_image ? 'licenses' : 'cars';
              item.image_url = formatImageUrl(item.image, imageType);
            }
            
            if (item.license_image && !item.license_image_url) {
              item.license_image_url = formatImageUrl(item.license_image, 'licenses');
            }
          }
          return item;
        });
      }
      
      // Call the original send function with the processed body
      return originalSend.call(this, JSON.stringify(body));
    } catch (err) {
      console.error('Error in addImageUrls middleware:', err);
      // If there's an error, just use the original body
      return originalSend.call(this, body);
    }
  };
  
  next();
};

module.exports = {
  standardizeImagePaths,
  addImageUrls
};
