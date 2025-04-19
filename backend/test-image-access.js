const fs = require('fs');
const path = require('path');

// Function to check if a file exists and is readable
const checkFile = (filepath) => {
  try {
    fs.accessSync(filepath, fs.constants.R_OK);
    const stats = fs.statSync(filepath);
    return {
      exists: true,
      size: stats.size,
      path: filepath
    };
  } catch (error) {
    return {
      exists: false,
      error: error.message,
      path: filepath
    };
  }
};

// List all files in uploads/cars directory
const uploadDir = path.join(__dirname, 'uploads', 'cars');
console.log('Checking uploads directory:', uploadDir);

const files = fs.readdirSync(uploadDir);
console.log(`Found ${files.length} files in uploads/cars/`);

// Check each file
files.forEach(filename => {
  const filepath = path.join(uploadDir, filename);
  const result = checkFile(filepath);
  console.log(`File: ${filename}`);
  console.log(`  Exists: ${result.exists}`);
  if (result.exists) {
    console.log(`  Size: ${result.size} bytes`);
  } else {
    console.log(`  Error: ${result.error}`);
  }
  console.log(`  Path: ${result.path}`);
  console.log('---');
});

// Check from node_modules up to find where we're running from
let currentDir = __dirname;
while (currentDir !== '/') {
  console.log(`Current directory: ${currentDir}`);
  currentDir = path.dirname(currentDir);
}

console.log('Process current working directory:', process.cwd());
