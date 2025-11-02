const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET; // Use the environment variable

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1]; // Authorization: 'Bearer TOKEN'
    if (!token) {
      return res.status(401).json({ message: 'Authentication failed!' });
    }
    const decodedToken = jwt.verify(token, JWT_SECRET);
    req.userData = { userId: decodedToken.userId };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Authentication failed!' });
  }
};