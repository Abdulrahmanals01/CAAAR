const { normalizeImagePath, formatImageUrl } = require('../utils/imageUtils');

const standardizeImagePaths = (req, res, next) => {
  if (req.file) {
    
    let imageType = 'misc';
    
    if (req.originalUrl.includes('/cars')) {
      imageType = 'cars';
    } else if (req.originalUrl.includes('/auth')) {
      imageType = 'licenses';
    } else if (req.file.fieldname === 'license_image') {
      imageType = 'licenses';
    }
    
    
    req.file.originalPath = req.file.path;
    req.file.path = normalizeImagePath(req.file.path, imageType);
    
    console.log(`Standardized image path: ${req.file.originalPath} -> ${req.file.path}`);
  }
  
  next();
};

const addImageUrls = (req, res, next) => {
  
  const originalSend = res.send;
  
  
  res.send = function(body) {
    try {
      
      if (typeof body === 'string') {
        body = JSON.parse(body);
      }
      
      
      if (body && typeof body === 'object' && !Array.isArray(body)) {
        if (body.image && !body.image_url) {
          
          const imageType = body.license_image ? 'licenses' : 'cars';
          body.image_url = formatImageUrl(body.image, imageType);
        }
        
        if (body.license_image && !body.license_image_url) {
          body.license_image_url = formatImageUrl(body.license_image, 'licenses');
        }
      }
      
      
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
      
      
      return originalSend.call(this, JSON.stringify(body));
    } catch (err) {
      console.error('Error in addImageUrls middleware:', err);
      
      return originalSend.call(this, body);
    }
  };
  
  next();
};

module.exports = {
  standardizeImagePaths,
  addImageUrls
};
