import express from 'express';
import { protect, admin } from '../middleware/firebaseAuth.js';
import {
  sendPurchaseReceipt,
  sendDeliveryFeedback,
  sendOrderStatusUpdate,
  subscribeToNewsletter,
  unsubscribeFromNewsletter,
  getSubscribers,
  deleteSubscriber,
  createCampaign,
  getCampaigns,
  getCampaignById,
  updateCampaign,
  deleteCampaign,
  sendCampaign,
  getEmailStats
} from '../controllers/emailController.js';

const router = express.Router();

// Public routes
router.post('/subscribe', subscribeToNewsletter);
router.post('/unsubscribe', unsubscribeFromNewsletter);

// Order-related email routes
router.post('/purchase-receipt', protect, sendPurchaseReceipt);
router.post('/delivery-feedback', protect, sendDeliveryFeedback);
router.post('/order-status', protect, admin, sendOrderStatusUpdate);

// Admin routes - Subscribers
router.route('/subscribers')
  .get(protect, admin, getSubscribers);

router.route('/subscribers/:id')
  .delete(protect, admin, deleteSubscriber);

// Admin routes - Campaigns
router.route('/campaigns')
  .get(protect, admin, getCampaigns)
  .post(protect, admin, createCampaign);

router.route('/campaigns/:id')
  .get(protect, admin, getCampaignById)
  .put(protect, admin, updateCampaign)
  .delete(protect, admin, deleteCampaign);

router.route('/campaigns/:id/send')
  .post(protect, admin, sendCampaign);

// Email stats
router.get('/stats', protect, admin, getEmailStats);

export default router; 