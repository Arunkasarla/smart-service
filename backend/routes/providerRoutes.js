const express = require('express');
const router = express.Router();
const db = require('../database');
const { authMiddleware } = require('../middleware/auth');

// GET /api/provider/:id/blocked-dates
router.get('/:id/blocked-dates', (req, res) => {
    const providerId = req.params.id;
    db.all('SELECT date FROM blocked_dates WHERE provider_id = ?', [providerId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const dates = rows.map(r => r.date);
        res.json(dates);
    });
});

// POST /api/provider/blocked-dates
router.post('/blocked-dates', authMiddleware, (req, res) => {
    // Requires a { date: 'YYYY-MM-DD', isBlocked: boolean } payload
    const providerId = req.user.id;
    const { date, isBlocked } = req.body;

    if (isBlocked) {
        db.run('INSERT INTO blocked_dates (provider_id, date) VALUES (?, ?)', [providerId, date], function(err) {
            // we ignore unique constraint errors theoretically if we implemented them, but here just insert
            res.json({ success: true, message: "Date blocked" });
        });
    } else {
        db.run('DELETE FROM blocked_dates WHERE provider_id = ? AND date = ?', [providerId, date], function(err) {
            res.json({ success: true, message: "Date unblocked" });
        });
    }
});

module.exports = router;
