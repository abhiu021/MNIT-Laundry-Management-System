const Booking = require('../models/Booking');
const Machine = require('../models/Machine');
const User = require('../models/User');
const moment = require('moment');

// Get all bookings for admin/staff
exports.getAllBookings = async (req, res) => {
  try {
    const { status, date, machineId, hostelId } = req.query;
    
    // Build query object
    const query = {};
    
    if (status) query.status = status;
    if (machineId) query.machine = machineId;
    if (hostelId) query.hostel = hostelId;
    
    // Filter by date if provided
    if (date) {
      const startOfDay = moment(date).startOf('day').toDate();
      const endOfDay = moment(date).endOf('day').toDate();
      query.startTime = { $gte: startOfDay, $lte: endOfDay };
    }
    
    const bookings = await Booking.find(query)
      .populate('user', 'name email roomNumber')
      .populate('machine', 'name machineNumber status')
      .populate('hostel', 'name location')
      .sort({ startTime: 1 });
    
    res.json(bookings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Get user's bookings
exports.getUserBookings = async (req, res) => {
  try {
    const { status } = req.query;
    
    // Build query object
    const query = { user: req.user.id };
    
    if (status) query.status = status;
    
    const bookings = await Booking.find(query)
      .populate('machine', 'name machineNumber status')
      .populate('hostel', 'name location')
      .sort({ startTime: -1 });
    
    res.json(bookings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Get booking by ID
exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'name email roomNumber')
      .populate('machine', 'name machineNumber status')
      .populate('hostel', 'name location');
    
    if (!booking) {
      return res.status(404).json({ msg: 'Booking not found' });
    }
    
    // Check if user is authorized to view this booking
    if (booking.user._id.toString() !== req.user.id && req.user.role === 'student') {
      return res.status(403).json({ msg: 'Not authorized' });
    }
    
    res.json(booking);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Booking not found' });
    }
    res.status(500).send('Server error');
  }
};

// Get available time slots for a specific machine and date
exports.getAvailableTimeSlots = async (req, res) => {
  try {
    const { machineId, date } = req.query;
    
    if (!machineId || !date) {
      return res.status(400).json({ msg: 'Machine ID and date are required' });
    }
    
    // Check if machine exists and is available
    const machine = await Machine.findById(machineId);
    if (!machine) {
      return res.status(404).json({ msg: 'Machine not found' });
    }
    
    if (machine.status !== 'available') {
      return res.status(400).json({ msg: 'Machine is not available for booking' });
    }
    
    // Get start and end of the selected date
    const startOfDay = moment(date).startOf('day').toDate();
    const endOfDay = moment(date).endOf('day').toDate();
    
    // Get all bookings for this machine on the selected date
    const bookings = await Booking.find({
      machine: machineId,
      status: { $in: ['confirmed', 'in_progress'] },
      startTime: { $gte: startOfDay, $lt: endOfDay }
    }).sort({ startTime: 1 });
    
    // Generate available time slots (30 minute intervals)
    const timeSlots = [];
    const slotDuration = 30; // minutes
    const operatingHoursStart = 6; // 6 AM
    const operatingHoursEnd = 22; // 10 PM
    
    // Create time slots for the day
    for (let hour = operatingHoursStart; hour < operatingHoursEnd; hour++) {
      for (let minute = 0; minute < 60; minute += slotDuration) {
        const slotStart = moment(startOfDay).add(hour, 'hours').add(minute, 'minutes');
        const slotEnd = moment(slotStart).add(slotDuration, 'minutes');
        
        // Skip slots that are in the past
        if (slotStart < moment()) continue;
        
        // Check if slot is available
        const isAvailable = !bookings.some(booking => {
          const bookingStart = moment(booking.startTime);
          const bookingEnd = moment(booking.endTime);
          return (
            (slotStart >= bookingStart && slotStart < bookingEnd) ||
            (slotEnd > bookingStart && slotEnd <= bookingEnd) ||
            (slotStart <= bookingStart && slotEnd >= bookingEnd)
          );
        });
        
        if (isAvailable) {
          timeSlots.push({
            start: slotStart.toDate(),
            end: slotEnd.toDate(),
            duration: slotDuration
          });
        }
      }
    }
    
    // Group available slots into 30/60 minute options
    const availableSlots = {
      thirtyMinutes: [],
      sixtyMinutes: []
    };
    
    // Add 30-minute slots
    timeSlots.forEach(slot => {
      availableSlots.thirtyMinutes.push({
        start: slot.start,
        end: slot.end
      });
    });
    
    // Add 60-minute slots (check consecutive 30-minute slots)
    for (let i = 0; i < timeSlots.length - 1; i++) {
      const currentSlot = timeSlots[i];
      const nextSlot = timeSlots[i + 1];
      
      if (moment(currentSlot.end).isSame(moment(nextSlot.start))) {
        availableSlots.sixtyMinutes.push({
          start: currentSlot.start,
          end: nextSlot.end
        });
      }
    }
    
    res.json(availableSlots);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Create a new booking
exports.createBooking = async (req, res) => {
  try {
    const { machineId, hostelId, startTime, duration } = req.body;
    
    if (!machineId || !startTime || !duration || !hostelId) {
      return res.status(400).json({ msg: 'Missing required fields' });
    }
    
    if (![30, 60].includes(Number(duration))) {
      return res.status(400).json({ msg: 'Duration must be 30 or 60 minutes' });
    }
    
    // Get user to check their hostel and wallet balance
    const user = await User.findById(req.user.id);
    
    // Verify user is booking from their own hostel
    if (user.role === 'student' && user.hostel.toString() !== hostelId) {
      return res.status(403).json({ 
        msg: 'You can only book machines from your own hostel',
        userHostel: user.hostel
      });
    }
    
    // Check if machine exists and is available
    const machine = await Machine.findById(machineId);
    if (!machine) {
      return res.status(404).json({ msg: 'Machine not found' });
    }
    
    if (machine.status !== 'available') {
      return res.status(400).json({ msg: 'Machine is not available for booking' });
    }
    
    // Verify machine belongs to the specified hostel
    if (machine.hostel.toString() !== hostelId) {
      return res.status(400).json({ msg: 'Machine does not belong to the selected hostel' });
    }
    
    // Calculate end time
    const start = moment(startTime);
    const end = moment(startTime).add(duration, 'minutes');
    
    // Validate time slot is not in the past
    if (start < moment()) {
      return res.status(400).json({ msg: 'Cannot book a slot in the past' });
    }
    
    // Check if time slot is available
    const conflictingBooking = await Booking.findOne({
      machine: machineId,
      status: { $in: ['confirmed', 'in_progress'] },
      $or: [
        { startTime: { $lt: end.toDate() }, endTime: { $gt: start.toDate() } }
      ]
    });
    
    if (conflictingBooking) {
      return res.status(400).json({ msg: 'This time slot is already booked' });
    }
    
    // Calculate amount (₹20 per 30 minutes)
    const amount = duration === 30 ? 20 : 40;
    
    // Check wallet balance
    if (user.walletBalance < amount) {
      return res.status(400).json({ msg: 'Insufficient wallet balance' });
    }
    
    // Create booking
    const booking = new Booking({
      user: req.user.id,
      machine: machineId,
      hostel: hostelId,
      startTime: start.toDate(),
      endTime: end.toDate(),
      duration,
      amount,
      paymentStatus: true // Auto deduct from wallet
    });
    
    await booking.save();
    
    // Update user wallet and bookings
    user.walletBalance -= amount;
    user.bookings.push(booking._id);
    await user.save();
    
    // Update machine bookings
    machine.bookings.push(booking._id);
    await machine.save();
    
    // Return booking with access code/QR
    res.status(201).json(booking);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Cancel a booking
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ msg: 'Booking not found' });
    }
    
    // Check if user is authorized to cancel this booking
    if (booking.user.toString() !== req.user.id && req.user.role === 'student') {
      return res.status(403).json({ msg: 'Not authorized' });
    }
    
    // Check if booking can be cancelled (only confirmed bookings)
    if (booking.status !== 'confirmed') {
      return res.status(400).json({ msg: 'This booking cannot be cancelled' });
    }
    
    // Check if cancellation is at least 1 hour before start time
    const startTime = moment(booking.startTime);
    const now = moment();
    const hourDiff = startTime.diff(now, 'hours');
    
    if (hourDiff < 1 && req.user.role === 'student') {
      return res.status(400).json({ 
        msg: 'Bookings can only be cancelled at least 1 hour before the start time' 
      });
    }
    
    // Update booking status
    booking.status = 'cancelled';
    await booking.save();
    
    // Refund wallet if cancellation is valid
    if (hourDiff >= 1 || req.user.role !== 'student') {
      const user = await User.findById(booking.user);
      user.walletBalance += booking.amount;
      await user.save();
    }
    
    res.json({ msg: 'Booking cancelled successfully' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Booking not found' });
    }
    res.status(500).send('Server error');
  }
};

// Validate access code to unlock machine
exports.validateAccessCode = async (req, res) => {
  try {
    const { accessCode } = req.body;
    
    if (!accessCode) {
      return res.status(400).json({ msg: 'Access code is required' });
    }
    
    // Find booking with the access code
    const booking = await Booking.findOne({ 
      accessCode,
      status: 'confirmed'
    }).populate('machine', 'status');
    
    if (!booking) {
      return res.status(404).json({ msg: 'Invalid access code' });
    }
    
    // Check if it's time for the booking
    const now = moment();
    const startTime = moment(booking.startTime);
    const endTime = moment(booking.endTime);
    
    // Allow access 5 minutes before start time
    if (now < startTime.subtract(5, 'minutes') || now > endTime) {
      return res.status(400).json({ msg: 'Access code is not valid at this time' });
    }
    
    // Check if machine is available
    if (booking.machine.status !== 'available') {
      return res.status(400).json({ msg: 'Machine is not available' });
    }
    
    // Update machine status and booking status
    await Machine.findByIdAndUpdate(booking.machine._id, { status: 'in_use' });
    
    booking.status = 'in_progress';
    booking.usageStarted = now.toDate();
    await booking.save();
    
    res.json({ msg: 'Machine unlocked successfully', booking });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Complete booking (machine usage ended)
exports.completeBooking = async (req, res) => {
  try {
    const { bookingId } = req.body;
    
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({ msg: 'Booking not found' });
    }
    
    if (booking.status !== 'in_progress') {
      return res.status(400).json({ msg: 'This booking is not in progress' });
    }
    
    // Update booking status
    booking.status = 'completed';
    booking.usageEnded = new Date();
    
    // Calculate actual duration in minutes
    if (booking.usageStarted) {
      const start = moment(booking.usageStarted);
      const end = moment(booking.usageEnded);
      booking.actualDuration = end.diff(start, 'minutes');
    }
    
    await booking.save();
    
    // Update machine status
    await Machine.findByIdAndUpdate(booking.machine, { status: 'available' });
    
    res.json({ msg: 'Booking completed successfully', booking });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Booking not found' });
    }
    res.status(500).send('Server error');
  }
};