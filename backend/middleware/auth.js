const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { verifyToken } = require('../utils/jwtGenerator');

// Protect routes (user must be logged in)
exports.protect = async (req, res, next) => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ msg: 'Not authorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Invalid token' });
  }
};

// Admin-only access
exports.admin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Admin access required' });
  }
  next();
};

// Auth middleware for protected routes
module.exports = async (req, res, next) => {
  // Get token from header (supports both formats)
  let token;
  
  // Check for Authorization: Bearer token format
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } 
  // Check for x-auth-token header
  else if (req.header('x-auth-token')) {
    token = req.header('x-auth-token');
  }
  
  // Check if no token
  if (!token) {
    console.log('No auth token provided');
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      console.log('Invalid token provided');
      return res.status(401).json({ msg: 'Token is not valid or has expired' });
    }

    // Set req.user from decoded token
    req.user = decoded;
    console.log('User authenticated:', decoded);
    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};