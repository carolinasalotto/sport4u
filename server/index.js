require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();
const port = process.env.PORT;

// Middleware to parse JSON request bodies
app.use(express.json());
// Middleware to parse cookies
app.use(cookieParser());

app.use('/api/fields', require('./fields'));

app.use('/api/auth', require('./auth'));

app.use('/api/whoami', require('./whoami'));

app.use('/api/bookings', require('./bookings'));

app.use('/api/tournaments', require('./tournaments'));
app.use('/api/matches', require('./matches'));
app.use('/api/users', require('./users'));


// Route handler for field detail page
app.get('/field/:id', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/field.html'));
});

// Route handler for tournament detail page
app.get('/tournament/:id', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/tournament.html'));
});

// Route handler for user detail page
app.get('/user/:id', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/user.html'));
});


// Serve static files (frontend) 
app.use(express.static(path.join(__dirname, '../client')));

app.use('/uploads/fields', express.static(path.join(__dirname, 'uploads/fields')))



app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});