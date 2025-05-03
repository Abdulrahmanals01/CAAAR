const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

console.log('Starting image handling fix implementation...');

// 1. Create utility directories if they don't exist
const mkdirCmd = `
mkdir -p /mnt/c/Users/ddodo/OneDrive/Desktop/CAAAR/backend/src/utils
mkdir -p /mnt/c/Users/ddodo/OneDrive/Desktop/CAAAR/frontend/src/utils
mkdir -p /mnt/c/Users/ddodo/OneDrive/Desktop/CAAAR/backend/src/middleware
`;

exec(mkdirCmd, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error creating directories: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Directory creation stderr: ${stderr}`);
  }
  console.log('Directories created successfully');
  
  // 2. Apply the new app.js with image fix
  const applyAppCmd = `cp /mnt/c/Users/ddodo/OneDrive/Desktop/CAAAR/backend/src/app.js.image-fix /mnt/c/Users/ddodo/OneDrive/Desktop/CAAAR/backend/src/app.js`;
  
  exec(applyAppCmd, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error applying new app.js: ${error.message}`);
      return;
    }
    console.log('New app.js applied successfully');
    
    // 3. Run the image path fixer script
    console.log('Running image path fixer script...');
    const fixImgCmd = `cd /mnt/c/Users/ddodo/OneDrive/Desktop/CAAAR/backend && node src/fix-image-paths.js`;
    
    exec(fixImgCmd, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error running image fix script: ${error.message}`);
        return;
      }
      console.log(stdout);
      console.log('Image path standardization completed');
      
      console.log('\nImage handling fixes have been implemented successfully!');
      console.log('You should now restart both the backend and frontend services to apply all changes.');
    });
  });
});
