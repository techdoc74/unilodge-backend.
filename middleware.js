const jwt = require('jsonwebtoken');

const JWT_SECRET = 'your-super-secret-key-that-is-long-and-random'; // Must be the same as in server.js

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1]; // Authorization: 'Bearer TOKEN'
    if (!token) {
      throw new Error('Authentication failed!');
    }
    const decodedToken = jwt.verify(token, JWT_SECRET);
    req.userData = { userId: decodedToken.userId };
    next();
  } catch (err) {
    res.status(401).json({ message: 'Authentication failed!' });
  }
};