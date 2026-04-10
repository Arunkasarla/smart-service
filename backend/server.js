require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');

const authRoutes = require('./routes/authRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const reviewRoutes = require('./routes/reviewRoutes'); // V3 Import
const initSocket = require('./socket');
const fs = require('fs');
const db = require('./database');

const app = express();
const server = http.createServer(app);

// Continuous Server DB Dump Logging for Debugging
setInterval(() => {
    db.all("SELECT * FROM bookings", [], (err, bookings) => {
        db.all("SELECT * FROM users", [], (err, users) => {
             db.all("SELECT * FROM services", [], (err, services) => {
                 fs.writeFileSync('db_dump.json', JSON.stringify({bookings, users, services}, null, 2));
             });
        });
    });
}, 5000);

// Initialize WebSockets
const io = initSocket(server);

// Make io accessible in routes if needed (e.g., req.io)
app.use((req, res, next) => {
  req.io = io;
  next();
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json()); 
app.use('/uploads', express.static('uploads')); // Host images publicly 

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes); // V3 Mount
app.use('/api/messages', require('./routes/messageRoutes')); // V4 Mount
app.use('/api/provider', require('./routes/providerRoutes')); // V5 Mount
app.use('/api/admin', require('./routes/adminRoutes')); // V6 Mount


// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

// Start Server through HTTP
server.listen(PORT, () => {
  console.log(`HTTP and WebSocket Server running on port ${PORT}`);
});
