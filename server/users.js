require('dotenv').config();
const express = require('express');
const router = express.Router();
const pool = require('./db');

// Get all users with optional search query (q for username, name, surname, or email)
router.get('/', async (req, res) => {
    try {
        const { q } = req.query;
        
        let query = 'SELECT id, username, name, surname, email FROM users WHERE 1=1';
        const params = [];
        
        // Filter by query (q) - partial case-insensitive match on username, name, surname, or email
        if (q && q.trim() !== '') {
            query += ' AND (LOWER(username) LIKE ? OR LOWER(name) LIKE ? OR LOWER(surname) LIKE ? OR LOWER(email) LIKE ?)';
            const searchTerm = `%${q.toLowerCase()}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }
        
        query += ' ORDER BY username ASC';
        
        const [rows] = await pool.query(query, params);
        
        res.json(rows);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get single user by ID
router.get('/:id', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        
        if (isNaN(userId)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }
        
        const [rows] = await pool.query(
            'SELECT id, username, name, surname, email FROM users WHERE id = ?',
            [userId]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json(rows[0]);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;

