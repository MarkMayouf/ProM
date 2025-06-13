import express from 'express';
const router = express.Router();
import {
  addOrderItems,
  getMyOrders,
  getOrderById,
  updateOrderToPaid,
  updateOrderToDelivered,
  getOrders,
  downloadInvoice, // Import downloadInvoice controller
  generateInvoicePdf,
  sendInvoiceEmail,
  updateOrderTracking, // Add this import
  deleteOrder,
  updateOrder,
  refundOrder,
  updateOrderNotes,
  resendOrderConfirmation,
} from '../controllers/orderController.js';
import { protect, admin } from '../middleware/firebaseAuth.js';
import checkObjectId from '../middleware/checkObjectId.js';

router.route('/').post(protect, addOrderItems).get(protect, admin, getOrders);
router.route('/mine').get(protect, getMyOrders);
router.route('/:id').get(protect, checkObjectId, getOrderById).put(protect, admin, checkObjectId, updateOrder).delete(protect, admin, checkObjectId, deleteOrder);
router.route('/:id/pay').put(protect, checkObjectId, updateOrderToPaid);
router.route('/:id/deliver').put(protect, admin, checkObjectId, updateOrderToDelivered);
router.route('/:id/invoice').get(protect, checkObjectId, downloadInvoice);
router.route('/:id/generate-invoice').get(protect, checkObjectId, generateInvoicePdf);
router.route('/:id/send-invoice').post(protect, checkObjectId, sendInvoiceEmail);
router.route('/:id/tracking').put(protect, admin, checkObjectId, updateOrderTracking);
router.route('/:id/refund').put(protect, admin, checkObjectId, refundOrder);
router.route('/:id/notes').put(protect, admin, checkObjectId, updateOrderNotes);
router.route('/:id/resend-confirmation').post(protect, admin, checkObjectId, resendOrderConfirmation);

export default router;
