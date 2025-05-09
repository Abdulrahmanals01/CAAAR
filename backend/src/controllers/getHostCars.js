
exports.getHostCars = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`Fetching cars for host ${userId}`);
    
    const query = `
      SELECT c.*,
             (SELECT COUNT(*) FROM bookings b WHERE b.car_id = c.id AND b.status = 'accepted') as active_bookings_count 
      FROM cars c
      WHERE c.user_id = $1
      ORDER BY c.created_at DESC
    `;
    
    const result = await db.query(query, [userId]);
    
    console.log(`Found ${result.rows.length} cars for host ${userId}`);
    
    
    const cars = result.rows.map(car => {
      if (car.image && !car.image_url) {
        const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
        
        
        let imagePath = car.image;
        if (!imagePath.startsWith('uploads/')) {
          imagePath = `uploads/cars/${imagePath}`;
        }
        
        car.image_url = `${baseUrl}/${imagePath}`;
      }
      return car;
    });

    res.json(cars);
  } catch (err) {
    console.error('Error fetching host cars:', err);
    res.status(500).json({ message: 'Server error while fetching cars' });
  }
};
