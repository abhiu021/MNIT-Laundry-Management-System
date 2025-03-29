const mongoose = require('mongoose');
const Hostel = require('../models/Hostel');
const Machine = require('../models/Machine');
require('dotenv').config();

// Set mongoose options for flexibility
mongoose.set('strictPopulate', false);

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

const verifyHostels = async () => {
  try {
    // Check existing hostels
    const hostels = await Hostel.find();
    console.log(`Found ${hostels.length} hostels in the database:`);
    
    hostels.forEach((hostel, index) => {
      console.log(`${index + 1}. ${hostel.name} (ID: ${hostel._id})`);
      console.log(`   Location: ${hostel.location}`);
      console.log(`   Total Machines: ${hostel.totalMachines}`);
      console.log(`   Available Machines: ${hostel.machinesAvailable}`);
      console.log(`   Description: ${hostel.description || 'N/A'}`);
      console.log(`   Image URL: ${hostel.imageUrl}`);
      console.log(`   Created: ${hostel.createdAt}`);
      console.log('------------------------');
    });
    
    // If no hostels, create default test hostel
    if (hostels.length === 0) {
      console.log('No hostels found. Creating a default test hostel...');
      
      const testHostel = new Hostel({
        name: 'Test Hostel',
        location: 'Main Campus',
        description: 'Default test hostel created by verification script',
        imageUrl: 'https://via.placeholder.com/150x100?text=Test+Hostel'
      });
      
      await testHostel.save();
      console.log(`Created test hostel with ID: ${testHostel._id}`);
    }
    
    // Check machines in each hostel
    for (const hostel of hostels) {
      const machines = await Machine.find({ hostel: hostel._id });
      console.log(`Hostel "${hostel.name}" has ${machines.length} machines:`);
      
      machines.forEach((machine, index) => {
        console.log(`   ${index + 1}. ${machine.name} (ID: ${machine._id})`);
        console.log(`      Type: ${machine.type}, Status: ${machine.status}`);
        console.log(`      Cost: ${machine.costPerUse}, Time: ${machine.timePerUse} mins`);
      });
      
      // Check if machine count and hostel count match
      if (machines.length !== hostel.totalMachines) {
        console.log(`WARNING: Hostel ${hostel.name} has totalMachines=${hostel.totalMachines} but actually has ${machines.length} machines`);
        
        // Update the count
        hostel.totalMachines = machines.length;
        hostel.machinesAvailable = machines.filter(m => m.status === 'available').length;
        await hostel.save();
        console.log(`Updated hostel machine counts: totalMachines=${hostel.totalMachines}, machinesAvailable=${hostel.machinesAvailable}`);
      }
    }
    
    console.log('Hostel verification complete.');
  } catch (error) {
    console.error('Error verifying hostels:', error);
  } finally {
    mongoose.connection.close();
  }
};

verifyHostels(); 