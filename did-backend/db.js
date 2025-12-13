// db.js
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./did.db', (err) => {
  if (err) {
    console.error('Error opening database', err);
  } else {
    console.log('SQLite DB opened');
  }
});

module.exports = db;
