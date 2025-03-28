const express = require('express');
const { createBooking, getBookings } = require('../controllers/booking');
const { protect } = require('../middleware/auth');
const router = express.Router();

// Create a booking
router.post('/', protect, createBooking);

// Get all bookings for a user
router.get('/', protect, getBookings);

module.exports = router;