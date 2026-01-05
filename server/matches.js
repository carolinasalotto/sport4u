require('dotenv').config();
const express = require('express');
const router = express.Router();
const pool = require('./db');
const { authenticateUser } = require('./utils');

// Update match result
router.put('/:id/result', authenticateUser, async (req, res) => {
    try {
        const userId = req.userId;
        const matchId = parseInt(req.params.id);
        const { score_team1, score_team2 } = req.body;
        
        if (isNaN(matchId)) {
            return res.status(400).json({ error: 'Invalid match ID' });
        }
        
        // Validate scores
        if (score_team1 === undefined || score_team2 === undefined) {
            return res.status(400).json({ error: 'Both scores are required' });
        }
        
        const score1 = score_team1 === null || score_team1 === '' ? null : parseInt(score_team1);
        const score2 = score_team2 === null || score_team2 === '' ? null : parseInt(score_team2);
        
        if (score1 !== null && (isNaN(score1) || score1 < 0)) {
            return res.status(400).json({ error: 'Score for team 1 must be a non-negative integer' });
        }
        
        if (score2 !== null && (isNaN(score2) || score2 < 0)) {
            return res.status(400).json({ error: 'Score for team 2 must be a non-negative integer' });
        }
        
        // Get match and check if user is the tournament creator
        const [matchRows] = await pool.query(
            `SELECT m.id, m.tournament_id, t.created_by 
             FROM matches m 
             JOIN tournaments t ON m.tournament_id = t.id 
             WHERE m.id = ?`,
            [matchId]
        );
        
        if (matchRows.length === 0) {
            return res.status(404).json({ error: 'Match not found' });
        }
        
        const match = matchRows[0];
        
        if (match.created_by !== userId) {
            return res.status(403).json({ error: 'Only the tournament creator can update match results' });
        }
        
        // Update match scores
        await pool.query(
            'UPDATE matches SET score_team1 = ?, score_team2 = ? WHERE id = ?',
            [score1, score2, matchId]
        );
        
        res.json({
            message: 'Match result updated successfully'
        });
    } catch (error) {
        console.error('Error updating match result:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;

