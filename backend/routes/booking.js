const express = require('express');
const router = express.Router();
const { 
  createBooking, 
  getUserBookings, 
  getAllBookings, 
  getBookingById,
  cancelBooking,
  validateAccessCode,
  completeBooking,
  getAvailableTimeSlots
} = require('../controllers/booking');
const authMiddleware = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');
const Booking = require('../models/Booking');

// Get all bookings (admin and staff only)
router.get('/all', [authMiddleware, roleAuth(['admin', 'staff'])], getAllBookings);

// Get user's bookings
router.get('/', authMiddleware, getUserBookings);

// Get available time slots for a machine
router.get('/available-slots', authMiddleware, getAvailableTimeSlots);

// Get user booking statistics
router.get('/user-stats', authMiddleware, async (req, res) => {
  try {
    // Get user's booking stats
    const totalBookings = await Booking.countDocuments({ user: req.user.id });
    const completedBookings = await Booking.countDocuments({ user: req.user.id, status: 'completed' });
    const upcomingBookings = await Booking.countDocuments({ 
      user: req.user.id, 
      status: 'confirmed',
      startTime: { $gt: new Date() }
    });
    const cancelledBookings = await Booking.countDocuments({ user: req.user.id, status: 'cancelled' });
    
    // Get recent bookings
    const recentBookings = await Booking.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('machine', 'name')
      .populate('hostel', 'name');
    
    // Calculate usage statistics
    const bookings = await Booking.find({ 
      user: req.user.id,
      status: 'completed'
    });
    
    const totalTimeUsed = bookings.reduce((sum, booking) => sum + booking.duration, 0);
    const totalAmountSpent = bookings.reduce((sum, booking) => sum + booking.amount, 0);
    
    res.json({
      totalBookings,
      completedBookings,
      upcomingBookings,
      cancelledBookings,
      recentBookings,
      totalTimeUsed,
      totalAmountSpent
    });
  } catch (err) {
    console.error('Error fetching user booking stats:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Get booking by ID
router.get('/:id', authMiddleware, getBookingById);

// Create a booking
router.post('/', authMiddleware, createBooking);

// Cancel a booking
router.put('/:id/cancel', authMiddleware, cancelBooking);

// Validate access code
router.post('/validate-code', authMiddleware, validateAccessCode);

// Complete booking
router.put('/complete', [authMiddleware, roleAuth(['staff', 'admin'])], completeBooking);

module.exports = router;