import express from 'express';
const router = express.Router();
import {
  createReturn,
  getReturns,
  getUserReturns,
  getReturnById,
  updateReturnStatus,
  processReturnRefund,
  addQualityCheck,
  getReturnStats,
  generateShippingLabel,
  downloadShippingLabel
} from '../controllers/returnController.js';
import { protect, admin } from '../middleware/firebaseAuth.js';
import checkObjectId from '../middleware/checkObjectId.js';

// @route   POST /api/returns
// @desc    Create new return request
// @access  Private
router.route('/').post(protect, createReturn);

// @route   GET /api/returns
// @desc    Get all returns (Admin only)
// @access  Private/Admin
router.route('/').get(protect, admin, getReturns);

// @route   GET /api/returns/mine
// @desc    Get user's returns
// @access  Private
router.route('/mine').get(protect, getUserReturns);

// @route   GET /api/returns/stats
// @desc    Get return statistics
// @access  Private/Admin
router.route('/stats').get(protect, admin, getReturnStats);

// @route   GET /api/returns/:id
// @desc    Get return by ID
// @access  Private
router.route('/:id').get(protect, checkObjectId, getReturnById);

// @route   PUT /api/returns/:id/status
// @desc    Update return status
// @access  Private/Admin
router.route('/:id/status').put(protect, admin, checkObjectId, updateReturnStatus);

// @route   PUT /api/returns/:id/refund
// @desc    Process return refund
// @access  Private/Admin
router.route('/:id/refund').put(protect, admin, checkObjectId, processReturnRefund);

// @route   PUT /api/returns/:id/quality-check
// @desc    Add quality check results
// @access  Private/Admin
router.route('/:id/quality-check').put(protect, admin, checkObjectId, addQualityCheck);

// @route   POST /api/returns/:id/generate-shipping-label
// @desc    Generate shipping label for return
// @access  Private/Admin
router.route('/:id/generate-shipping-label').post(protect, admin, checkObjectId, generateShippingLabel);

// @route   GET /api/returns/:id/shipping-label
// @desc    Download shipping label
// @access  Private
router.route('/:id/shipping-label').get(protect, checkObjectId, downloadShippingLabel);

export default router; 