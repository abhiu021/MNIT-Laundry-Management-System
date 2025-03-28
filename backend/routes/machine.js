const express = require('express');
const { getMachines, addMachine } = require('../controllers/machine');
const { protect, admin } = require('../middleware/auth');
const router = express.Router();

// Get all machines (students & admin)
router.get('/', protect, getMachines);

// Add a new machine (admin only)
router.post('/', protect, admin, addMachine);

module.exports = router;