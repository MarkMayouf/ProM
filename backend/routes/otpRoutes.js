import express from 'express';
import {
  sendEmailVerificationOTP,
  sendPhoneVerificationOTP,
  sendPasswordResetOTP
} from '../controllers/otpController.js';
import { protect } from '../middleware/firebaseAuth.js';

const router = express.Router();

// Email verification routes
router.post('/send-email-verification', sendEmailVerificationOTP);

// Phone verification routes (require authentication)
router.post('/send-phone-verification', protect, sendPhoneVerificationOTP);

// Password reset routes
router.post('/forgot-password', sendPasswordResetOTP);

export default router; 