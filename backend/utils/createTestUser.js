const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
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

const createTestUsers = async () => {
  try {
    // Create a test hostel first
    let hostel = await Hostel.findOne({ name: 'Test Hostel' });
    
    if (!hostel) {
      hostel = new Hostel({
        name: 'Test Hostel',
        location: 'Main Campus',
        totalMachines: 5
      });
      await hostel.save();
      console.log('Test hostel created');
    } else {
      console.log('Test hostel already exists');
    }
    
    // Check if users already exist
    const adminExists = await User.findOne({ email: 'admin@example.com' });
    const studentExists = await User.findOne({ email: 'student@mnit.ac.in' });
    const staffExists = await User.findOne({ email: 'staff@example.com' });
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    
    // Create admin user if doesn't exist
    if (!adminExists) {
      const admin = new User({
        name: 'Admin User',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin'
      });
      await admin.save();
      console.log('Admin user created');
    } else {
      console.log('Admin user already exists');
    }
    
    // Create student user if doesn't exist
    if (!studentExists) {
      const student = new User({
        name: 'Test Student',
        email: 'student@mnit.ac.in',
        password: hashedPassword,
        role: 'student',
        roomNumber: 'H9-101',
        walletBalance: 100,
        hostel: hostel._id  // Set the hostel reference
      });
      await student.save();
      console.log('Student user created');
    } else {
      console.log('Student user already exists');
    }
    
    // Create staff user if doesn't exist
    if (!staffExists) {
      const staff = new User({
        name: 'Staff Member',
        email: 'staff@example.com',
        password: hashedPassword,
        role: 'staff'
      });
      await staff.save();
      console.log('Staff user created');
    } else {
      console.log('Staff user already exists');
    }
    
    console.log('Test users setup complete');
    process.exit(0);
  } catch (err) {
    console.error('Error creating test users:', err);
    process.exit(1);
  }
};

createTestUsers(); 