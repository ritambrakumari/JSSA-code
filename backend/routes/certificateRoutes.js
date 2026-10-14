import express from 'express';
import { 
    assignCertificate, 
    updateAssignedCertificate, 
    deleteAssignedCertificate, 
    bulkDeleteAssignedCertificates,
    getAssignedCertificatesByEmployee, 
    getMyCertificates,
    getRMs,
    getCertificateConfig,
    updateCertificateConfig,
    triggerAutoAssignCertificates,
    getAutoAssignedHistory
} from '../controllers/certificateController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Certificate Configuration Endpoints
router.get('/config', authenticate, authorize('admin', 'superadmin', 'staff'), getCertificateConfig);
router.put('/config', authenticate, authorize('admin', 'superadmin', 'staff'), updateCertificateConfig);

// Certificate Auto-Assignment Operations
router.post('/auto-assign/trigger', authenticate, authorize('admin', 'superadmin', 'staff'), triggerAutoAssignCertificates);
router.get('/auto-assign/history', authenticate, authorize('admin', 'superadmin', 'staff'), getAutoAssignedHistory);

// Bulk Delete Operations
router.post('/bulk-delete', authenticate, authorize('admin', 'superadmin', 'staff'), bulkDeleteAssignedCertificates);

// Get RMs for assignment
router.get('/rms', authenticate, authorize('admin', 'superadmin', 'staff'), getRMs);

// Admin assigning certificates
router.post('/assign', authenticate, authorize('admin', 'superadmin', 'staff'), assignCertificate);
router.put('/assign/:id', authenticate, authorize('admin', 'superadmin', 'staff'), updateAssignedCertificate);
router.delete('/assign/:id', authenticate, authorize('admin', 'superadmin', 'staff'), deleteAssignedCertificate);
router.get('/employee/:id', authenticate, authorize('admin', 'superadmin', 'staff'), getAssignedCertificatesByEmployee);

// RM (Employee) viewing their certificates
router.get('/my-certificates', authenticate, authorize('employee'), getMyCertificates);

export default router;
