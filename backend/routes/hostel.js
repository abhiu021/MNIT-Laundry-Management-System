const express = require('express');
const router = express.Router();
const { 
  getAllHostels, 
  getHostelById, 
  createHostel, 
  updateHostel, 
  deleteHostel 
} = require('../controllers/hostel');
const authMiddleware = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');

// Get all hostels (all authenticated users)
router.get('/', authMiddleware, getAllHostels);

// Get hostel by ID (all authenticated users)
router.get('/:id', authMiddleware, getHostelById);

// Create a hostel (admin only)
router.post('/', [authMiddleware, roleAuth(['admin'])], createHostel);

// Update a hostel (admin only)
router.put('/:id', [authMiddleware, roleAuth(['admin'])], updateHostel);

// Delete a hostel (admin only)
router.delete('/:id', [authMiddleware, roleAuth(['admin'])], deleteHostel);

module.exports = router; 