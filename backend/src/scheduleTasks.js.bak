const autoCompleteExpiredBookings = require('./autoCompleteBookings');
const rejectExpiredBookings = require('../autoRejectExpiredBookings');

// Run auto-completion check every hour
function startScheduler() {
  console.log('Starting booking schedulers...');
  
  // Run both immediately on startup
  autoCompleteExpiredBookings();
  rejectExpiredBookings();
  
  // Run auto-complete every hour
  setInterval(() => {
    autoCompleteExpiredBookings();
  }, 60 * 60 * 1000); // 1 hour in milliseconds
  
  // Run auto-reject every 3 hours
  setInterval(() => {
    rejectExpiredBookings();
  }, 3 * 60 * 60 * 1000); // 3 hours in milliseconds
}

module.exports = startScheduler;
