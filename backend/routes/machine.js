const express = require('express');
const router = express.Router();
const { 
  getAllMachines, 
  getMachinesByHostel,
  getMachineById, 
  createMachine, 
  updateMachineStatus, 
  deleteMachine,
  getMachineMaintenanceHistory
} = require('../controllers/machine');
const authMiddleware = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');

// Get all machines (all authenticated users)
router.get('/', authMiddleware, getAllMachines);

// Get machines by hostel (all authenticated users)
router.get('/hostel/:hostelId', authMiddleware, getMachinesByHostel);

// Get machine by ID (all authenticated users)
router.get('/:id', authMiddleware, getMachineById);

// Create a machine (admin only)
router.post('/', [authMiddleware, roleAuth(['admin'])], createMachine);

// Update machine status (staff and admin)
router.put('/:id/status', [authMiddleware, roleAuth(['staff', 'admin'])], updateMachineStatus);

// Delete a machine (admin only)
router.delete('/:id', [authMiddleware, roleAuth(['admin'])], deleteMachine);

// Get machine maintenance history (staff and admin)
router.get('/:id/maintenance', [authMiddleware, roleAuth(['staff', 'admin'])], getMachineMaintenanceHistory);

module.exports = router;