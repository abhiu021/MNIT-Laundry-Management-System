const mongoose = require('mongoose');

const MachineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a machine name'],
  },
  type: {
    type: String,
    enum: ['washer', 'dryer'],
    default: 'washer',
    required: [true, 'Please specify machine type'],
  },
  hostel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hostel',
    required: [true, 'Please specify the hostel'],
  },
  status: {
    type: String,
    enum: ['available', 'in_use', 'maintenance', 'out-of-order'],
    default: 'available',
  },
  costPerUse: {
    type: Number,
    default: 20,
    required: [true, 'Please specify cost per use'],
  },
  timePerUse: {
    type: Number,
    default: 30,
    required: [true, 'Please specify time per use in minutes'],
  },
  lastMaintenance: {
    type: Date,
    default: Date.now,
  },
  maintenanceHistory: [{
    date: { type: Date },
    description: { type: String },
    technician: { type: String }
  }],
  bookings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }],
}, { timestamps: true });

module.exports = mongoose.model('Machine', MachineSchema);