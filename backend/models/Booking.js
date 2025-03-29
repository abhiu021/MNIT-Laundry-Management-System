const mongoose = require('mongoose');
const crypto = require('crypto');

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
  hostel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hostel',
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
  duration: {
    type: Number, // Duration in minutes (30 or 60)
    enum: [30, 60],
    required: true,
  },
  status: {
    type: String,
    enum: ['confirmed', 'completed', 'cancelled', 'in_progress'],
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
  accessCode: {
    type: String,
    default: function() {
      // Generate a random 6-digit code
      return Math.floor(100000 + Math.random() * 900000).toString();
    }
  },
  qrCode: {
    type: String,
    default: function() {
      // Generate a unique string for QR code
      return crypto.randomBytes(16).toString('hex');
    }
  },
  usageStarted: {
    type: Date,
  },
  usageEnded: {
    type: Date,
  },
  actualDuration: {
    type: Number, // Actual duration in minutes
  },
  feedback: {
    rating: { type: Number, min: 1, max: 5 },
    comment: { type: String }
  }
}, { timestamps: true });

module.exports = mongoose.model('Booking', BookingSchema);