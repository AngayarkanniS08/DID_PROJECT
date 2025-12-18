// index.js
const express = require('express');        // Import Express framework
const cors = require('cors');              // Import CORS middleware
const crypto = require('crypto');          // Import crypto for random bytes
const db = require('./db');                // Import SQLite connection from db.js
const app = express();                     // Create Express app instance

app.use(cors());                           // Allow cross-origin requests (frontend on other origin)
app.use(express.json({ limit: '1mb' }));   // Parse JSON bodies, max 1MB size

// Health check / root route
app.get('/', (req, res) => {
  res.send('DID backend is running');      // Simple text response to confirm server is up
});

// POST /api/challenge
// PURPOSE: Website calls this to create a login challenge
app.post('/api/challenge', (req, res) => {
  const { websiteUrl } = req.body;         // Extract websiteUrl from JSON body

  // Validate input exists and is string
  if (!websiteUrl || typeof websiteUrl !== 'string') {
    return res.status(400).json({         // 400 = bad request
      error: 'websiteUrl is required as string'
    });
  }

  // Basic URL format check: must start with http:// or https:// and no spaces
  const urlPattern = /^https?:\/\/[^\s]+$/;
  if (!urlPattern.test(websiteUrl)) {
    return res.status(400).json({         // Reject obviously invalid URLs
      error: 'Invalid websiteUrl format'
    });
  }

  // Generate unique challenge ID (e.g. chal_ab12cd34ef56gh78)
  const id = 'chal_' + crypto.randomBytes(8).toString('hex'); // 8 bytes → 16 hex chars
  const now = Date.now();                                    // Current timestamp (ms)
  const expiresAt = now + 5 * 60 * 1000;                     // Expires in 5 minutes

  // Store challenge in SQLite
  db.run(
    `INSERT INTO challenges (id, website_url, status, created_at, expires_at)
     VALUES (?, ?, ?, ?, ?)`,           // SQL query with placeholders
    [id, websiteUrl, 'pending', now, expiresAt], // Values for placeholders
    (err) => {                                      // Callback runs after insert
      if (err) {
        console.error('Error inserting challenge:', err); // Log DB error
        return res.status(500).json({                    // 500 = server error
          error: 'Database error'
        });
      }

      // Return challenge info to caller (website/plugin)
      return res.json({
        challengeId: id,    // ID used later for status/verify
        challenge: id,      // Placeholder challenge string for now
        websiteUrl,         // Echo back website URL
        expiresAt           // When this challenge expires
      });
    }
  );
});

// GET /api/status/:challengeId
// PURPOSE: Website polls this to see if the challenge is authenticated yet
app.get('/api/status/:challengeId', (req, res) => {
  const challengeId = req.params.challengeId; // Read challengeId from URL param

  // Validate challengeId format (must look like our generated IDs)
  if (!/^chal_[0-9a-fA-F]{16}$/.test(challengeId)) {
    return res.status(400).json({            // 400 for clearly invalid IDs
      error: 'Invalid challengeId format'
    });
  }

  // Fetch challenge row from SQLite
  db.get(
    'SELECT id, status, expires_at FROM challenges WHERE id = ?', // SQL query
    [challengeId],                                                // Parameter array
    (err, row) => {                                               // Callback with result
      if (err) {
        console.error('Error fetching challenge:', err);          // Log error
        return res.status(500).json({                             // DB error
          error: 'Database error'
        });
      }

      if (!row) {                                                 // No row found
        return res.status(404).json({                             // 404 = not found
          error: 'challenge not found'
        });
      }

      const now = Date.now();                                     // Current time

      // Check if challenge expired
      if (row.expires_at < now) {
        return res.json({
          authenticated: false,                                   // Not authenticated
          expired: true                                           // But expired
        });
      }

      // Check authentication status
      if (row.status === 'authenticated') {
        return res.json({
          authenticated: true,                                    // Login completed
          expired: false
        });
      } else {
        return res.json({
          authenticated: false,                                   // Still pending
          expired: false
        });
      }
    }
  );
});

// Start HTTP server on port 3000
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);      // Log startup
});
