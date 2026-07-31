const { admin } = require('../config/firebase');

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(403 || 401).json({ error: 'No token provided. Unauthorized.' });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify the token using firebase-admin auth
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error.message);
    return res.status(403).json({ error: 'Unauthorized: Invalid or expired token' });
  }
};

module.exports = verifyToken;