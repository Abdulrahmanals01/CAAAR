const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Middleware imports
const userStatusMiddleware = require('./middleware/userStatus');

// Initialize express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Create car_ratings table if it doesn't exist
const { createCarRatingsTable } = require('./db-update');
createCarRatingsTable();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan('dev'));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes that don't need status check
app.use('/api/auth', require('./routes/authRoutes'));
app.use("/api/admin", require("./routes/adminRoutes"));

// Routes that need status check
app.use('/api/cars', require('./routes/carRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/roles', require('./routes/roleRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/ratings', require('./routes/ratingRoutes'));
app.use('/api/profiles', require('./routes/profileRoutes'));
app.use('/api/support', require('./routes/supportRoutes'));

// ... [Rest of the app.js remains the same] ...
