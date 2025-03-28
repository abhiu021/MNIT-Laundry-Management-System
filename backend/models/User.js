const mongoose = require('mongoose');
const validator = require('validator');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
  },
  roomNumber: {
    type: String,
    required: [true, 'Please provide your room number'],
  },
  role: {
    type: String,
    enum: ['student', 'admin', 'staff'],
    default: 'student',
  },
  walletBalance: {
    type: Number,
    default: 0,
  },
  bookings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }],
});

module.exports = mongoose.model('User', UserSchema);