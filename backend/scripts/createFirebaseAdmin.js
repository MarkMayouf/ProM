import admin from 'firebase-admin';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'demo-project'
    });
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Firebase Admin initialization error:', error.message);
    process.exit(1);
  }
}

const createFirebaseAdmin = async () => {
  try {
    const adminEmail = 'admin@email.com';
    const adminPassword = '123456';
    
    console.log('🔧 Creating Firebase admin user...');
    
    // Create the user
    let userRecord;
    try {
      // Try to get existing user first
      userRecord = await admin.auth().getUserByEmail(adminEmail);
      console.log('✅ Admin user already exists in Firebase');
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // User doesn't exist, create them
        userRecord = await admin.auth().createUser({
          email: adminEmail,
          password: adminPassword,
          displayName: 'Admin User',
          emailVerified: true
        });
        console.log('✅ Admin user created in Firebase');
      } else {
        throw error;
      }
    }
    
    // Set custom claims to make them admin
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      admin: true,
      isAdmin: true
    });
    
    console.log('✅ Admin custom claims set');
    console.log('');
    console.log('🎯 Firebase Admin User Details:');
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🔑 Password: ${adminPassword}`);
    console.log(`👑 UID: ${userRecord.uid}`);
    console.log(`🔐 Admin Status: true`);
    console.log('');
    console.log('🎉 You can now login with these credentials!');
    console.log('💡 The user will have admin privileges in your application.');
    
  } catch (error) {
    console.error('❌ Error creating Firebase admin:', error.message);
  } finally {
    process.exit();
  }
};

createFirebaseAdmin(); 