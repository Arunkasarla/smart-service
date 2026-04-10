const express = require('express');
const { authMiddleware, restrictTo } = require('../middleware/auth');
const db = require('../database');
const router = express.Router();

// Create a review
router.post('/', authMiddleware, restrictTo('user'), (req, res) => {
  const { booking_id, provider_id, rating, comment } = req.body;
  const user_id = req.user.id;

  if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Valid rating between 1 and 5 is required' });
  }

  const sql = `INSERT INTO reviews (booking_id, user_id, provider_id, rating, comment) VALUES (?, ?, ?, ?, ?)`;
  db.run(sql, [booking_id, user_id, provider_id, rating, comment || ''], function(err) {
    if (err) return res.status(500).json({ message: 'Error submitting review' });
    
    // Auto-update booking to 'reviewed' so user can't submit twice if needed.
    // For simplicity, we just save the review.
    res.status(201).json({ message: 'Review successfully submitted', id: this.lastID });
  });
});

// Get reviews for a provider
router.get('/:providerId', (req, res) => {
  const sql = `
    SELECT r.id, r.rating, r.comment, r.timestamp, u.name as reviewer_name 
    FROM reviews r 
    JOIN users u ON r.user_id = u.id 
    WHERE r.provider_id = ? ORDER BY r.id DESC`;
    
  db.all(sql, [req.params.providerId], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    
    // Calculate average
    const totalRatings = rows.length;
    const avgRating = totalRatings > 0 ? rows.reduce((acc, curr) => acc + curr.rating, 0) / totalRatings : 0;
    
    res.json({
        average_rating: avgRating.toFixed(1),
        total_reviews: totalRatings,
        reviews: rows
    });
  });
});

module.exports = router;
