const emailService = require('../config/email');
const { validationResult } = require('express-validator');
const db = require('../config/database');

exports.submitInquiry = async (req, res) => {
  console.log('Support inquiry received:', req.body);
  try {
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { name, email, subject, message } = req.body;
    console.log('Request data:', { name, email, subject, message });
    
    
    if (!name || !email || !subject || !message) {
      console.log('Missing required fields');
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('Invalid email format:', email);
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }
    
    
    const ticketId = 'SAY-' + Date.now().toString().slice(-8);
    console.log('Generated ticket ID:', ticketId);
    
    
    try {
      console.log('Creating support_tickets table if needed...');
      await db.query(`
        CREATE TABLE IF NOT EXISTS support_tickets (
          id SERIAL PRIMARY KEY,
          ticket_id VARCHAR(20) NOT NULL,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          subject VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('Support tickets table created or verified');
    } catch (tableError) {
      console.error('Error creating table:', tableError);
    }
    
    
    try {
      console.log('Saving ticket to database...');
      const result = await db.query(
        'INSERT INTO support_tickets (ticket_id, name, email, subject, message) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [ticketId, name, email, subject, message]
      );
      console.log('Ticket saved to database, ID:', result.rows[0].id);
    } catch (dbError) {
      console.error('Database error:', dbError);
      
    }
    
    
    console.log('Sending support emails...');
    await emailService.sendSupportConfirmation(email, name, subject, message, ticketId);
    console.log('Support emails sent successfully');
    
    
    return res.status(200).json({
      success: true,
      message: 'Your support request has been submitted successfully. You will receive a confirmation email shortly.',
      ticketId: ticketId
    });
  } catch (error) {
    console.error('Error submitting support inquiry:', error);
    return res.status(500).json({
      success: false,
      message: 'We encountered an error while processing your request. Please try again later.'
    });
  }
};

exports.getUserInfo = async (req, res) => {
  try {
    
    return res.status(200).json({
      name: req.user.name,
      email: req.user.email
    });
  } catch (error) {
    console.error('Error fetching user information:', error);
    return res.status(500).json({ message: 'Error fetching user information' });
  }
};
