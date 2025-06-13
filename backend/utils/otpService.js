import { getAuth } from 'firebase-admin/auth';

// Send email verification
export const sendEmailVerification = async (email) => {
  try {
    const auth = getAuth();
    const user = await auth.getUserByEmail(email);
    await auth.generateEmailVerificationLink(email);
    return { success: true };
  } catch (error) {
    console.error('Email verification error:', error);
    return { success: false, error: error.message };
  }
};

// Send phone verification
export const sendPhoneVerification = async (phoneNumber) => {
  try {
    const auth = getAuth();
    // Firebase handles phone verification through the client SDK
    return { success: true };
  } catch (error) {
    console.error('Phone verification error:', error);
    return { success: false, error: error.message };
  }
};

// Send password reset email
export const sendPasswordResetEmail = async (email) => {
  try {
    const auth = getAuth();
    await auth.generatePasswordResetLink(email);
    return { success: true };
  } catch (error) {
    console.error('Password reset email error:', error);
    return { success: false, error: error.message };
  }
};

// Validate email format
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Validate phone number format
export const validatePhoneNumber = (phone) => {
  const re = /^\+?[1-9]\d{1,14}$/;
  return re.test(phone);
};

// Format phone number to E.164 format
export const formatPhoneNumber = (phone) => {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  // Add + if not present
  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
};

// Check OTP rate limit
export const checkOTPRateLimit = async (user) => {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  
  if (user.lastOTPRequest && (now - user.lastOTPRequest) < oneHour) {
    return false;
  }
  
  return true;
};

export default {
  sendEmailVerification,
  sendPhoneVerification,
  sendPasswordResetEmail,
  validateEmail,
  validatePhoneNumber,
  formatPhoneNumber,
  checkOTPRateLimit
}; 