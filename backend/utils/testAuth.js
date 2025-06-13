import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables from root .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { verifyFirebaseToken } from '../config/firebase.js';
import User from '../models/userModel.js';
import connectDB from '../config/db.js';

// Test function to check Firebase configuration
export const testFirebaseConfig = async () => {
  console.log('🧪 Testing Firebase Configuration...');
  console.log('Environment Variables:');
  console.log('- FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID);
  console.log('- NODE_ENV:', process.env.NODE_ENV);
  console.log('- FIREBASE_SERVICE_ACCOUNT_KEY:', process.env.FIREBASE_SERVICE_ACCOUNT_KEY ? 'SET' : 'NOT SET');
  
  try {
    // Try to initialize Firebase
    const { default: initializeFirebase } = await import('../config/firebase.js');
    const firebase = initializeFirebase();
    
    if (firebase && firebase.auth) {
      console.log('✅ Firebase Admin initialized successfully');
      return true;
    } else {
      console.log('❌ Firebase Admin not properly initialized');
      return false;
    }
  } catch (error) {
    console.error('❌ Firebase initialization error:', error.message);
    return false;
  }
};

// Test function to verify a token
export const testTokenVerification = async (token) => {
  console.log('🧪 Testing Token Verification...');
  
  if (!token) {
    console.log('❌ No token provided');
    return false;
  }
  
  try {
    const result = await verifyFirebaseToken(token);
    
    if (result.success) {
      console.log('✅ Token verified successfully');
      console.log('User info:', {
        uid: result.user.uid,
        email: result.user.email,
        name: result.user.name
      });
      return true;
    } else {
      console.log('❌ Token verification failed:', result.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Token verification error:', error.message);
    return false;
  }
};

// Test function to check user database operations
export const testUserOperations = async () => {
  console.log('🧪 Testing User Database Operations...');
  
  try {
    const userCount = await User.countDocuments();
    console.log(`✅ User collection accessible, found ${userCount} users`);
    
    // Try to find a test user
    const testUser = await User.findOne().limit(1);
    if (testUser) {
      console.log('✅ Sample user found:', {
        id: testUser._id,
        name: testUser.name,
        email: testUser.email,
        isAdmin: testUser.isAdmin
      });
    } else {
      console.log('ℹ️ No users found in database');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Database operation error:', error.message);
    return false;
  }
};

// Run all tests
export const runAllTests = async () => {
  console.log('🚀 Running Authentication System Tests...\n');
  
  // Connect to database first
  try {
    await connectDB();
    console.log('✅ Database connection established');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
  
  const results = {
    firebase: await testFirebaseConfig(),
    database: await testUserOperations()
  };
  
  console.log('\n📊 Test Results:');
  console.log('- Firebase Config:', results.firebase ? '✅ PASS' : '❌ FAIL');
  console.log('- Database Access:', results.database ? '✅ PASS' : '❌ FAIL');
  
  const allPassed = Object.values(results).every(result => result);
  console.log('\n🎯 Overall Status:', allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
  
  return results;
};

// Export for CLI usage
if (process.argv[1] === new URL(import.meta.url).pathname) {
  runAllTests().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('Test runner error:', error);
    process.exit(1);
  });
} 