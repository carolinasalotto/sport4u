require('dotenv').config();
const express = require('express');
const router = express.Router();
const pool = require('./db');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// Helper function to create JWT token and set cookie
function setAuthToken(userId, res) {
  const data = { id: userId };
  const token = jwt.sign(data, process.env.JWT_SECRET, {
    expiresIn: 86400, // 24 hours
  });
  res.cookie("token", token, {httpOnly: true});
}

router.post("/signin", async (req, res) => {
    
    try {
      const { email_username, password } = req.body;
      const [rows] = await pool.query('SELECT * FROM users WHERE username = ? OR email = ?', [email_username, email_username]);
      const user = rows[0];
      
      if (!user) {
        return res.status(401).json({ msg: "Wrong credentials" });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      
      if (isPasswordValid) {
        setAuthToken(user.id, res);
        res.json({ msg: "Authentication successful" });
      } else {
        res.status(401).json({ msg: "Wrong credentials" });
      }
    } catch (error) {
        res.status(500).json({ msg: "Internal Error" });
    }
  });
  

router.post("/signup", async (req, res) =>{
    try {
        const {username, name, surname, email, password} = req.body;
        const password_hash = await bcrypt.hash(password, 10);
        const [result] = await pool.query("INSERT INTO users(username, name, surname, email, password_hash) VALUES(?,?,?,?,?)", 
            [username, name, surname, email, password_hash]
        );

        // Automatically log in the user after signup
        setAuthToken(result.insertId, res);
        res.json({msg: "User created"});

    }

    catch (error) {
        console.error(error);
        
        res.status(500).json({ msg: "Internal Error" });
    }
})

// Logout endpoint - clears the authentication cookie
router.post("/logout", (req, res) => {
    try {
        // Clear the token cookie by setting it to expire immediately
        res.cookie("token", "", {
            httpOnly: true,
            expires: new Date(0) // Set expiration to epoch time (past date)
        });
        res.json({ msg: "Logged out successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Internal Error" });
    }
});

  module.exports = router;
  