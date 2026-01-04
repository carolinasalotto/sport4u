require('dotenv').config();
const express = require('express');
const router = express.Router();
const pool = require('./db');
const { authenticateUser } = require('./utils');
const e = require('express');

//get all fields
router.get('/', async (req, res) => {
    
    // Validate date query parameter
    const { q } = req.query;

    if(!q || q == ""){

        const [rows] = await pool.query(`
            SELECT 
                f.*,
                a.city,
                a.street,
                a.street_number,
                a.zip_code,
                CONCAT(a.street, ' ', a.street_number, ', ', a.zip_code, ' ', a.city) AS full_address
            FROM fields f
            INNER JOIN addresses a ON f.address_id = a.id
        `);
        res.json(rows);
    }
    else{

        const [rows] = await pool.query(`
            SELECT 
                f.*,
                a.city,
                a.street,
                a.street_number,
                a.zip_code,
                CONCAT(a.street, ' ', a.street_number, ', ', a.zip_code, ' ', a.city) AS full_address
            FROM fields f
            INNER JOIN addresses a ON f.address_id = a.id
            WHERE f.name LIKE ?
        `, [`%${q}%`]);
        res.json(rows);
    }
});

//get info based on id
router.get('/:id', async (req, res) => {
    const [rows] = await pool.query(
        'SELECT fields.*, addresses.city, addresses.street, addresses.street_number FROM fields JOIN addresses ON fields.address_id = addresses.id WHERE fields.id = ?',
        [req.params.id]
    );
    res.json(rows[0]);
});

//get available slots based on date (YYYY-MM-DD) and field

router.get('/:id/slots', async (req, res) =>{
    try {
        // Validate date query parameter
        const { date } = req.query;
        if (!date) {
            return res.status(400).json({ error: 'Missing required query parameter: date' });
        }
        
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
        
        // Date is already in YYYY-MM-DD format (MySQL compatible)
        const mysqlDate = date;
        
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


//get all fields based on city, sport, date and hour
router.post('/search-fields', async (req, res) => {
    try {
        const { city, sport, date, hour } = req.body;
        
        // Validate required parameters
        if (!city || !sport || !date || !hour) {
            return res.status(400).json({ error: 'Missing required parameters: city, sport, date, hour' });
        }
        
        // Parse date from yyyy-mm-dd (HTML date input format) to MySQL format
        // Also parse hour to integer
        const requestedHour = parseInt(hour);
        if (isNaN(requestedHour) || requestedHour < 0 || requestedHour > 23) {
            return res.status(400).json({ error: 'Invalid hour' });
        }
        
        // Create datetime string for the requested booking start time
        const requestedDatetime = `${date} ${String(requestedHour).padStart(2, '0')}:00:00`;
        const requestedEndDatetime = `${date} ${String(requestedHour + 1).padStart(2, '0')}:00:00`;
        
        // Query to find available fields
        // Fields must:
        // 1. Match the city and sport
        // 2. Be open at the requested hour (open_from <= hour < open_till)
        // 3. Not have any overlapping bookings
        const query = `
            SELECT 
                f.id,
                f.name,
                f.sport,
                f.open_from,
                f.open_till,
                a.id AS address_id,
                a.city,
                a.street,
                a.street_number,
                a.zip_code,
                CONCAT(a.street, ' ', a.street_number, ', ', a.zip_code, ' ', a.city) AS full_address
            FROM fields f
            INNER JOIN addresses a ON f.address_id = a.id
            WHERE 
                LOWER(a.city) = LOWER(?)
                AND f.sport = ?
                AND TIME(STR_TO_DATE(?, '%Y-%m-%d %H:%i:%s')) >= f.open_from
                AND TIME(STR_TO_DATE(?, '%Y-%m-%d %H:%i:%s')) <= f.open_till
                AND NOT EXISTS (
                    SELECT 1 
                    FROM bookings b
                    WHERE b.field_id = f.id
                    -- Check if time intervals overlap
                    -- Two intervals overlap if: start1 < end2 AND start2 < end1
                    AND b.booked_datetime < STR_TO_DATE(?, '%Y-%m-%d %H:%i:%s')
                    AND DATE_ADD(b.booked_datetime, INTERVAL b.duration MINUTE) > STR_TO_DATE(?, '%Y-%m-%d %H:%i:%s')
                )
            ORDER BY f.name
        `;
        
        const [rows] = await pool.query(query, [
            city,
            sport,
            requestedDatetime, // for open_from check
            requestedEndDatetime, // for open_till check
            requestedEndDatetime, // for booking overlap check (booking end > requested start)
            requestedDatetime // for booking overlap check (booking start < requested end)
        ]);
        
        res.json(rows);
    } catch (error) {
        console.error('Error searching fields:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// create booking
router.post('/:id/bookings', authenticateUser, async (req, res) => {
    try {
        const user_id = req.userId;
        const field_id = req.params.id;
        const { date, start_hour, end_hour } = req.body;
        
        // Validate required parameters
        if (!date || date === 'undefined' || !start_hour || start_hour === undefined || !end_hour || end_hour === undefined) {
            return res.status(400).json({ error: 'Missing required parameters: date, start_hour, end_hour' });
        }
        
        
        // Validate hours are numbers
        const startHourNum = parseInt(start_hour);
        const endHourNum = parseInt(end_hour);
        if (isNaN(startHourNum) || isNaN(endHourNum)) {
            return res.status(400).json({ error: 'Invalid hour values. Must be numbers' });
        }
        
        if (startHourNum < 0 || startHourNum > 23 || endHourNum < 0 || endHourNum > 23) {
            return res.status(400).json({ error: 'Invalid hour values. Must be between 0 and 23' });
        }
        
        if (endHourNum <= startHourNum) {
            return res.status(400).json({ error: 'End hour must be greater than start hour' });
        }
        
        // Create datetime string for the requested booking start time
        const booked_datetime = `${date} ${String(startHourNum).padStart(2, '0')}:00:00`;
        const duration = (endHourNum - startHourNum) * 60;

        await pool.query('INSERT INTO bookings(booked_by, field_id, booked_datetime, duration) VALUES(?, ?, ?, ?)',
            [user_id, field_id, booked_datetime, duration]);

        res.status(201).json({ message: "Booking created successfully" });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
})

//delete booking
router.delete('/:id/bookings/:bookingId', authenticateUser, async(req, res) => {
    try {
        const bookingId = req.params.bookingId;
        const userId = req.userId;
        const [rows] = await pool.query('SELECT booked_by FROM bookings WHERE id=?', [bookingId]);

        if(rows.length <= 0){
            return res.status(404).json({error: "Booking not found"});
        }
        if(userId != rows[0].booked_by){
            return res.status(401).json({error: "Booking not created by this user"});
        }

        await pool.query('DELETE FROM bookings WHERE id=?', [bookingId]);

        res.json({msg: "Delete successful"});
    } catch (error) {
        console.error('Error deleting booking:', error);
        res.status(500).json({ error: "Internal server error" });
    }
})

module.exports = router;



