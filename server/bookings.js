require('dotenv').config();
const express = require('express');
const router = express.Router();
const pool = require('./db');
const { authenticateUser } = require('./utils');

// Get all bookings for the authenticated user
router.get('/', authenticateUser, async (req, res) => {
    try {
        const userId = req.userId;
        
        // Query to get all bookings with field and address information
        const query = `
            SELECT 
                b.id,
                b.booked_datetime,
                b.duration,
                f.id AS field_id,
                f.name AS field_name,
                f.sport,
                a.city,
                a.street,
                a.street_number,
                a.zip_code,
                CONCAT(a.street, ' ', a.street_number, ', ', a.zip_code, ' ', a.city) AS full_address
            FROM bookings b
            INNER JOIN fields f ON b.field_id = f.id
            INNER JOIN addresses a ON f.address_id = a.id
            WHERE b.booked_by = ? AND b.booked_datetime >= NOW()
            ORDER BY b.booked_datetime ASC
        `;
        
        const [rows] = await pool.query(query, [userId]);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;

