const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  machine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Machine',
    required: true,
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['confirmed', 'completed', 'cancelled'],
    default: 'confirmed',
  },
  amount: {
    type: Number,
    required: true,
  },
  paymentStatus: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

module.exports = mongoose.model('Booking', BookingSchema);