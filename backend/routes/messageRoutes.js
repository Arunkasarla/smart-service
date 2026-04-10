const express = require('express');
const db = require('../database');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

// Get historical messages between two users relating to a specific booking/context
router.get('/:userId/:providerId', authMiddleware, (req, res) => {
  const { userId, providerId } = req.params;
  
  // Verify the requester is one of the parties
  if (req.user.id !== parseInt(userId) && req.user.id !== parseInt(providerId)) {
     return res.status(403).json({ message: 'Unauthorized strictly to this chat instance.' });
  }

  const sql = `
    SELECT * FROM messages 
    WHERE (sender_id = ? AND receiver_id = ?) 
       OR (sender_id = ? AND receiver_id = ?)
    ORDER BY timestamp ASC
  `;
  
  db.all(sql, [userId, providerId, providerId, userId], (err, rows) => {
    if (err) {
       console.error("Chat SQL Error:", err);
       return res.status(500).json({ message: 'Database error fetching chat records' });
    }
    res.json(rows || []);
  });
});

module.exports = router;
