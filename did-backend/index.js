// index.js
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const db = require('./db'); // <-- import our SQLite connection
const app = express();

app.use(cors());
app.use(express.json({limit:'1mb'})); // parse JSON bodies


app.get('/', (req, res) => {
  res.send('DID backend is running');
});

// NEW: /api/challenge route
// PURPOSE: Website calls this to create a login challenge
app.post('/api/challenge', (req, res) => {
  const { websiteUrl } = req.body;

  //  Validate input exists
  if (!websiteUrl || typeof websiteUrl !== 'string') {
    return res.status(400).json({ error: 'websiteUrl is required as string' });
  }

   // Basic format check (very simple for now)
  // Only allow domain-like strings, no spaces, no <script>
  const urlPattern = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/; // e.g. msu.ac.in
  if (!urlPattern.test(websiteUrl)) {
    return res.status(400).json({ error: 'Invalid websiteUrl format' });
  }

  if (!websiteUrl) {
    return res.status(400).json({ error: 'websiteUrl is required' });
  }

  // 1) Generate unique challenge ID
  const id = 'chal_' + crypto.randomBytes(8).toString('hex');
  const now = Date.now();
  const expiresAt = now + 5 * 60 * 1000; // 5 minutes from now

  // 2) Store challenge in SQLite
  db.run(
    `INSERT INTO challenges (id, website_url, status, created_at, expires_at)
     VALUES (?, ?, ?, ?, ?)`,
    [id, websiteUrl, 'pending', now, expiresAt],
    (err) => {
      if (err) {
        console.error('Error inserting challenge:', err);
        return res.status(500).json({ error: 'Database error' });
      }

// 3) Return challenge to caller (website/plugin)
      res.json({
        challengeId: id,
        websiteUrl,
        expiresAt
        // Later: add qrData or URL here
      });
    }
  );
});


const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

