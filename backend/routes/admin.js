const express = require('express');
const authMiddleware = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');
const User = require('../models/User');
const Hostel = require('../models/Hostel');
const Machine = require('../models/Machine');
const Booking = require('../models/Booking');
const bcrypt = require('bcryptjs');
const router = express.Router();

// Middleware to ensure admin access
const adminOnly = [authMiddleware, roleAuth(['admin'])];

// Get admin dashboard stats
router.get('/stats/users', adminOnly, async (req, res) => {
  try {
    const count = await User.countDocuments();
    res.json({ count });
  } catch (err) {
    console.error('Error getting user stats:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.get('/stats/hostels', adminOnly, async (req, res) => {
  try {
    const count = await Hostel.countDocuments();
    res.json({ count });
  } catch (err) {
    console.error('Error getting hostel stats:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.get('/stats/machines', adminOnly, async (req, res) => {
  try {
    const count = await Machine.countDocuments();
    res.json({ count });
  } catch (err) {
    console.error('Error getting machine stats:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.get('/stats/bookings', adminOnly, async (req, res) => {
  try {
    const count = await Booking.countDocuments();
    res.json({ count });
  } catch (err) {
    console.error('Error getting booking stats:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// User management
router.get('/users', adminOnly, async (req, res) => {
  try {
    const users = await User.find().populate('hostel', 'name location');
    res.json(users);
  } catch (err) {
    console.error('Error getting users:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.post('/users', adminOnly, async (req, res) => {
  try {
    const { email, password, name, role, hostel, roomNumber, walletBalance, contactNumber } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: 'User with this email already exists' });
    }
    
    // Validate student email domain
    if (role === 'student' && !email.endsWith('@mnit.ac.in')) {
      return res.status(400).json({ msg: 'Students must register with a @mnit.ac.in email' });
    }
    
    // Create new user
    const newUser = new User({
      name,
      email,
      password,
      role,
      walletBalance: walletBalance || 0,
      contactNumber
    });
    
    // Add student-specific fields
    if (role === 'student') {
      newUser.roomNumber = roomNumber;
      newUser.hostel = hostel;
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    newUser.password = await bcrypt.hash(password, salt);
    
    await newUser.save();
    
    res.status(201).json({
      msg: 'User created successfully',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
    
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.put('/users/:id', adminOnly, async (req, res) => {
  try {
    const { name, email, password, role, hostel, roomNumber, walletBalance, contactNumber } = req.body;
    
    // Find user
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Validate student email domain
    if (role === 'student' && email !== user.email && !email.endsWith('@mnit.ac.in')) {
      return res.status(400).json({ msg: 'Students must register with a @mnit.ac.in email' });
    }
    
    // Update user fields
    user.name = name;
    user.email = email;
    user.role = role;
    user.walletBalance = walletBalance;
    user.contactNumber = contactNumber;
    
    // Update student-specific fields
    if (role === 'student') {
      user.roomNumber = roomNumber;
      user.hostel = hostel;
    } else {
      // Clear student fields if role is not student
      user.roomNumber = undefined;
      user.hostel = undefined;
    }
    
    // Update password if provided
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }
    
    await user.save();
    
    res.json({
      msg: 'User updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
    
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.delete('/users/:id', adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Don't allow deleting self
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ msg: 'Cannot delete your own account' });
    }
    
    await user.remove();
    
    res.json({ msg: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router; 