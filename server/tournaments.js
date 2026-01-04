require('dotenv').config();
const express = require('express');
const router = express.Router();
const pool = require('./db');
const { authenticateUser } = require('./utils');

// Get all tournaments created by the authenticated user
router.get('/mine', authenticateUser, async (req, res) => {
    try {
        const created_by = req.userId;
        
        const [rows] = await pool.query(
            'SELECT id, name, sport, max_teams, start_date, description FROM tournaments WHERE created_by = ? ORDER BY start_date DESC',
            [created_by]
        );
        
        res.json(rows);
    } catch (error) {
        console.error('Error fetching tournaments:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create tournament
router.post('/', authenticateUser, async (req, res) => {
    try {
        const created_by = req.userId;
        const { name, sport, maxTeams, startDate, description } = req.body;
        
        // Validate required fields
        if (!name || !sport || !maxTeams || !startDate) {
            return res.status(400).json({ error: 'Missing required fields: name, sport, maxTeams, startDate' });
        }
        
        // Validate maxTeams is a positive integer
        const maxTeamsNum = parseInt(maxTeams);
        if (isNaN(maxTeamsNum) || maxTeamsNum < 2) {
            return res.status(400).json({ error: 'maxTeams must be a number >= 2' });
        }
        
        // Insert tournament
        const [result] = await pool.query(
            'INSERT INTO tournaments (created_by, name, sport, max_teams, start_date, description) VALUES (?, ?, ?, ?, ?, ?)',
            [created_by, name, sport, maxTeamsNum, startDate, description || null]
        );
        
        res.status(201).json({ 
            message: 'Tournament created successfully',
            tournamentId: result.insertId
        });
    } catch (error) {
        console.error('Error creating tournament:', error);
        
        // Handle foreign key constraint errors
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).json({ error: 'Invalid user' });
        }
        
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update tournament
router.put('/:id', authenticateUser, async (req, res) => {
    try {
        const userId = req.userId;
        const tournamentId = parseInt(req.params.id);
        const { name, sport, maxTeams, startDate, description } = req.body;
        
        // Validate required fields
        if (!name || !sport || !maxTeams || !startDate) {
            return res.status(400).json({ error: 'Missing required fields: name, sport, maxTeams, startDate' });
        }
        
        // Validate maxTeams is a positive integer
        const maxTeamsNum = parseInt(maxTeams);
        if (isNaN(maxTeamsNum) || maxTeamsNum < 2) {
            return res.status(400).json({ error: 'maxTeams must be a number >= 2' });
        }
        
        // Check if tournament exists and belongs to user
        const [tournamentRows] = await pool.query(
            'SELECT id FROM tournaments WHERE id = ? AND created_by = ?',
            [tournamentId, userId]
        );
        
        if (tournamentRows.length === 0) {
            return res.status(404).json({ error: 'Tournament not found or you do not have permission to edit it' });
        }
        
        // Update tournament
        await pool.query(
            'UPDATE tournaments SET name = ?, sport = ?, max_teams = ?, start_date = ?, description = ? WHERE id = ? AND created_by = ?',
            [name, sport, maxTeamsNum, startDate, description || null, tournamentId, userId]
        );
        
        res.json({ 
            message: 'Tournament updated successfully',
            tournamentId: tournamentId
        });
    } catch (error) {
        console.error('Error updating tournament:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;

