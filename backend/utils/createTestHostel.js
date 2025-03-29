const mongoose = require('mongoose');
const Hostel = require('../models/Hostel');
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

const createTestHostel = async () => {
  try {
    const hostelExists = await Hostel.findOne({ name: 'Test Hostel' });
    
    if (hostelExists) {
      console.log('Test hostel already exists with ID:', hostelExists._id);
      console.log('Hostel details:', hostelExists);
      process.exit(0);
    }
    
    // Create a test hostel
    const hostel = new Hostel({
      name: 'Test Hostel',
      location: 'Main Campus',
      totalMachines: 0,
      machinesAvailable: 0,
      description: 'A test hostel for development',
      imageUrl: 'https://via.placeholder.com/400x200?text=Test+Hostel'
    });
    
    await hostel.save();
    
    console.log('Test hostel created successfully!');
    console.log('Hostel ID:', hostel._id);
    console.log('Use this ID when creating machines.');
    
    process.exit(0);
  } catch (err) {
    console.error('Error creating test hostel:', err);
    process.exit(1);
  }
};

createTestHostel(); 