const express = require('express');
const { authMiddleware, restrictTo } = require('../middleware/auth');
const db = require('../database');
const router = express.Router();

// Get all providers (Services in V2/V3 are the providers themselves)
router.get('/', (req, res) => {
  const sql = `
    SELECT u.id as provider_id, u.name as provider_name, u.provider_category as category, 
           u.location, u.experience, u.profile_photo,
           'Professional ' || u.provider_category as title, 
           'Expert ' || u.provider_category || ' ready to assist you.' as description, 
           400 as price, 
           IFNULL(AVG(r.rating), 0) as rating, COUNT(r.id) as review_count
    FROM users u
    LEFT JOIN reviews r ON u.id = r.provider_id
    WHERE u.role = 'provider' AND (u.is_banned = 0 OR u.is_banned IS NULL)
    GROUP BY u.id
  `;
  
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    
    const formattedRows = rows.map(r => ({
      id: r.provider_id, 
      provider_id: r.provider_id,
      category: r.category,
      title: r.provider_name, 
      description: `Professional ${r.category} located at ${r.location || 'your area'} with ${r.experience || 0} years experience.`,
      price: Math.floor(Math.random() * 500) + 300, // Mock dynamic pricing in INR
      image: r.profile_photo ? `http://localhost:5000${r.profile_photo}` : `https://source.unsplash.com/400x300/?${r.category},portrait`,
      experience: r.experience || 0,
      rating: r.rating.toFixed(1),
      review_count: r.review_count
    }));
    res.json(formattedRows);
  });
});

// Search and filter providers
router.get('/search', (req, res) => {
  const { category, query } = req.query;
  let sql = `
    SELECT u.id as provider_id, u.name as provider_name, u.provider_category as category, 
           u.location, u.experience, u.profile_photo,
           IFNULL(AVG(r.rating), 0) as rating, COUNT(r.id) as review_count
    FROM users u
    LEFT JOIN reviews r ON u.id = r.provider_id
    WHERE u.role = 'provider' AND (u.is_banned = 0 OR u.is_banned IS NULL)
  `;
  const params = [];

  if (category) {
    sql += ` AND u.provider_category = ?`;
    params.push(category);
  }
  
  if (query) {
    sql += ` AND (u.name LIKE ? OR u.provider_category LIKE ?)`;
    params.push(`%${query}%`, `%${query}%`);
  }
  
  sql += ` GROUP BY u.id`;

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
     
     const formattedRows = rows.map(r => ({
      id: r.provider_id,
      provider_id: r.provider_id,
      category: r.category,
      title: r.provider_name,
      description: `Professional ${r.category} located at ${r.location || 'your area'}. Highly rated with ${r.experience || 0} years experience.`,
      price: Math.floor(Math.random() * 500) + 300,
      image: r.profile_photo ? `http://localhost:5000${r.profile_photo}` : `https://source.unsplash.com/400x300/?${r.category},portrait`,
      experience: r.experience || 0,
      rating: r.rating.toFixed(1),
      review_count: r.review_count
    }));
    res.json(formattedRows);
  });
});

// Provider: Add a new service
router.post('/', authMiddleware, restrictTo('provider', 'admin'), (req, res) => {
  const { category, title, description, price, image } = req.body;
  const provider_id = req.user.id;

  const sql = `INSERT INTO services (provider_id, category, title, description, price, image) VALUES (?, ?, ?, ?, ?, ?)`;
  db.run(sql, [provider_id, category, title, description, price, image || ''], function(err) {
    if (err) return res.status(500).json({ message: 'Error adding service' });
    res.status(201).json({ message: 'Service added successfully', id: this.lastID });
  });
});

// Provider: Get own services
router.get('/my-services', authMiddleware, restrictTo('provider'), (req, res) => {
  const provider_id = req.user.id;
  db.all(`SELECT * FROM services WHERE provider_id = ?`, [provider_id], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    res.json(rows);
  });
});

// Provider: Delete service
router.delete('/:id', authMiddleware, restrictTo('provider', 'admin'), (req, res) => {
  db.run(`DELETE FROM services WHERE id = ? AND provider_id = ?`, [req.params.id, req.user.id], function(err) {
    if (err) return res.status(500).json({ message: 'Database error' });
    res.json({ message: 'Service deleted' });
  });
});

module.exports = router;
