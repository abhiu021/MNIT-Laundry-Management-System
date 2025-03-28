const Booking = require('../models/Booking');
const Machine = require('../models/Machine');
const User = require('../models/User');

// Create a booking
exports.createBooking = async (req, res) => {
  try {
    const { machineId, startTime, endTime } = req.body;
    const userId = req.user.id;

    // Check machine availability
    const machine = await Machine.findById(machineId);
    if (!machine || machine.status !== 'available') {
      return res.status(400).json({ msg: 'Machine not available' });
    }

    // Calculate amount (₹20 per 30 mins)
    const durationHours = (new Date(endTime) - new Date(startTime)) / (1000 * 60 * 30);
    const amount = durationHours * 20;

    // Check user balance
    const user = await User.findById(userId);
    if (user.walletBalance < amount) {
      return res.status(400).json({ msg: 'Insufficient balance' });
    }

    // Create booking
    const booking = new Booking({
      user: userId,
      machine: machineId,
      startTime,
      endTime,
      amount,
      paymentStatus: true,
    });

    await booking.save();

    // Update machine status
    machine.status = 'in_use';
    await machine.save();

    // Deduct from user wallet
    user.walletBalance -= amount;
    user.bookings.push(booking._id);
    await user.save();

    res.status(201).json(booking);
  } catch (err) {
    res.status(500).send('Server error');
  }
};

// Get all bookings for a user
exports.getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate('machine', 'name status');
    res.json(bookings);
  } catch (err) {
    res.status(500).send('Server error');
  }
};