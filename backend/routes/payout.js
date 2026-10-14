import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { initiateAdminPayout, getPayoutHistory, razorpayWebhook, testRazorpayPayout } from '../controllers/payoutController.js';

const router = express.Router();

router.post('/initiate', authenticate, authorize(['admin', 'superadmin']), initiateAdminPayout);
router.post('/test', authenticate, authorize(['admin', 'superadmin']), testRazorpayPayout);
router.get('/history', authenticate, authorize(['admin', 'superadmin']), getPayoutHistory);
router.post('/webhook', express.raw({ type: 'application/json' }), razorpayWebhook);

export default router;
