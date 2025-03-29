const Hostel = require('../models/Hostel');
const Machine = require('../models/Machine');

// Get all hostels
exports.getAllHostels = async (req, res) => {
  try {
    // Removed the populate call that was causing the error
    const hostels = await Hostel.find();
    
    // Get machine counts for each hostel as a separate step
    const hostelsWithCounts = await Promise.all(
      hostels.map(async (hostel) => {
        const machines = await Machine.find({ hostel: hostel._id }).select('name status');
        return {
          ...hostel.toObject(),
          machineCount: machines.length,
          availableMachines: machines.filter(m => m.status === 'available').length
        };
      })
    );
    
    res.json(hostelsWithCounts);
  } catch (err) {
    console.error('Error fetching hostels:', err.message);
    res.status(500).json({ 
      msg: 'Server error', 
      error: err.message 
    });
  }
};

// Get hostel by ID
exports.getHostelById = async (req, res) => {
  try {
    // Removed the populate call that was causing the error
    const hostel = await Hostel.findById(req.params.id);
    
    if (!hostel) {
      return res.status(404).json({ msg: 'Hostel not found' });
    }
    
    // Get machines for this hostel
    const machines = await Machine.find({ hostel: hostel._id }).select('name status type');
    
    // Add machine data to response
    const hostelWithMachines = {
      ...hostel.toObject(),
      machineCount: machines.length,
      availableMachines: machines.filter(m => m.status === 'available').length,
      machines: machines
    };
    
    res.json(hostelWithMachines);
  } catch (err) {
    console.error('Error fetching hostel by ID:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Hostel not found' });
    }
    res.status(500).json({ 
      msg: 'Server error', 
      error: err.message 
    });
  }
};

// Create a new hostel (admin only)
exports.createHostel = async (req, res) => {
  try {
    console.log('Create hostel request body:', req.body);
    const { name, location, description, imageUrl } = req.body;
    
    // Validate required fields
    if (!name || !location) {
      return res.status(400).json({ 
        msg: 'Missing required fields',
        details: {
          name: name ? 'provided' : 'missing',
          location: location ? 'provided' : 'missing'
        }
      });
    }
    
    // Check if hostel already exists
    let hostel = await Hostel.findOne({ name });
    if (hostel) {
      return res.status(400).json({ 
        msg: 'Hostel already exists',
        details: `A hostel with the name "${name}" already exists in the database`
      });
    }
    
    // Create new hostel with validated fields
    hostel = new Hostel({
      name,
      location,
      description: description || '',
      imageUrl: imageUrl || 'https://via.placeholder.com/150x100?text=Hostel+Image',
      totalMachines: 0,
      machinesAvailable: 0
    });
    
    await hostel.save();
    console.log('Hostel created successfully:', hostel);
    
    res.status(201).json(hostel);
  } catch (err) {
    console.error('Error creating hostel:', err.message);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        msg: 'Validation error', 
        errors: Object.values(err.errors).map(e => e.message)
      });
    }
    res.status(500).json({
      msg: 'Server error',
      error: err.message
    });
  }
};

// Update a hostel (admin only)
exports.updateHostel = async (req, res) => {
  try {
    console.log('Update hostel request body:', req.body);
    const { name, location, description, imageUrl } = req.body;
    
    // Validate inputs
    if (!name && !location && !description && !imageUrl) {
      return res.status(400).json({ 
        msg: 'No update fields provided',
        details: 'At least one field must be provided for update'
      });
    }
    
    // Find hostel
    let hostel = await Hostel.findById(req.params.id);
    
    if (!hostel) {
      return res.status(404).json({ msg: 'Hostel not found' });
    }
    
    // If name is changing, check for existing hostel with same name
    if (name && name !== hostel.name) {
      const existingHostel = await Hostel.findOne({ name });
      if (existingHostel) {
        return res.status(400).json({ 
          msg: 'Hostel name already in use',
          details: `Another hostel with the name "${name}" already exists`
        });
      }
    }
    
    // Update fields
    if (name) hostel.name = name;
    if (location) hostel.location = location;
    if (description !== undefined) hostel.description = description;
    if (imageUrl) hostel.imageUrl = imageUrl;
    
    await hostel.save();
    console.log('Hostel updated successfully:', hostel);
    
    res.json(hostel);
  } catch (err) {
    console.error('Error updating hostel:', err.message);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        msg: 'Validation error', 
        errors: Object.values(err.errors).map(e => e.message)
      });
    } else if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Hostel not found' });
    }
    res.status(500).json({
      msg: 'Server error',
      error: err.message
    });
  }
};

// Delete a hostel (admin only)
exports.deleteHostel = async (req, res) => {
  try {
    // Find hostel
    const hostel = await Hostel.findById(req.params.id);
    
    if (!hostel) {
      return res.status(404).json({ msg: 'Hostel not found' });
    }
    
    // Check if hostel has associated machines and delete them
    const associatedMachines = await Machine.find({ hostel: req.params.id });
    if (associatedMachines.length > 0) {
      console.log(`Deleting ${associatedMachines.length} machines associated with this hostel`);
      await Machine.deleteMany({ hostel: req.params.id });
    }
    
    // Delete hostel - use deleteOne instead of remove (which is deprecated)
    await Hostel.deleteOne({ _id: req.params.id });
    
    res.json({ msg: 'Hostel deleted' });
  } catch (err) {
    console.error('Error deleting hostel:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Hostel not found' });
    }
    res.status(500).json({ 
      msg: 'Server error', 
      error: err.message 
    });
  }
}; 