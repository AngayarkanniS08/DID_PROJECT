// index.js
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json()); // parse JSON bodies

app.get('/', (req, res) => {
  res.send('DID backend is running');
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
