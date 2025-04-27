const autoCompleteExpiredBookings = require('./autoCompleteBookings');

// Run auto-completion check every hour
function startScheduler() {
  console.log('Starting booking auto-completion scheduler...');
  
  // Run immediately on startup
  autoCompleteExpiredBookings();
  
  // Run every hour
  setInterval(() => {
    autoCompleteExpiredBookings();
  }, 60 * 60 * 1000); // 1 hour in milliseconds
}

module.exports = startScheduler;
