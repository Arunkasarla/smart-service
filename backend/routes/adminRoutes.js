const express = require('express');
const { authMiddleware, restrictTo } = require('../middleware/auth');
const db = require('../database');
const router = express.Router();

// GET all providers
router.get('/providers', authMiddleware, restrictTo('admin'), (req, res) => {
    const sql = `
        SELECT u.id, u.name, u.email, u.phone, u.provider_category, u.is_banned,
               COUNT(b.id) as total_bookings
        FROM users u
        LEFT JOIN bookings b ON u.id = b.provider_id
        WHERE u.role = 'provider'
        GROUP BY u.id
        ORDER BY u.id DESC
    `;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// TOGGLE BAN Provider
router.post('/provider/:id/ban', authMiddleware, restrictTo('admin'), (req, res) => {
    const providerId = req.params.id;
    const { is_banned } = req.body; // 1 or 0
    
    db.run(`UPDATE users SET is_banned = ? WHERE id = ? AND role = 'provider'`, [is_banned, providerId], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, is_banned });
    });
});

module.exports = router;
