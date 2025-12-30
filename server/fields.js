const express = require('express');
const router = express.Router();
const pool = require('./db');


router.get('/', async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM fields');
    res.json(rows);
});

router.get('/:id', async (req, res) => {
    const [rows] = await pool.query(
        'SELECT fields.*, addresses.city, addresses.street, addresses.street_number FROM fields JOIN addresses ON fields.address_id = addresses.id WHERE fields.id = ?',
        [req.params.id]
    );
    res.json(rows[0]);
});
module.exports = router;