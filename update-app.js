const fs = require('fs');
const path = require('path');

// Path to app.js
const appJsPath = path.join(__dirname, 'backend', 'src', 'app.js');

// Read the original file
fs.readFile(appJsPath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading app.js:', err);
    return;
  }

  // Check if the tracking functionality already exists
  if (data.includes('createAdminTrackingTables')) {
    console.log('Admin tracking functionality already present in app.js');
    return;
  }

  // Import the admin tracking table creation function
  let updatedContent = data.replace(
    'const { createCarRatingsTable } = require(\'./db-update\');',
    'const { createCarRatingsTable } = require(\'./db-update\');\nconst { createAdminTrackingTables } = require(\'./db-update-admin-tracking\');'
  );

  // Call the function after calling createCarRatingsTable
  updatedContent = updatedContent.replace(
    'createCarRatingsTable();',
    'createCarRatingsTable();\n// Create admin tracking tables if they don\'t exist\ncreateAdminTrackingTables();'
  );

  // Write the updated content back to the file
  fs.writeFile(appJsPath, updatedContent, 'utf8', (err) => {
    if (err) {
      console.error('Error writing to app.js:', err);
      return;
    }
    console.log('Successfully updated app.js with admin tracking functionality');
  });
});
