const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { validateImage } = require('../utils/imageUtils');

const licensesDir = path.join(__dirname, '../../uploads/licenses');
const carsDir = path.join(__dirname, '../../uploads/cars');
const profilesDir = path.join(__dirname, '../../uploads/profiles');

[licensesDir, carsDir, profilesDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

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
    
    
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
    const safeExt = allowedExtensions.includes(ext) ? ext : '.jpg';
    
    cb(null, fieldPrefix + '-' + uniqueSuffix + safeExt);
  }
});

const fileFilter = (req, file, cb) => {
  
  const validation = validateImage(file);
  
  if (!validation.valid) {
    return cb(new Error(validation.error), false);
  }
  
  cb(null, true);
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, 
  },
  fileFilter: fileFilter
});

module.exports = upload;
