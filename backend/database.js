const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'smartservice.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err);
  } else {
    console.log('Connected to SQLite database.');
    initDb();
  }
});

function initDb() {
  db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT UNIQUE,
      phone TEXT,
      password TEXT,
      role TEXT DEFAULT 'user',
      provider_category TEXT,
      location TEXT,
      lat REAL,
      lng REAL
    )`);

    // Self-healing migrations for existing V1/V2 users
    db.run(`ALTER TABLE users ADD COLUMN provider_category TEXT`, (err) => { /* Ignore if it already exists */ });
    db.run(`ALTER TABLE users ADD COLUMN location TEXT`, (err) => { /* Ignore if it already exists */ });
    db.run(`ALTER TABLE users ADD COLUMN lat REAL`, (err) => { /* Ignore if it already exists */ });
    db.run(`ALTER TABLE users ADD COLUMN lng REAL`, (err) => { /* Ignore if it already exists */ });
    db.run(`ALTER TABLE users ADD COLUMN profile_photo TEXT`, (err) => { /* Ignore if it already exists */ });
    db.run(`ALTER TABLE users ADD COLUMN experience INTEGER DEFAULT 0`, (err) => { /* Ignore if it already exists */ });
    db.run(`ALTER TABLE users ADD COLUMN is_banned BOOLEAN DEFAULT 0`, (err) => { /* Ignore if it already exists */ });

    // Self-healing migrations for existing V1/V2 bookings
    db.run(`ALTER TABLE bookings ADD COLUMN payment_method TEXT DEFAULT 'cash'`, (err) => { /* Ignore if already exists */});
    db.run(`ALTER TABLE bookings ADD COLUMN proof_image TEXT`, (err) => { /* Ignore if already exists */});

    // Services table (legacy structure, we'll keep it for data parity but rely more on users)
    db.run(`CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider_id INTEGER,
      category TEXT,
      title TEXT,
      description TEXT,
      price REAL,
      image TEXT,
      status TEXT DEFAULT 'active',
      FOREIGN KEY(provider_id) REFERENCES users(id)
    )`);

    // Bookings table
    db.run(`CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      service_id INTEGER,
      provider_id INTEGER,
      date TEXT,
      time TEXT,
      address TEXT,
      notes TEXT,
      status TEXT DEFAULT 'pending',
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(service_id) REFERENCES services(id),
      FOREIGN KEY(provider_id) REFERENCES users(id)
    )`);
    
    // Notifications table
    db.run(`CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      content TEXT,
      is_read INTEGER DEFAULT 0,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`);
    
    // Reviews table
    db.run(`CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER,
      user_id INTEGER,
      provider_id INTEGER,
      rating INTEGER,
      comment TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(booking_id) REFERENCES bookings(id),
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(provider_id) REFERENCES users(id)
    )`);

    // Messages table
    db.run(`CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER,
      receiver_id INTEGER,
      content TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(sender_id) REFERENCES users(id),
      FOREIGN KEY(receiver_id) REFERENCES users(id)
    )`);

    // Blocked Dates table
    db.run(`CREATE TABLE IF NOT EXISTS blocked_dates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider_id INTEGER,
      date TEXT,
      FOREIGN KEY(provider_id) REFERENCES users(id)
    )`);
  });
}

module.exports = db;
