const fs = require('fs');
const path = require('path');

try {
  
  const fixFilePath = path.join(__dirname, 'backend/src/controllers/bookingController.fix.js');
  const controllerPath = path.join(__dirname, 'backend/src/controllers/bookingController.js');
  
  
  const fixFunctions = fs.readFileSync(fixFilePath, 'utf8');
  let controllerContent = fs.readFileSync(controllerPath, 'utf8');
  
  
  const acceptBookingPattern = /const acceptBooking = async[\s\S]*?cancelBooking\(\);/;
  
  
  const fixedFunctions = `async function acceptBooking(req, res, bookingId) {
  return require('./bookingController.fix').acceptBooking(req, res, bookingId);
}

async function rejectBooking(req, res, bookingId) {
  return require('./bookingController.fix').rejectBooking(req, res, bookingId);
}

async function cancelBooking(req, res, bookingId) {
  return require('./bookingController.fix').cancelBooking(req, res, bookingId);
}`;
  
  
  controllerContent = controllerContent.replace(/async function acceptBooking[\s\S]*?res\.json\(\{[\s\S]*?\}\);[\s\S]*?\}[\s\S]*?async function rejectBooking[\s\S]*?res\.json\(\{[\s\S]*?\}\);[\s\S]*?\}[\s\S]*?async function cancelBooking[\s\S]*?res\.json\(\{[\s\S]*?\}\);[\s\S]*?\}/s, fixedFunctions);
  
  
  fs.writeFileSync(
    path.join(__dirname, 'backups', new Date().toISOString().slice(0,10).replace(/-/g,''), 'bookingController.js.bak'), 
    fs.readFileSync(controllerPath)
  );
  
  
  fs.writeFileSync(controllerPath, controllerContent);
  
  console.log('Successfully updated booking controller!');
} catch (error) {
  console.error('Error updating controller:', error);
}
