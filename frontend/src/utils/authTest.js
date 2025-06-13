// Simple auth testing utility
import { registerWithEmailAndPassword, signInWithEmailAndPassword_, signInWithGoogle } from '../services/authService';

export const testEmailRegistration = async () => {
  console.log('🧪 Testing Email Registration...');
  
  const testEmail = `test+${Date.now()}@example.com`;
  const testPassword = 'TestPass123!';
  const testName = 'Test User';
  
  try {
    const result = await registerWithEmailAndPassword(testEmail, testPassword, testName);
    console.log('✅ Email registration test result:', result);
    return result;
  } catch (error) {
    console.error('❌ Email registration test failed:', error);
    return { success: false, error: error.message };
  }
};

export const testEmailLogin = async (email, password) => {
  console.log('🧪 Testing Email Login...');
  
  try {
    const result = await signInWithEmailAndPassword_(email, password);
    console.log('✅ Email login test result:', result);
    return result;
  } catch (error) {
    console.error('❌ Email login test failed:', error);
    return { success: false, error: error.message };
  }
};

export const testGoogleAuth = async () => {
  console.log('🧪 Testing Google Authentication...');
  
  try {
    const result = await signInWithGoogle();
    console.log('✅ Google auth test result:', result);
    return result;
  } catch (error) {
    console.error('❌ Google auth test failed:', error);
    return { success: false, error: error.message };
  }
};

// Add to window for easy testing in browser console
if (typeof window !== 'undefined') {
  window.authTest = {
    testEmailRegistration,
    testEmailLogin,
    testGoogleAuth
  };
  console.log('🔧 Auth testing utilities available at window.authTest');
} 