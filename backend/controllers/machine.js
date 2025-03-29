const Machine = require('../models/Machine');
const Hostel = require('../models/Hostel');
const Booking = require('../models/Booking');

// Get all machines
exports.getAllMachines = async (req, res) => {
  try {
    const machines = await Machine.find()
      .populate('hostel', 'name location')
      .sort({ hostel: 1, machineNumber: 1 });
    res.json(machines);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Get machines by hostel
exports.getMachinesByHostel = async (req, res) => {
  try {
    const { hostelId } = req.params;
    const machines = await Machine.find({ hostel: hostelId })
      .populate('hostel', 'name location')
      .sort({ machineNumber: 1 });
    res.json(machines);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Get machine by ID
exports.getMachineById = async (req, res) => {
  try {
    const machine = await Machine.findById(req.params.id)
      .populate('hostel', 'name location');
    
    if (!machine) {
      return res.status(404).json({ msg: 'Machine not found' });
    }
    
    res.json(machine);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Machine not found' });
    }
    res.status(500).send('Server error');
  }
};

// Create a new machine (admin only)
exports.createMachine = async (req, res) => {
  try {
    console.log('Create machine request:', req.body);
    const { name, type, hostel, status, costPerUse, timePerUse } = req.body;
    
    // Enhanced validation
    if (!name || !hostel) {
      return res.status(400).json({ 
        msg: 'Missing required fields', 
        details: {
          name: name ? 'provided' : 'missing',
          hostel: hostel ? 'provided' : 'missing'
        }
      });
    }
    
    // Check if hostel exists with detailed error
    console.log(`Checking for hostel with ID: ${hostel}`);
    const hostelExists = await Hostel.findById(hostel);
    if (!hostelExists) {
      // Get list of available hostels to help with debugging
      const availableHostels = await Hostel.find({}, 'name _id');
      console.log('Available hostels:', availableHostels);
      
      return res.status(404).json({ 
        msg: 'Hostel not found',
        details: `The hostel ID ${hostel} does not exist in the database`,
        availableHostels
      });
    }
    
    console.log(`Found hostel: ${hostelExists.name} (${hostelExists._id})`);
    
    // Create new machine
    const machine = new Machine({
      name,
      type: type || 'washer',
      hostel,
      status: status || 'available',
      costPerUse: costPerUse || 20,
      timePerUse: timePerUse || 30,
      lastMaintenance: new Date()
    });
    
    const savedMachine = await machine.save();
    
    // Populate hostel info for response
    const populatedMachine = await Machine.findById(savedMachine._id)
      .populate('hostel', 'name location');
    
    // Update hostel machine count
    hostelExists.totalMachines = (hostelExists.totalMachines || 0) + 1;
    if (status === 'available') {
      hostelExists.machinesAvailable = (hostelExists.machinesAvailable || 0) + 1;
    }
    await hostelExists.save();
    
    console.log('Machine created:', populatedMachine);
    res.status(201).json(populatedMachine);
  } catch (err) {
    console.error('Error creating machine:', err.message);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        msg: 'Validation error', 
        errors: Object.values(err.errors).map(e => e.message)
      });
    } else if (err.name === 'CastError') {
      return res.status(400).json({
        msg: 'Invalid ID format',
        details: `The provided ID "${err.value}" is not a valid MongoDB ObjectId`
      });
    }
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Update machine status (staff and admin)
exports.updateMachineStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['available', 'in_use', 'maintenance', 'out_of_order'].includes(status)) {
      return res.status(400).json({ msg: 'Invalid status' });
    }
    
    // Find machine
    const machine = await Machine.findById(req.params.id);
    
    if (!machine) {
      return res.status(404).json({ msg: 'Machine not found' });
    }
    
    // Update status
    machine.status = status;
    
    // If machine is set to maintenance, update maintenance record
    if (status === 'maintenance') {
      machine.lastMaintenance = new Date();
      machine.maintenanceHistory.push({
        date: new Date(),
        description: req.body.maintenanceDescription || 'Regular maintenance',
        technician: req.body.technician || req.user.id
      });
      
      // Cancel any upcoming bookings if machine is under maintenance
      await Booking.updateMany(
        { 
          machine: req.params.id, 
          status: 'confirmed',
          startTime: { $gt: new Date() }
        },
        { status: 'cancelled' }
      );
    }
    
    await machine.save();
    
    res.json(machine);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Machine not found' });
    }
    res.status(500).send('Server error');
  }
};

// Delete a machine (admin only)
exports.deleteMachine = async (req, res) => {
  try {
    // Find machine
    const machine = await Machine.findById(req.params.id);
    
    if (!machine) {
      return res.status(404).json({ msg: 'Machine not found' });
    }
    
    // Get hostel
    const hostel = await Hostel.findById(machine.hostel);
    
    // Remove machine from hostel
    if (hostel) {
      hostel.machines = hostel.machines.filter(
        machineId => machineId.toString() !== req.params.id
      );
      hostel.totalMachines -= 1;
      await hostel.save();
    }
    
    // Cancel any upcoming bookings for this machine
    await Booking.updateMany(
      { machine: req.params.id, status: 'confirmed' },
      { status: 'cancelled' }
    );
    
    // Delete machine
    await machine.remove();
    
    res.json({ msg: 'Machine deleted' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Machine not found' });
    }
    res.status(500).send('Server error');
  }
};

// Get machine maintenance history
exports.getMachineMaintenanceHistory = async (req, res) => {
  try {
    const machine = await Machine.findById(req.params.id);
    
    if (!machine) {
      return res.status(404).json({ msg: 'Machine not found' });
    }
    
    res.json(machine.maintenanceHistory);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Machine not found' });
    }
    res.status(500).send('Server error');
  }
}; 