const { validationResult } = require('express-validator');
const db = require('../config/database');
const fs = require('fs');
const path = require('path');

// Create a new car listing
exports.createCar = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const {
      brand,
      model,
      year,
      plate,
      color,
      mileage,
      price_per_day,
      location,
      latitude,
      longitude,
      availability_start,
      availability_end
    } = req.body;
    
    // Check if user is a host
    const userCheck = await db.query('SELECT role FROM users WHERE id = $1', [req.user.id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (userCheck.rows[0].role !== 'host' && userCheck.rows[0].role !== 'admin') {
      return res.status(403).json({ message: 'Only hosts can create car listings' });
    }
    
    // Handle image upload
    const image = req.file ? req.file.path : null;
    
    // Check if plate number already exists
    const plateCheck = await db.query('SELECT id FROM cars WHERE plate = $1', [plate]);
    if (plateCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Car with this plate number already exists' });
    }
    
    // Insert car into database
    const carInsert = await db.query(
      `INSERT INTO cars 
      (user_id, brand, model, year, plate, color, mileage, price_per_day, location, latitude, longitude, availability_start, availability_end, image) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
      RETURNING *`,
      [
        req.user.id,
        brand,
        model,
        year,
        plate,
        color,
        mileage,
        price_per_day,
        location,
        latitude || null,
        longitude || null,
        availability_start,
        availability_end,
        image
      ]
    );
    
    res.status(201).json(carInsert.rows[0]);
  } catch (err) {
    console.error('Error creating car listing:', err.message);
    res.status(500).json({ message: 'Server error while creating car listing' });
  }
};

// Get all available cars
exports.getCars = async (req, res) => {
  try {
    // Build the query to get all available cars with host information
    const query = `
      SELECT c.id, c.brand, c.model, c.year, c.color, c.mileage, 
             c.price_per_day, c.location, c.availability_start, 
             c.availability_end, c.image, c.created_at,
             u.name as host_name, u.id as host_id
      FROM cars c
      JOIN users u ON c.user_id = u.id
      WHERE c.status = 'available'
      ORDER BY c.created_at DESC
    `;
    
    const result = await db.query(query);
    
    // Format image URLs
    const cars = result.rows.map(car => {
      if (car.image) {
        // Remove 'uploads/' from the beginning if present
        const imagePath = car.image.startsWith('uploads/') 
          ? car.image 
          : car.image;
        
        car.image_url = `${process.env.API_URL || 'http://localhost:5000'}/${imagePath}`;
      }
      return car;
    });
    
    res.json(cars);
  } catch (err) {
    console.error('Error fetching cars:', err.message);
    res.status(500).json({ message: 'Server error while fetching cars' });
  }
};

// Get car by ID
exports.getCarById = async (req, res) => {
  try {
    const carId = req.params.id;
    
    const query = `
      SELECT c.*, u.name as host_name, u.id as host_id
      FROM cars c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = $1
    `;
    
    const result = await db.query(query, [carId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Car not found' });
    }
    
    const car = result.rows[0];
    
    // Format image URL
    if (car.image) {
      const imagePath = car.image.startsWith('uploads/') 
        ? car.image 
        : car.image;
      
      car.image_url = `${process.env.API_URL || 'http://localhost:5000'}/${imagePath}`;
    }
    
    res.json(car);
  } catch (err) {
    console.error('Error fetching car details:', err.message);
    res.status(500).json({ message: 'Server error while fetching car details' });
  }
};

// Get host's cars
exports.getHostCars = async (req, res) => {
  try {
    const hostId = req.user.id;
    
    const cars = await db.query(
      `SELECT * FROM cars WHERE user_id = $1 ORDER BY created_at DESC`,
      [hostId]
    );
    
    // Format image URLs
    const formattedCars = cars.rows.map(car => {
      if (car.image) {
        const imagePath = car.image.startsWith('uploads/') 
          ? car.image 
          : car.image;
        
        car.image_url = `${process.env.API_URL || 'http://localhost:5000'}/${imagePath}`;
      }
      return car;
    });
    
    res.json(formattedCars);
  } catch (err) {
    console.error('Error fetching host cars:', err.message);
    res.status(500).json({ message: 'Server error while fetching host cars' });
  }
};
