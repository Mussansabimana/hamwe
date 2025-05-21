const express = require('express');
const app = express();
const PORT = 3000;
const path = require('path');

// Serve static files from the "public" directory
app.use(express.static('public'));

// Fallback to index.html for any route (like for SPA routing)
app.use(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
