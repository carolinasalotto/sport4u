const express = require('express');
const router = express.Router();
const pool = require('./db');
const { authenticateUser } = require('./utils');

// Get current user profile (requires authentication)
router.get("/", authenticateUser, async (req, res) => {
    try {
        const userId = req.userId;

        const [rows] = await pool.query('SELECT id, username, name, surname, email FROM users WHERE id = ?', [userId]);
        const user = rows[0];

        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Internal Error" });
    }
});

module.exports = router;
