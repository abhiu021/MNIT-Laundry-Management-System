const express = require('express');
const { 
  register, 
  login, 
  getCurrentUser, 
  updateWallet,
  refreshToken,
  logout
} = require('../controllers/auth');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Register a new user
router.post('/register', register);

// Login user
router.post('/login', login);

// Get current user (protected route)
router.get('/me', authMiddleware, getCurrentUser);

// Update wallet balance (protected route)
router.post('/wallet', authMiddleware, updateWallet);

// Refresh access token
router.post('/refresh-token', refreshToken);

// Logout user
router.post('/logout', logout);

// Debug endpoint
router.get('/debug', (req, res) => {
  console.log('Debug Headers:', req.headers);
  res.json({ 
    message: 'Debug info', 
    headers: req.headers,
    cookies: req.cookies || 'No cookies',
    authHeader: req.header('x-auth-token') || 'No auth token'
  });
});

module.exports = router;