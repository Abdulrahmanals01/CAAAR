const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();
// Import routes
const routes = require('./routes');
// Initialize express app
const app = express();
// Security middleware
app.use(helmet());
// Enable CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
// Request logging
app.use(morgan('dev'));
// Body parser middleware - explicitly configure for both JSON and URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Log all incoming requests for debugging
app.use((req, res, next) => {
  console.log('Request Method:', req.method);
  console.log('Request Path:', req.path);
  console.log('Request Headers:', req.headers);
  console.log('Request Body:', req.body);
  next();
});
// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
// API routes
app.use('/api', routes);
// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Sayarati API is running' });
});
// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});
// Set port and start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
module.exports = app;
