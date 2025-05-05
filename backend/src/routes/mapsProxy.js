const express = require('express');
const router = express.Router();
const axios = require('axios');
const { authenticate } = require('../middleware/auth');

router.get('/geocode', async (req, res) => {
  try {
    const { address } = req.query;
    if (!address) {
      return res.status(400).json({ message: 'Address parameter is required' });
    }

    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address,
        key: process.env.GOOGLE_MAPS_API_KEY
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error proxying geocode request:', error);
    res.status(500).json({ message: 'Error processing geocode request' });
  }
});

router.get('/places', async (req, res) => {
  try {
    const { query, location, radius } = req.query;
    if (!query) {
      return res.status(400).json({ message: 'Query parameter is required' });
    }

    const response = await axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
      params: {
        query,
        location,
        radius: radius || 5000,
        key: process.env.GOOGLE_MAPS_API_KEY
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error proxying places request:', error);
    res.status(500).json({ message: 'Error processing places request' });
  }
});

module.exports = router;
