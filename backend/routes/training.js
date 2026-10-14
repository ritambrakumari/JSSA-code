import express from 'express';
import { createTraining, getTrainings, deleteTraining } from '../controllers/trainingController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

// Staff and Admin can add training
router.post('/', authorize(['admin', 'superadmin', 'staff']), createTraining);

// Everyone can view (Employees see all, Staff see their own)
router.get('/', getTrainings);

// Delete training
router.delete('/:id', authorize(['admin', 'superadmin', 'staff']), deleteTraining);

export default router;
