#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Fixing car routes parameter issue...${NC}"

# Create a backup
cp ./backend/src/routes/carRoutes.js ./backend/src/routes/carRoutes.js.bak

# Let's check both possible fixes:

# Option 1: Check bookingController to see if it uses 'carId' parameter
if grep -q "req.params.carId" ./backend/src/controllers/bookingController.js; then
  echo -e "${YELLOW}bookingController uses 'carId' parameter. The route is correct.${NC}"
  echo -e "${YELLOW}Checking if getCarAvailability function exists...${NC}"
  
  # Check if the getCarAvailability function exists
  if ! grep -q "getCarAvailability" ./backend/src/controllers/bookingController.js; then
    echo -e "${RED}The getCarAvailability function is missing in bookingController.js${NC}"
    
    # Add the missing function
    cat >> ./backend/src/controllers/bookingController.js << 'EOF'

// Get car availability for a specific date range
exports.getCarAvailability = async (req, res) => {
  try {
    const carId = req.params.carId;

    // First, get the car details to check its overall availability period
    const carResult = await db.query('SELECT * FROM cars WHERE id = $1', [carId]);

    if (carResult.rows.length === 0) {
      return res.status(404).json({ message: 'Car not found' });
    }

    const car = carResult.rows[0];

    // Then get all accepted and pending bookings for this car
    const bookingsResult = await db.query(
      `SELECT id, start_date, end_date, status
       FROM bookings
       WHERE car_id = $1
       AND status IN ('accepted', 'pending')
       ORDER BY start_date`,
      [carId]
    );

    // Process the data to create a more useful availability map
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const availabilityStart = new Date(car.availability_start) < today ? today : new Date(car.availability_start);
    const availabilityEnd = new Date(car.availability_end);

    // Generate a day-by-day availability map
    const availabilityMap = {};
    let currentDate = new Date(availabilityStart);

    while (currentDate <= availabilityEnd) {
      const dateString = currentDate.toISOString().split('T')[0];
      availabilityMap[dateString] = true; // initially mark as available
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Mark booked days as unavailable
    bookingsResult.rows.forEach(booking => {
      let bookingStart = new Date(booking.start_date);
      const bookingEnd = new Date(booking.end_date);

      while (bookingStart <= bookingEnd) {
        const dateString = bookingStart.toISOString().split('T')[0];
        if (availabilityMap[dateString]) {
          availabilityMap[dateString] = false; // mark as unavailable
        }
        bookingStart.setDate(bookingStart.getDate() + 1);
      }
    });

    // Convert to array format for easier frontend processing
    const availabilityArray = Object.entries(availabilityMap).map(([date, available]) => ({
      date,
      available
    }));

    // Return the car info, booked periods, and availability map
    res.json({
      car: carResult.rows[0],
      bookedPeriods: bookingsResult.rows,
      availabilityDays: availabilityArray,
      availabilityStart: availabilityStart.toISOString().split('T')[0],
      availabilityEnd: availabilityEnd.toISOString().split('T')[0]
    });
  } catch (err) {
    console.error('Error getting car availability:', err);
    res.status(500).json({ message: 'Server error while getting car availability' });
  }
};
EOF
    echo -e "${GREEN}Added missing getCarAvailability function to bookingController.js${NC}"
  fi
else
  # Option 2: Change the route parameter to 'id' to match the controller
  echo -e "${YELLOW}Changing route parameter from 'carId' to 'id' to match the controller...${NC}"
  sed -i 's/router.get("\/:carId\/availability"/router.get("\/:id\/availability"/' ./backend/src/routes/carRoutes.js
  echo -e "${GREEN}Route parameter fixed!${NC}"
fi

echo -e "${GREEN}Fix completed! Try running the server again.${NC}"
