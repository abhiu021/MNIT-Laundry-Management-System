const mongoose = require('mongoose');
const Hostel = require('../models/Hostel');
const Machine = require('../models/Machine');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected'))
.catch(err => {
  console.error('MongoDB Connection Error:', err);
  process.exit(1);
});

const createTestMachines = async () => {
  try {
    // Get the test hostel
    const hostel = await Hostel.findOne({ name: 'Test Hostel' });
    
    if (!hostel) {
      console.error('Test hostel not found. Please run createTestHostel.js first.');
      process.exit(1);
    }
    
    console.log(`Found hostel: ${hostel.name} with ID: ${hostel._id}`);
    
    // Check if machines already exist for this hostel
    const existingMachines = await Machine.find({ hostel: hostel._id });
    
    if (existingMachines.length > 0) {
      console.log(`${existingMachines.length} machines already exist for this hostel.`);
      existingMachines.forEach((machine, i) => {
        console.log(`${i+1}. ${machine.name} (${machine._id}) - ${machine.status}`);
      });
    } else {
      // Create test machines
      const machines = [
        {
          name: 'Test Washer 1',
          type: 'washer',
          hostel: hostel._id,
          status: 'available',
          costPerUse: 20,
          timePerUse: 30
        },
        {
          name: 'Test Washer 2',
          type: 'washer',
          hostel: hostel._id,
          status: 'available',
          costPerUse: 20,
          timePerUse: 30
        },
        {
          name: 'Test Dryer 1',
          type: 'dryer',
          hostel: hostel._id,
          status: 'available',
          costPerUse: 15,
          timePerUse: 25
        }
      ];
      
      console.log('Creating test machines...');
      
      for (const machineData of machines) {
        const machine = new Machine(machineData);
        await machine.save();
        console.log(`Created machine: ${machine.name} (${machine._id})`);
      }
      
      // Update hostel machine count
      hostel.totalMachines = (hostel.totalMachines || 0) + machines.length;
      hostel.machinesAvailable = (hostel.machinesAvailable || 0) + machines.length;
      await hostel.save();
      
      console.log('Test machines created successfully');
    }
  } catch (error) {
    console.error('Error creating test machines:', error);
  } finally {
    mongoose.connection.close();
  }
};

createTestMachines(); 