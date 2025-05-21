const express = require('express');
const app = express();
const PORT = 3000;
const path = require('path');

// Serve static files from the "public" directory
app.use(express.static('public'));

app.use("*", (req, res) => { res.sendFile(path.resolve(__dirname, "public", 'index.html'))});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
