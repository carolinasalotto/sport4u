require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT;

app.use('/api/fields', require('./fields'));

// Route handler for field detail page
app.get('/field/:id', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/field.html'));
});

// Serve static files (frontend) - comes after API routes
app.use(express.static(path.join(__dirname, '../client')));

app.use('/uploads/fields', express.static(path.join(__dirname, 'uploads/fields')))






app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});