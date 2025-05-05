const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

console.log('Starting booking system fixes implementation...');

const bookingControllerCmd = `cp /mnt/c/Users/ddodo/OneDrive/Desktop/CAAAR/backend/src/controllers/bookingController.fix.js /mnt/c/Users/ddodo/OneDrive/Desktop/CAAAR/backend/src/controllers/bookingController.js`;

const userStatusCmd = `cp /mnt/c/Users/ddodo/OneDrive/Desktop/CAAAR/backend/src/middleware/userStatus.js.bak /mnt/c/Users/ddodo/OneDrive/Desktop/CAAAR/backend/src/middleware/userStatus.js.bak.old && cp /mnt/c/Users/ddodo/OneDrive/Desktop/CAAAR/backend/src/middleware/userStatus.js /mnt/c/Users/ddodo/OneDrive/Desktop/CAAAR/backend/src/middleware/userStatus.js.bak`;

const extractAdminFuncsCmd = `
  # Extract the needed functions from adminController.fix.js
  node -e "
    const fs = require('fs');
    const adminFix = fs.readFileSync('/mnt/c/Users/ddodo/OneDrive/Desktop/CAAAR/backend/src/controllers/adminController.fix.js', 'utf8');
    const current = fs.readFileSync('/mnt/c/Users/ddodo/OneDrive/Desktop/CAAAR/backend/src/controllers/adminController.js', 'utf8');
    
    
    const freezeRegex = /exports\\.freezeUser = async \\(req, res\\) => \\{[\\s\\S]*?\\};\\s*/;
    const banRegex = /exports\\.banUser = async \\(req, res\\) => \\{[\\s\\S]*?\\};\\s*/;
    
    
    const freezeFunc = adminFix.match(/exports\\.freezeUser = async \\(req, res\\) => \\{[\\s\\S]*?\\};\\s*/)[0];
    const banFunc = adminFix.match(/exports\\.banUser = async \\(req, res\\) => \\{[\\s\\S]*?\\};\\s*/)[0];
    
    
    let updated = current.replace(freezeRegex, freezeFunc)
    updated = updated.replace(banRegex, banFunc);
    
    fs.writeFileSync('/mnt/c/Users/ddodo/OneDrive/Desktop/CAAAR/backend/src/controllers/adminController.js.new', updated);
  "
  
  # Backup and apply new version
  cp /mnt/c/Users/ddodo/OneDrive/Desktop/CAAAR/backend/src/controllers/adminController.js /mnt/c/Users/ddodo/OneDrive/Desktop/CAAAR/backend/src/controllers/adminController.js.bak && 
  cp /mnt/c/Users/ddodo/OneDrive/Desktop/CAAAR/backend/src/controllers/adminController.js.new /mnt/c/Users/ddodo/OneDrive/Desktop/CAAAR/backend/src/controllers/adminController.js
`;

const scheduleTasksCmd = `cp /mnt/c/Users/ddodo/OneDrive/Desktop/CAAAR/backend/src/scheduleTasks.js /mnt/c/Users/ddodo/OneDrive/Desktop/CAAAR/backend/src/scheduleTasks.js.bak && cp /mnt/c/Users/ddodo/OneDrive/Desktop/CAAAR/backend/src/scheduleTasks.js.new /mnt/c/Users/ddodo/OneDrive/Desktop/CAAAR/backend/src/scheduleTasks.js`;

const appJsUpdateCmd = `
  # Extract scheduler start line from the fix file
  node -e "
    const fs = require('fs');
    const appFix = fs.readFileSync('/mnt/c/Users/ddodo/OneDrive/Desktop/CAAAR/backend/src/app.js.booking-fix', 'utf8');
    const current = fs.readFileSync('/mnt/c/Users/ddodo/OneDrive/Desktop/CAAAR/backend/src/app.js', 'utf8');
    
    
    if (!current.includes('require(\\'./scheduleTasks\\')')) {
      
      let updated = current.replace(
        /const express = require\\('express'\\);/,
        'const express = require(\\'express\\');\\nconst startScheduler = require(\\'./scheduleTasks\\');'
      );
      
      
      updated = updated.replace(
        /createAdminTrackingTables\\(\\);/,
        'createAdminTrackingTables();\\n\\n
      );
      
      fs.writeFileSync('/mnt/c/Users/ddodo/OneDrive/Desktop/CAAAR/backend/src/app.js.new', updated);
    } else {
      
      fs.copyFileSync('/mnt/c/Users/ddodo/OneDrive/Desktop/CAAAR/backend/src/app.js', '/mnt/c/Users/ddodo/OneDrive/Desktop/CAAAR/backend/src/app.js.new');
    }
  "
  
  # Backup and apply new version
  cp /mnt/c/Users/ddodo/OneDrive/Desktop/CAAAR/backend/src/app.js /mnt/c/Users/ddodo/OneDrive/Desktop/CAAAR/backend/src/app.js.bak-booking-fix && 
  cp /mnt/c/Users/ddodo/OneDrive/Desktop/CAAAR/backend/src/app.js.new /mnt/c/Users/ddodo/OneDrive/Desktop/CAAAR/backend/src/app.js
`;

exec(bookingControllerCmd + ' && ' + 
     userStatusCmd + ' && ' + 
     extractAdminFuncsCmd + ' && ' + 
     scheduleTasksCmd + ' && ' + 
     appJsUpdateCmd, (error, stdout, stderr) => {
      
  if (error) {
    console.error(`Error implementing fixes: ${error.message}`);
    console.error(stderr);
    return;
  }
  
  console.log('Booking system fixes implemented successfully!');
  console.log('You should now restart the backend server to apply all changes.');
  console.log('Run: cd /mnt/c/Users/ddodo/OneDrive/Desktop/CAAAR/backend && npm run dev');
});
