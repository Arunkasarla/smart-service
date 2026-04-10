const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../database');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

const upload = require('../multerConfig'); // V3 Import

// Register User
router.post('/register', upload.single('profile_photo'), async (req, res) => {
  const { name, email, phone, password, role, provider_category, experience } = req.body;
  const profile_photo = req.file ? `/uploads/${req.file.filename}` : null;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please provide all required fields' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = `INSERT INTO users (name, email, phone, password, role, provider_category, experience, profile_photo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    const userRole = role === 'provider' ? 'provider' : 'user';
    const category = userRole === 'provider' ? (provider_category || 'electrician') : null;
    const providerExperience = userRole === 'provider' ? (parseInt(experience) || 0) : null;

    db.run(sql, [name, email, phone, hashedPassword, userRole, category, providerExperience, profile_photo], function (err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ message: 'Email already exists' });
        }
        return res.status(500).json({ message: 'Database error', error: err.message });
      }

      const token = jwt.sign({ id: this.lastID, role: userRole }, JWT_SECRET, { expiresIn: '1d' });
      res.status(201).json({ message: 'User registered successfully', token, user: { id: this.lastID, name, email, role: userRole, provider_category: category, experience: providerExperience, profile_photo } });
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login User
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password' });
  }

  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    if (user.is_banned === 1) {
        return res.status(403).json({ message: 'Account Terminated: You have been permanently banned by the Admin.' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ message: 'Login successful', token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  });
});
// Admin Registration (High Security)
router.post('/admin/register', async (req, res) => {
  try {
    const { name, email, password, adminSecret } = req.body;

    // Secure Passcode Required for Admin Registry
    if (adminSecret !== 'gravity99') {
       return res.status(403).json({ message: 'Unauthorized: Invalid Admin Secret Passcode.' });
    }

    db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
      if (user) {
        return res.status(400).json({ message: 'Admin with this email already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      db.run(
        `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`,
        [name, email, hashedPassword, 'admin'],
        function(err) {
          if (err) return res.status(500).json({ message: 'Database error' });

          const token = jwt.sign(
            { id: this.lastID, email, role: 'admin' },
            JWT_SECRET,
            { expiresIn: '30d' }
          );

          res.status(201).json({
            token,
            user: { id: this.lastID, name, email, role: 'admin' }
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
