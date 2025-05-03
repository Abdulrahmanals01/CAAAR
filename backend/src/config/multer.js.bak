const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const licensesDir = path.join(__dirname, '../../uploads/licenses');
const carsDir = path.join(__dirname, '../../uploads/cars');

if (!fs.existsSync(licensesDir)) {
  fs.mkdirSync(licensesDir, { recursive: true });
}
if (!fs.existsSync(carsDir)) {
  fs.mkdirSync(carsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === 'licenseImage') {
      cb(null, licensesDir);
    } else if (file.fieldname === 'image') {
      cb(null, carsDir);
    } else {
      cb(null, path.join(__dirname, '../../uploads'));
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fieldPrefix = file.fieldname === 'licenseImage' ? 'license_image' : file.fieldname;
    cb(null, fieldPrefix + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
    return cb(new Error('Only image files are allowed!'), false);
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
