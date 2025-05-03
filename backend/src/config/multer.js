const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { validateImage } = require('../utils/imageUtils');

// Ensure upload directories exist
const licensesDir = path.join(__dirname, '../../uploads/licenses');
const carsDir = path.join(__dirname, '../../uploads/cars');
const profilesDir = path.join(__dirname, '../../uploads/profiles');

// Create upload directories if they don't exist
[licensesDir, carsDir, profilesDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === 'licenseImage') {
      cb(null, licensesDir);
    } else if (file.fieldname === 'image') {
      cb(null, carsDir);
    } else if (file.fieldname === 'profileImage') {
      cb(null, profilesDir);
    } else {
      cb(null, path.join(__dirname, '../../uploads'));
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fieldPrefix = file.fieldname === 'licenseImage' ? 'license_image' : file.fieldname;
    
    // Sanitize the original filename extension
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
    const safeExt = allowedExtensions.includes(ext) ? ext : '.jpg';
    
    cb(null, fieldPrefix + '-' + uniqueSuffix + safeExt);
  }
});

// Improved file filter with better error messages
const fileFilter = (req, file, cb) => {
  // Use the validateImage function
  const validation = validateImage(file);
  
  if (!validation.valid) {
    return cb(new Error(validation.error), false);
  }
  
  cb(null, true);
};

// Create the multer instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: fileFilter
});

module.exports = upload;
