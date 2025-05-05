const fs = require('fs');
const path = require('path');

const controllerPath = path.join(__dirname, 'backend/src/controllers/bookingController.js');

let content = fs.readFileSync(controllerPath, 'utf8');

const fixedContent = content.replace(
  /} catch \(err\) \{\s*\^\^\^\^\^/,
  `} catch (err) {
    console.error('Error processing booking:', err);
    res.status(500).json({ message: 'Server error' });
  }`
);

fs.writeFileSync(controllerPath, fixedContent);

console.log('Fixed syntax error in bookingController.js');
