require('dotenv').config();
const jwt = require("jsonwebtoken");

// Middleware function to check if user is authenticated
// Attaches userId to req.userId if authentication is successful
function authenticateUser(req, res, next) {
    try {
        const token = req.cookies.token;
        
        if (!token) {
            return res.status(401).json({ error: "Not authenticated" });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.userId = decoded.id;
            next();
        } catch (error) {
            if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
                return res.status(401).json({ error: "Invalid or expired token" });
            }
            throw error;
        }
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({ error: "Internal server error" });
    }
}

module.exports = { authenticateUser };

