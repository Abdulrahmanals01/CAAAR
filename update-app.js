const fs = require('fs');
const path = require('path');

const appJsPath = path.join(__dirname, 'backend', 'src', 'app.js');

fs.readFile(appJsPath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading app.js:', err);
    return;
  }

  
  if (data.includes('createAdminTrackingTables')) {
    console.log('Admin tracking functionality already present in app.js');
    return;
  }

  
  let updatedContent = data.replace(
    'const { createCarRatingsTable } = require(\'./db-update\');',
    'const { createCarRatingsTable } = require(\'./db-update\');\nconst { createAdminTrackingTables } = require(\'./db-update-admin-tracking\');'
  );

  
  updatedContent = updatedContent.replace(
    'createCarRatingsTable();',
    'createCarRatingsTable();\n
  );

  
  fs.writeFile(appJsPath, updatedContent, 'utf8', (err) => {
    if (err) {
      console.error('Error writing to app.js:', err);
      return;
    }
    console.log('Successfully updated app.js with admin tracking functionality');
  });
});
