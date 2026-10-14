import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { 
    getAllSupportContacts, 
    bulkUpdateSupportContacts, 
    deleteSupportContact, 
    getMyStateSupport,
    editSupportContact
} from '../controllers/supportController.js';

const router = express.Router();

// Public / Protected depending on needs, but generally protected
router.get('/', authenticate, getAllSupportContacts);
router.post('/bulk', authenticate, authorize('admin', 'superadmin', 'staff'), bulkUpdateSupportContacts);
router.delete('/:stateId/contact/:contactId', authenticate, authorize('admin', 'superadmin', 'staff'), deleteSupportContact);
router.put('/:stateId/contact/:contactId', authenticate, authorize('admin', 'superadmin', 'staff'), editSupportContact);
router.get('/my-state', authenticate, getMyStateSupport);

export default router;
