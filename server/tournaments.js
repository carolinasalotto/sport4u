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

// Get single tournament by ID
router.get('/:id', async (req, res) => {
    try {
        const tournamentId = parseInt(req.params.id);
        
        if (isNaN(tournamentId)) {
            return res.status(400).json({ error: 'Invalid tournament ID' });
        }
        
        // Get tournament info
        const [rows] = await pool.query(
            'SELECT t.*, u.username as created_by_username, u.name as created_by_name, u.surname as created_by_surname FROM tournaments t JOIN users u ON t.created_by = u.id WHERE t.id = ?',
            [tournamentId]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Tournament not found' });
        }
        
        const tournament = rows[0];
        
        // Get teams for this tournament
        const [teamsRows] = await pool.query(
            'SELECT t.id, t.name FROM teams t JOIN tournamentteams tt ON t.id = tt.team_id WHERE tt.tournament_id = ? ORDER BY t.name',
            [tournamentId]
        );
        
        // Get players for each team
        const teams = await Promise.all(teamsRows.map(async (team) => {
            const [playersRows] = await pool.query(
                'SELECT id, name, surname, jersey_number FROM teamplayers WHERE team_id = ? ORDER BY jersey_number',
                [team.id]
            );
            
            return {
                id: team.id,
                name: team.name,
                players: playersRows.map(player => ({
                    id: player.id,
                    name: player.name,
                    surname: player.surname,
                    jerseyNumber: player.jersey_number
                }))
            };
        }));
        
        tournament.teams = teams;
        
        res.json(tournament);
    } catch (error) {
        console.error('Error fetching tournament:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add team to tournament
router.put('/:id/team', authenticateUser, async (req, res) => {
    try {
        const userId = req.userId;
        const tournamentId = parseInt(req.params.id);
        const { teamName, players } = req.body;
        
        // Validate required fields
        if (!teamName || !players || !Array.isArray(players) || players.length === 0) {
            return res.status(400).json({ error: 'Missing required fields: teamName and players array' });
        }
        
        // Validate tournament exists and user is the creator
        const [tournamentRows] = await pool.query(
            'SELECT id, max_teams, created_by FROM tournaments WHERE id = ?',
            [tournamentId]
        );
        
        if (tournamentRows.length === 0) {
            return res.status(404).json({ error: 'Tournament not found' });
        }
        
        const tournament = tournamentRows[0];
        
        if (tournament.created_by !== userId) {
            return res.status(403).json({ error: 'Only the tournament creator can add teams' });
        }
        
        // Check current number of teams in tournament
        const [teamCountRows] = await pool.query(
            'SELECT COUNT(*) as count FROM tournamentteams WHERE tournament_id = ?',
            [tournamentId]
        );
        
        const currentTeamCount = teamCountRows[0].count;
        
        if (currentTeamCount >= tournament.max_teams) {
            return res.status(400).json({ error: `Tournament has reached maximum number of teams (${tournament.max_teams})` });
        }
        
        
        try {
            // Insert team
            const [teamResult] = await pool.query(
                'INSERT INTO teams (name) VALUES (?)',
                [teamName]
            );
            const teamId = teamResult.insertId;
            
            // Insert players
            for (const player of players) {
                await pool.query(
                    'INSERT INTO teamplayers (team_id, name, surname, jersey_number) VALUES (?, ?, ?, ?)',
                    [teamId, player.name, player.surname, player.jerseyNumber]
                );
            }
            
            // Link team to tournament
            await pool.query(
                'INSERT INTO tournamentteams (tournament_id, team_id) VALUES (?, ?)',
                [tournamentId, teamId]
            );
            
            
            res.json({
                msg: 'Team added to tournament successfully'
            });
        } catch (error) {
            throw error;
        }
    } catch (error) {
        console.error('Error adding team to tournament:', error);
        
        
        // Handle duplicate jersey number error
        if (error.code === 'ER_DUP_ENTRY' && error.message.includes('team_id_2')) {
            return res.status(400).json({ error: 'Jersey number already exists for this team' });
        }
        
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

// Delete team from tournament
router.delete('/:id/team/:teamId', authenticateUser, async (req, res) => {
    try {
        const userId = req.userId;
        const tournamentId = parseInt(req.params.id);
        const teamId = parseInt(req.params.teamId);
        
        if (isNaN(tournamentId) || isNaN(teamId)) {
            return res.status(400).json({ error: 'Invalid tournament ID or team ID' });
        }
        
        // Validate tournament exists and user is the creator
        const [tournamentRows] = await pool.query(
            'SELECT id, created_by FROM tournaments WHERE id = ?',
            [tournamentId]
        );
        
        if (tournamentRows.length === 0) {
            return res.status(404).json({ error: 'Tournament not found' });
        }
        
        const tournament = tournamentRows[0];
        
        if (tournament.created_by !== userId) {
            return res.status(403).json({ error: 'Only the tournament creator can delete teams' });
        }
        
        // Check if team is in this tournament
        const [teamTournamentRows] = await pool.query(
            'SELECT * FROM tournamentteams WHERE tournament_id = ? AND team_id = ?',
            [tournamentId, teamId]
        );
        
        if (teamTournamentRows.length === 0) {
            return res.status(404).json({ error: 'Team not found in this tournament' });
        }
        
        // Remove team from tournament
        await pool.query(
            'DELETE FROM tournamentteams WHERE tournament_id = ? AND team_id = ?',
            [tournamentId, teamId]
        );
        
        res.json({
            message: 'Team removed from tournament successfully'
        });
    } catch (error) {
        console.error('Error deleting team from tournament:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete tournament
router.delete('/:id', authenticateUser, async (req, res) => {
    try {
        const userId = req.userId;
        const tournamentId = parseInt(req.params.id);
        
        // Check if tournament exists and belongs to user
        const [tournamentRows] = await pool.query(
            'SELECT id FROM tournaments WHERE id = ? AND created_by = ?',
            [tournamentId, userId]
        );
        
        if (tournamentRows.length === 0) {
            return res.status(404).json({ error: 'Tournament not found or you do not have permission to delete it' });
        }
        
        // Delete tournament
        await pool.query(
            'DELETE FROM tournaments WHERE id = ? AND created_by = ?',
            [tournamentId, userId]
        );
        
        res.json({ 
            message: 'Tournament deleted successfully',
            tournamentId: tournamentId
        });
    } catch (error) {
        console.error('Error deleting tournament:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Generate match schedule (single round robin)
router.post('/:id/matches/generate', authenticateUser, async (req, res) => {
    try {
        const userId = req.userId;
        const tournamentId = parseInt(req.params.id);
        
        if (isNaN(tournamentId)) {
            return res.status(400).json({ error: 'Invalid tournament ID' });
        }
        
        
        // Check if tournament exists and user is the creator
        const [tournamentRows] = await pool.query(
            'SELECT id, created_by, start_date FROM tournaments WHERE id = ?',
            [tournamentId]
        );
        
        if (tournamentRows.length === 0) {
            return res.status(404).json({ error: 'Tournament not found' });
        }
        
        if (tournamentRows[0].created_by !== userId) {
            return res.status(403).json({ error: 'Only the tournament creator can generate matches' });
        }
        
        const tournament = tournamentRows[0];
        const startDate = new Date(tournament.start_date);
        
        // Get all teams in the tournament
        const [teamsRows] = await pool.query(
            'SELECT team_id FROM tournamentteams WHERE tournament_id = ?',
            [tournamentId]
        );
        
        const teamIds = teamsRows.map(row => row.team_id);
        
        if (teamIds.length < 2) {
            return res.status(400).json({ error: 'At least 2 teams are required to generate matches' });
        }
        
        // Delete all existing matches for this tournament
        await pool.query(
            'DELETE FROM matches WHERE tournament_id = ?',
            [tournamentId]
        );
        
        // Generate single round robin matches
        const matches = [];
        for (let i = 0; i < teamIds.length; i++) {
            for (let j = i + 1; j < teamIds.length; j++) {
                matches.push({
                    tournament_id: tournamentId,
                    team1: teamIds[i],
                    team2: teamIds[j]
                });
            }
        }
        
        // Insert matches into database with progressive datetime
        for (let i = 0; i < matches.length; i++) {
            const matchDateTime = new Date(startDate);
            matchDateTime.setHours(matchDateTime.getHours() + i);
            
            await pool.query(
                'INSERT INTO matches (tournament_id, team1, team2, score_team1, score_team2, datetime) VALUES (?, ?, ?, NULL, NULL, ?)',
                [matches[i].tournament_id, matches[i].team1, matches[i].team2, matchDateTime]
            );
        }
        
        res.json({
            message: 'Match schedule generated successfully',
            matchesGenerated: matches.length
        });
    } catch (error) {
        console.error('Error generating match schedule:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// List matches for a tournament
router.get('/:id/matches', async (req, res) => {
    try {
        const tournamentId = parseInt(req.params.id);
        
        if (isNaN(tournamentId)) {
            return res.status(400).json({ error: 'Invalid tournament ID' });
        }
        
        // Get all matches with team names
        const [matchesRows] = await pool.query(
            `SELECT 
                m.id,
                m.tournament_id,
                m.team1,
                m.team2,
                m.score_team1,
                m.score_team2,
                m.datetime,
                t1.name as team1_name,
                t2.name as team2_name
            FROM matches m
            JOIN teams t1 ON m.team1 = t1.id
            JOIN teams t2 ON m.team2 = t2.id
            WHERE m.tournament_id = ?
            ORDER BY m.datetime`,
            [tournamentId]
        );
        
        const matches = matchesRows.map(match => ({
            id: match.id,
            tournament_id: match.tournament_id,
            team1: {
                id: match.team1,
                name: match.team1_name
            },
            team2: {
                id: match.team2,
                name: match.team2_name
            },
            score_team1: match.score_team1,
            score_team2: match.score_team2,
            datetime: match.datetime
        }));
        
        res.json(matches);
    } catch (error) {
        console.error('Error fetching matches:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get standings for a tournament
router.get('/:id/standings', async (req, res) => {
    try {
        const tournamentId = parseInt(req.params.id);
        
        if (isNaN(tournamentId)) {
            return res.status(400).json({ error: 'Invalid tournament ID' });
        }
        
        // Get tournament sport to determine point system
        const [tournamentRows] = await pool.query(
            'SELECT sport FROM tournaments WHERE id = ?',
            [tournamentId]
        );
        
        if (tournamentRows.length === 0) {
            return res.status(404).json({ error: 'Tournament not found' });
        }
        
        const sport = tournamentRows[0].sport.toLowerCase();
        const isFootball = sport === 'football';
        
        // Get all teams in the tournament
        const [teamsRows] = await pool.query(
            `SELECT t.id, t.name 
             FROM teams t 
             JOIN tournamentteams tt ON t.id = tt.team_id 
             WHERE tt.tournament_id = ? 
             ORDER BY t.name`,
            [tournamentId]
        );
        
        // Get all completed matches (where both scores are not null)
        const [matchesRows] = await pool.query(
            `SELECT team1, team2, score_team1, score_team2 
             FROM matches 
             WHERE tournament_id = ? 
             AND score_team1 IS NOT NULL 
             AND score_team2 IS NOT NULL`,
            [tournamentId]
        );
        
        // Initialize standings for all teams
        const standings = {};
        teamsRows.forEach(team => {
            standings[team.id] = {
                teamId: team.id,
                teamName: team.name,
                points: 0,
                matchesPlayed: 0,
                scored: 0,
                conceded: 0,
                difference: 0
            };
        });

        // example structure:
        // standings = {
        //     1: { teamId: 1, teamName: "Team A", points: 0, matchesPlayed: 0, ... },
        //     2: { teamId: 2, teamName: "Team B", points: 0, matchesPlayed: 0, ... },
        //     3: { teamId: 3, teamName: "Team C", points: 0, matchesPlayed: 0, ... }
        //   }
        
        // Calculate standings from match results
        matchesRows.forEach(match => {
            const team1Id = match.team1;
            const team2Id = match.team2;
            const score1 = match.score_team1;
            const score2 = match.score_team2;
            
            // Update scored and conceded
            standings[team1Id].scored += score1;
            standings[team1Id].conceded += score2;
            standings[team2Id].scored += score2;
            standings[team2Id].conceded += score1;
            
            // Update matches played
            standings[team1Id].matchesPlayed++;
            standings[team2Id].matchesPlayed++;
            
            // Calculate points based on result
            if (score1 > score2) {
                // Team 1 wins
                standings[team1Id].points += isFootball ? 3 : 2;
                standings[team2Id].points += 0;
            } else if (score2 > score1) {
                // Team 2 wins
                standings[team1Id].points += 0;
                standings[team2Id].points += isFootball ? 3 : 2;
            } else {
                // Draw (only for football)
                standings[team1Id].points += isFootball ? 1 : 0;
                standings[team2Id].points += isFootball ? 1 : 0;
            }
        });
        
        // Calculate goal/point difference
        Object.values(standings).forEach(standing => {
            standing.difference = standing.scored - standing.conceded;
        });
        
        // Convert to array and sort by points (desc), then difference (desc), then scored (desc)
        const standingsArray = Object.values(standings).sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.difference !== a.difference) return b.difference - a.difference;
            return b.scored - a.scored;
        });
        
        res.json(standingsArray);
    } catch (error) {
        console.error('Error fetching standings:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;

