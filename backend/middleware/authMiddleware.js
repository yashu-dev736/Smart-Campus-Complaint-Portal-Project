const jwt = require("jsonwebtoken");
const User = require("../models/User");

const verifyToken = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
      
      // Attach decoded payload directly to req.user to avoid database lookup mismatches
      req.user = decoded;
      return next();

    } catch (err) {
      console.error('Auth Middleware Verification Error:', err.message);
      return res.status(403).json({ error: `Unauthorized: ${err.message}` });
    }
  }

  return res.status(401).json({ error: 'No token provided. Unauthorized.' });
};

module.exports = verifyToken;