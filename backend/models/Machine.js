const mongoose = require('mongoose');

const MachineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a machine name'],
  },
  status: {
    type: String,
    enum: ['available', 'in_use', 'maintenance'],
    default: 'available',
  },
  capacity: {
    type: String,
    required: [true, 'Please specify capacity'],
  },
  lastMaintenance: {
    type: Date,
  },
  location: {
    type: String,
  },
});

module.exports = mongoose.model('Machine', MachineSchema);