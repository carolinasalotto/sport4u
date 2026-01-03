const express = require('express');
const router = express.Router();
const pool = require('./db');

//get all fields
router.get('/', async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM fields');
    res.json(rows);
});

//get info based on id
router.get('/:id', async (req, res) => {
    const [rows] = await pool.query(
        'SELECT fields.*, addresses.city, addresses.street, addresses.street_number FROM fields JOIN addresses ON fields.address_id = addresses.id WHERE fields.id = ?',
        [req.params.id]
    );
    res.json(rows[0]);
});

//get available slots based on date (gg-mm-yyyy) and field

router.get('/:id/:date', async (req, res) =>{
    try {
        const [field_rows] = await pool.query(
            'SELECT open_from, open_till FROM fields WHERE fields.id = ?',
            [req.params.id]
        );
        
        if (field_rows.length === 0) {
            return res.status(404).json({ error: 'Field not found' });
        }
        
        const field_row = field_rows[0];
        let day_slots = [];
        const start_hour = Number(field_row.open_from.split(":")[0]);
        const end_hour = Number(field_row.open_till.split(":")[0]);
        
        // Parse date from dd-mm-yyyy to yyyy-mm-dd for MySQL
        const [day, month, year] = req.params.date.split('-');
        const mysqlDate = `${year}-${month}-${day}`;
        
        const [day_bookings] = await pool.query(
            'SELECT booked_datetime, duration FROM bookings WHERE field_id = ? AND DATE(booked_datetime) = ?', 
            [req.params.id, mysqlDate]
        ) 

        // Get current date and time
        const now = new Date();
        const currentDate = now.toISOString().split('T')[0]; // yyyy-mm-dd format
        const currentHour = now.getHours();
        
        for(let i = start_hour; i < end_hour; i++){
            // Skip slots before current time if the date is today
            if(mysqlDate === currentDate && i <= currentHour){
                continue;
            }
            
            // Skip if date is in the past
            if(mysqlDate < currentDate){
                continue;
            }
            
            let should_add = true;
            day_bookings.forEach(booking => {
                const start = new Date(booking.booked_datetime).getHours();
                
                if(start <= i && i < start + (booking.duration/60)){
                    should_add = false;
                }
            });
            
            
            if(should_add){
                day_slots.push(i);
            }
        }
        
        res.json(day_slots);
    } catch (error) {
        console.error('Error fetching slots:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
})




module.exports = router;



