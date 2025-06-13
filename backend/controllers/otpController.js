import asyncHandler from '../middleware/asyncHandler.js';
import User from '../models/userModel.js';
import { 
  sendEmailVerification,
  sendPhoneVerification,
  sendPasswordResetEmail,
  validateEmail,
  validatePhoneNumber,
  formatPhoneNumber
} from '../utils/otpService.js';

// @desc    Send email verification
// @route   POST /api/otp/send-email-verification
// @access  Public
const sendEmailVerificationOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Email is required');
  }

  if (!validateEmail(email)) {
    res.status(400);
    throw new Error('Please provide a valid email address');
  }

  // Find user by email
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    res.status(404);
    throw new Error('User not found with this email address');
  }

  if (user.isVerified) {
    res.status(400);
    throw new Error('Email is already verified');
  }

  try {
    const result = await sendEmailVerification(email);
    
    if (!result.success) {
      res.status(500);
      throw new Error(`Failed to send verification email: ${result.error}`);
    }

    res.status(200).json({
      success: true,
      message: 'Verification email sent successfully'
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500);
    throw new Error('Failed to send verification email');
  }
});

// @desc    Send phone verification
// @route   POST /api/otp/send-phone-verification
// @access  Private
const sendPhoneVerificationOTP = asyncHandler(async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    res.status(400);
    throw new Error('Phone number is required');
  }

  const formattedPhone = formatPhoneNumber(phone);
  if (!validatePhoneNumber(formattedPhone)) {
    res.status(400);
    throw new Error('Please provide a valid phone number');
  }

  try {
    const result = await sendPhoneVerification(formattedPhone);
    
    if (!result.success) {
      res.status(500);
      throw new Error(`Failed to send verification code: ${result.error}`);
    }

    res.status(200).json({
      success: true,
      message: 'Verification code sent successfully'
    });
  } catch (error) {
    console.error('Phone verification error:', error);
    res.status(500);
    throw new Error('Failed to send verification code');
  }
});

// @desc    Send password reset email
// @route   POST /api/otp/forgot-password
// @access  Public
const sendPasswordResetOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Email is required');
  }

  if (!validateEmail(email)) {
    res.status(400);
    throw new Error('Please provide a valid email address');
  }

  try {
    const result = await sendPasswordResetEmail(email);
    
    if (!result.success) {
      res.status(500);
      throw new Error(`Failed to send password reset email: ${result.error}`);
    }

    res.status(200).json({
      success: true,
      message: 'Password reset email sent successfully'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500);
    throw new Error('Failed to send password reset email');
  }
});

export {
  sendEmailVerificationOTP,
  sendPhoneVerificationOTP,
  sendPasswordResetOTP
}; 