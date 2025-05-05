const db = require('../config/database');

exports.sendMessage = async (req, res) => {
  try {
    const { receiver_id, booking_id, message } = req.body;
    const sender_id = req.user.id;

    
    const result = await db.query(
      'INSERT INTO messages (sender_id, receiver_id, booking_id, message) VALUES ($1, $2, $3, $4) RETURNING *',
      [sender_id, receiver_id, booking_id, message]
    );

    
    const newMessage = result.rows[0];
    
    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
};

exports.getConversation = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const otherUserId = req.params.userId;

    
    const result = await db.query(
      `SELECT m.*, 
        u1.name as sender_name, 
        u2.name as receiver_name
      FROM messages m
      JOIN users u1 ON m.sender_id = u1.id
      JOIN users u2 ON m.receiver_id = u2.id
      WHERE (m.sender_id = $1 AND m.receiver_id = $2)
      OR (m.sender_id = $2 AND m.receiver_id = $1)
      ORDER BY m.created_at ASC`,
      [currentUserId, otherUserId]
    );

    
    await db.query(
      'UPDATE messages SET read = TRUE WHERE sender_id = $1 AND receiver_id = $2 AND read = FALSE',
      [otherUserId, currentUserId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ message: 'Failed to fetch conversation' });
  }
};

exports.getAllConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    
    
    const result = await db.query(
      `WITH latest_messages AS (
        SELECT DISTINCT ON (
          CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END
        ) 
          id,
          sender_id,
          receiver_id,
          booking_id,
          message,
          created_at,
          read,
          CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END as other_user_id
        FROM messages
        WHERE sender_id = $1 OR receiver_id = $1
        ORDER BY other_user_id, created_at DESC
      )
      SELECT 
        lm.*,
        u.name as other_user_name,
        (SELECT COUNT(*) FROM messages 
         WHERE receiver_id = $1 
         AND sender_id = lm.other_user_id 
         AND read = FALSE) as unread_count,
        b.id as booking_id,
        c.brand as car_brand,
        c.model as car_model
      FROM latest_messages lm
      JOIN users u ON lm.other_user_id = u.id
      LEFT JOIN bookings b ON lm.booking_id = b.id
      LEFT JOIN cars c ON b.car_id = c.id
      ORDER BY lm.created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ message: 'Failed to fetch conversations' });
  }
};

exports.getBookingMessages = async (req, res) => {
  try {
    const bookingId = req.params.bookingId;
    const userId = req.user.id;

    
    const bookingCheck = await db.query(
      `SELECT b.id, b.renter_id, c.user_id as owner_id 
       FROM bookings b 
       JOIN cars c ON b.car_id = c.id 
       WHERE b.id = $1`,
      [bookingId]
    );

    if (bookingCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const booking = bookingCheck.rows[0];
    if (booking.renter_id !== userId && booking.owner_id !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    
    const result = await db.query(
      `SELECT m.*, 
        u1.name as sender_name, 
        u2.name as receiver_name
      FROM messages m
      JOIN users u1 ON m.sender_id = u1.id
      JOIN users u2 ON m.receiver_id = u2.id
      WHERE m.booking_id = $1
      ORDER BY m.created_at ASC`,
      [bookingId]
    );

    
    await db.query(
      'UPDATE messages SET read = TRUE WHERE booking_id = $1 AND receiver_id = $2 AND read = FALSE',
      [bookingId, userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching booking messages:', error);
    res.status(500).json({ message: 'Failed to fetch booking messages' });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await db.query(
      'SELECT COUNT(*) as count FROM messages WHERE receiver_id = $1 AND read = FALSE',
      [userId]
    );
    
    res.json({ unreadCount: parseInt(result.rows[0].count, 10) });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ message: 'Failed to get unread count' });
  }
};
