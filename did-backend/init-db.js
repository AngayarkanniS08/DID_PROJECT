// init-db.js
const db = require('./db');

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS challenges (
      id TEXT PRIMARY KEY,
      website_url TEXT,
      status TEXT,
      created_at INTEGER,
      expires_at INTEGER
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      did TEXT UNIQUE,
      email TEXT
    )
  `);
});
