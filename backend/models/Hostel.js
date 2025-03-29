const mongoose = require('mongoose');

const HostelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a hostel name'],
    unique: true,
  },
  location: {
    type: String,
    required: [true, 'Please provide a location'],
  },
  totalMachines: {
    type: Number,
    default: 0,
  },
  machinesAvailable: {
    type: Number,
    default: 0,
  },
  description: {
    type: String,
    default: '',
  },
  imageUrl: {
    type: String,
    default: 'https://via.placeholder.com/150x100?text=Hostel+Image',
  }
}, { timestamps: true });

module.exports = mongoose.model('Hostel', HostelSchema); 