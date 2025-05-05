const rejectExpiredBookings = require('./autoRejectExpiredBookings');

function setupExpiredBookingChecker(app) {
  
  rejectExpiredBookings();
  
  
  const HOUR_IN_MS = 60 * 60 * 1000;
  setInterval(rejectExpiredBookings, HOUR_IN_MS);
  
  
  app.post('/api/admin/check-expired-bookings', async (req, res) => {
    try {
      await rejectExpiredBookings();
      res.json({ success: true, message: 'Expired bookings check completed' });
    } catch (error) {
      console.error('Error in manual expired bookings check:', error);
      res.status(500).json({ success: false, message: 'Error checking expired bookings' });
    }
  });
  
  console.log('Expired booking checker scheduled');
}

module.exports = setupExpiredBookingChecker;
