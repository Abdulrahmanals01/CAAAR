// Get available dates for a car
exports.getCarAvailability = async (req, res) => {
  try {
    const { carId } = req.params;

    // First, get the car details to check its overall availability period
    const carResult = await db.query('SELECT * FROM cars WHERE id = $1', [carId]);

    if (carResult.rows.length === 0) {
      return res.status(404).json({ message: 'Car not found' });
    }

    // Then get all accepted bookings for this car
    const bookingsResult = await db.query(
      `SELECT start_date, end_date
       FROM bookings
       WHERE car_id = $1
       AND status = 'accepted'
       ORDER BY start_date`,
      [carId]
    );

    // Return the car info and booked periods
    res.json({
      car: carResult.rows[0],
      bookedPeriods: bookingsResult.rows
    });
  } catch (err) {
    console.error('Error getting car availability:', err);
    res.status(500).json({ message: 'Server error while getting car availability' });
  }
};
