import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
const initializeFirebase = () => {
  if (!admin.apps.length) {
    try {
      // Check if we have service account key
      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        // Production: Use service account key from environment variable
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: process.env.FIREBASE_PROJECT_ID
        });
        console.log('Firebase Admin initialized with service account');
      } else if (process.env.FIREBASE_PROJECT_ID) {
        // Development: Use project ID only (requires default credentials or emulator)
        admin.initializeApp({
          projectId: process.env.FIREBASE_PROJECT_ID
        });
        console.log('Firebase Admin initialized with project ID:', process.env.FIREBASE_PROJECT_ID);
      } else {
        // Fallback: Use demo project for development
        console.warn('No Firebase project ID found, using demo project');
        admin.initializeApp({
          projectId: 'demo-project'
        });
      }
      
      console.log('✅ Firebase Admin initialized successfully');
    } catch (error) {
      console.error('❌ Firebase Admin initialization error:', error.message);
      // Don't throw error in development, just log it
      if (process.env.NODE_ENV === 'production') {
        throw error;
      }
    }
  }
  return admin;
};

// Verify Firebase ID token
export const verifyFirebaseToken = async (idToken) => {
  try {
    const firebase = initializeFirebase();
    
    // Check if Firebase is properly initialized
    if (!firebase || !firebase.auth) {
      throw new Error('Firebase Admin not properly initialized');
    }
    
    const decodedToken = await firebase.auth().verifyIdToken(idToken);
    console.log('✅ Token verified for user:', decodedToken.email);
    
    return {
      success: true,
      user: decodedToken
    };
  } catch (error) {
    console.error('❌ Token verification failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get user by UID
export const getFirebaseUser = async (uid) => {
  try {
    const firebase = initializeFirebase();
    const userRecord = await firebase.auth().getUser(uid);
    return {
      success: true,
      user: userRecord
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

export default initializeFirebase; 