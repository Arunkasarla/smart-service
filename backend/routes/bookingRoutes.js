const express = require('express');
const { authMiddleware, restrictTo } = require('../middleware/auth');
const db = require('../database');
const upload = require('../multerConfig'); 
const router = express.Router();

// User: Create a booking
router.post('/', authMiddleware, restrictTo('user'), (req, res) => {
  const { service_id, provider_id, date, time, address, notes, payment_method } = req.body;
  const user_id = req.user.id;

  const sql = `INSERT INTO bookings (user_id, service_id, provider_id, date, time, address, notes, payment_method) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  db.run(sql, [user_id, service_id, provider_id, date, time, address, notes || '', payment_method || 'cod'], function(err) {
    if (err) return res.status(500).json({ message: 'Error creating booking' });
    
    // Save Notification to DB
    const message = `New booking request from user ID ${user_id} on ${date} at ${time}.`;
    db.run(`INSERT INTO notifications (user_id, content) VALUES (?, ?)`, [provider_id, message]);

    // Emit Real-time Notification
    if (req.io) {
      req.io.emit('booking_notification', {
        providerId: provider_id,
        message: message,
        timestamp: new Date()
      });
    }

    res.status(201).json({ message: 'Booking created successfully', id: this.lastID });
  });
});

// Update Booking Status (Generic) -> e.g. 'accepted', 'started', 'paid'
router.put('/:id/status', authMiddleware, restrictTo('provider', 'admin', 'user'), (req, res) => {
  const { status } = req.body;
  
  db.run(`UPDATE bookings SET status = ? WHERE id = ?`, [status, req.params.id], function(err) {
    if (err) return res.status(500).json({ message: 'Database error' });
    res.json({ message: 'Status updated successfully' });
  });
});

// Update Booking to Completed with Proof Image
router.put('/:id/complete', authMiddleware, restrictTo('provider', 'admin'), upload.single('proof_image'), (req, res) => {
  const proof_image = req.file ? `http://localhost:5000/uploads/${req.file.filename}` : null;
  
  db.run(`UPDATE bookings SET status = 'completed', proof_image = ? WHERE id = ?`, [proof_image, req.params.id], function(err) {
    if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Database error' });
    }
    res.json({ message: 'Service marked as completed successfully', proof_image });
  });
});

// Get User Bookings
router.get('/my-bookings', authMiddleware, restrictTo('user'), (req, res) => {
  const sql = `
    SELECT b.*, 'Professional ' || u.provider_category as service_title, u.name as provider_name 
    FROM bookings b 
    LEFT JOIN users u ON b.provider_id = u.id 
    WHERE b.user_id = ? ORDER BY b.id DESC`;
    
  db.all(sql, [req.user.id], (err, rows) => {
    if (err) {
        console.error('GET /my-bookings SQL Error:', err.message);
        return res.status(500).json({ message: 'Database error', detail: err.message });
    }
    res.json(rows || []);
  });
});

// Get Provider Booking Requests
router.get('/requests', authMiddleware, restrictTo('provider'), (req, res) => {
  const sql = `
    SELECT b.*, 'Professional ' || u.provider_category as title, c.name as user_name, c.phone as user_phone
    FROM bookings b
    LEFT JOIN users u ON b.provider_id = u.id
    LEFT JOIN users c ON b.user_id = c.id
    WHERE b.provider_id = ? ORDER BY b.id DESC`;
    
  db.all(sql, [req.user.id], (err, rows) => {
    if (err) {
        console.error('GET /requests SQL Error:', err.message);
        return res.status(500).json({ message: 'Database error', detail: err.message });
    }
    res.json(rows || []);
  });
});

// Admin: Get all platform bookings
router.get('/all', authMiddleware, restrictTo('admin'), (req, res) => {
  const sql = `
    SELECT b.*, 
           'Professional ' || u.provider_category as service_title, 
           u.name as provider_name, 
           u.lat as provider_lat, 
           u.lng as provider_lng, 
           c.name as user_name
    FROM bookings b
    JOIN users u ON b.provider_id = u.id
    JOIN users c ON b.user_id = c.id
    ORDER BY b.id DESC`;
    
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    res.json(rows || []);
  });
});

// Admin: Export platform data to CSV
router.get('/export', authMiddleware, restrictTo('admin'), (req, res) => {
  const sql = `
    SELECT b.id as Booking_ID, 
           b.date as Date,
           b.time as Time,
           b.status as Status,
           b.payment_method as Payment_Method,
           b.address as Address,
           u.name as Provider_Name, 
           c.name as Customer_Name
    FROM bookings b
    JOIN users u ON b.provider_id = u.id
    JOIN users c ON b.user_id = c.id
    ORDER BY b.id DESC`;
    
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    
    if (!rows || rows.length === 0) {
        return res.status(404).send("No records found.");
    }

    // Convert JSON array of objects to CSV string physically
    const headers = Object.keys(rows[0]).join(',');
    const csvRows = rows.map(row => {
        return Object.values(row).map(val => {
            // Escape commas and quotes
            return `"${String(val).replace(/"/g, '""')}"`;
        }).join(',');
    });
    
    const csvData = [headers, ...csvRows].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="smartservice-data.csv"');
    res.send(csvData);
  });
});

module.exports = router;
