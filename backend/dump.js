const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'smartservice.db');
const db = new sqlite3.Database(dbPath);

console.log('--- USERS TABLE ---');
db.all("SELECT id, name, role FROM users", (err, rows) => {
    console.log(rows);
    console.log('\n--- BOOKINGS TABLE ---');
    db.all("SELECT * FROM bookings", (err, rows) => {
        console.log(rows);
        db.close();
    });
});
