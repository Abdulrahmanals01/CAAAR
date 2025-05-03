const fs = require('fs');
const path = require('path');

// Path to the controller file
const controllerPath = path.join(__dirname, 'backend/src/controllers/bookingController.js');

// Read the file content
let content = fs.readFileSync(controllerPath, 'utf8');

// Fix the syntax error by ensuring there's no orphaned catch block
const fixedContent = content.replace(
  /} catch \(err\) \{\s*\^\^\^\^\^/,
  `} catch (err) {
    console.error('Error processing booking:', err);
    res.status(500).json({ message: 'Server error' });
  }`
);

// Write the fixed content back to the file
fs.writeFileSync(controllerPath, fixedContent);

console.log('Fixed syntax error in bookingController.js');
