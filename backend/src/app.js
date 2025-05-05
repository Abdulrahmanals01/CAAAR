const express = require('express');
const cors = require('cors');
const errorHandler = require("./middleware/errorHandler");
const morgan = require('morgan');
const helmet = require('helmet');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const startScheduler = require('./scheduleTasks');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: (origin, callback) => {
      
      const allowedOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'];
      const isLocalhost = origin && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'));
      
      if (!origin || isLocalhost || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const { createCarRatingsTable, createAdminTrackingTables } = require('./db-update');
createCarRatingsTable();

createAdminTrackingTables();

startScheduler();

app.use(helmet({
  contentSecurityPolicy: false, 
  crossOriginResourcePolicy: false 
}));

app.use(cors({
  origin: (origin, callback) => {
    
    const allowedOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'];
    const isLocalhost = origin && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'));
    
    if (!origin || isLocalhost || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan('dev'));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/cars', require('./routes/carRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/roles', require('./routes/roleRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/ratings', require('./routes/ratingRoutes'));
app.use('/api/profiles', require('./routes/profileRoutes'));
app.use('/api/support', require('./routes/supportRoutes'));
app.use("/api/admin", require("./routes/adminRoutes"));

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.user.id;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

const connectedUsers = new Map();

io.on('connection', (socket) => {
  const userId = socket.userId;

  
  connectedUsers.set(userId, socket.id);
  console.log(`User connected: ${userId}`);

  
  socket.on('send_message', async (data) => {
    try {
      const { receiver_id, message, booking_id } = data;

      
      

      
      const messageData = {
        sender_id: userId,
        receiver_id,
        message,
        booking_id,
        created_at: new Date(),
        read: false
      };

      
      const receiverSocketId = connectedUsers.get(receiver_id);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('receive_message', messageData);
      }

      
      socket.emit('message_sent', messageData);

    } catch (error) {
      console.error('Socket message error:', error);
      socket.emit('message_error', { error: 'Failed to process message' });
    }
  });

  
  socket.on('typing', (data) => {
    const { receiver_id, isTyping } = data;

    
    const receiverSocketId = connectedUsers.get(receiver_id);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('typing', {
        user_id: userId,
        isTyping
      });
    }
  });

  
  socket.on('disconnect', () => {
    connectedUsers.delete(userId);
    console.log(`User disconnected: ${userId}`);
  });
});

app.use(errorHandler);

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Sayarati API' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
