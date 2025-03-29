const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { generateToken, generateRefreshToken } = require('../utils/jwtGenerator');

// Register a new user
exports.register = async (req, res) => {
  try {
    const { name, email, password, roomNumber, role, hostel, contactNumber } = req.body;
    
    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Validate student email domain
    if (role === 'student' && !email.endsWith('@mnit.ac.in')) {
      return res.status(400).json({ msg: 'Students must register with a @mnit.ac.in email' });
    }

    // Create new user
    user = new User({ 
      name, 
      email, 
      password, 
      roomNumber, 
      role: role || 'student', // Default to student if not specified
      hostel: role === 'student' ? hostel : undefined,
      contactNumber
    });
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    
    await user.save();

    // Generate JWT tokens
    const payload = { 
      id: user._id,
      role: user.role 
    };
    
    const token = generateToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Set HTTP-only cookie with refresh token
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      secure: process.env.NODE_ENV === 'production', // Only use HTTPS in production
      sameSite: 'strict'
    });

    res.status(201).json({ 
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        roomNumber: user.roomNumber,
        walletBalance: user.walletBalance,
        hostel: user.hostel
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Log request for debugging
    console.log('Login attempt:', { 
      email, 
      body: req.body,
      headers: req.headers,
      cookies: req.cookies 
    });
    
    // Check if user exists
    const user = await User.findOne({ email }).populate('hostel', 'name');
    if (!user) {
      console.log('User not found');
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Password incorrect');
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Generate JWT tokens
    const payload = { 
      id: user._id,
      role: user.role 
    };
    
    const token = generateToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Set HTTP-only cookie with refresh token
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      secure: process.env.NODE_ENV === 'production', // Use HTTPS in production
      sameSite: 'lax' // Changed from strict to lax for cross-site access
    });

    // Set CORS headers explicitly
    const clientOrigin = req.headers.origin || 'http://localhost:3000';
    res.header('Access-Control-Allow-Origin', clientOrigin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, x-auth-token, Authorization');

    console.log('Login successful, sending response with token');
    console.log('Response headers:', res.getHeaders());
    
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        roomNumber: user.roomNumber,
        walletBalance: user.walletBalance,
        hostel: user.hostel
      }
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).send('Server error');
  }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password').populate('hostel', 'name');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Refresh token
exports.refreshToken = async (req, res) => {
  try {
    // Get refresh token from cookie
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({ msg: 'No refresh token, please login again' });
    }
    
    // Verify the refresh token
    const { verifyRefreshToken } = require('../utils/jwtGenerator');
    const decoded = verifyRefreshToken(refreshToken);
    
    if (!decoded) {
      return res.status(401).json({ msg: 'Invalid refresh token, please login again' });
    }
    
    // Generate new access token
    const payload = { 
      id: decoded.id,
      role: decoded.role 
    };
    
    const token = generateToken(payload);
    
    res.json({ token });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Logout user
exports.logout = (req, res) => {
  // Clear refresh token cookie
  res.clearCookie('refreshToken');
  res.json({ msg: 'Logged out successfully' });
};

// Update wallet balance
exports.updateWallet = async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || isNaN(amount)) {
      return res.status(400).json({ msg: 'Please provide a valid amount' });
    }
    
    const user = await User.findById(req.user.id);
    user.walletBalance += Number(amount);
    await user.save();
    
    res.json({ walletBalance: user.walletBalance });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};