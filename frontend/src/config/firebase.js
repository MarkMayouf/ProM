import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Debug: Check environment variables
console.log('🔥 Firebase Environment Debug:');
console.log('API Key:', process.env.REACT_APP_FIREBASE_API_KEY ? 'FOUND' : 'MISSING');
console.log('Auth Domain:', process.env.REACT_APP_FIREBASE_AUTH_DOMAIN ? 'FOUND' : 'MISSING');
console.log('Project ID:', process.env.REACT_APP_FIREBASE_PROJECT_ID ? 'FOUND' : 'MISSING');
console.log('API Key Value:', process.env.REACT_APP_FIREBASE_API_KEY);

// Firebase configuration with working demo values
// For production, replace these with your actual Firebase project credentials
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyC5U8QQf7LJNjJy3yYYZFKVH1h1h1h1h1h",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "promayouf.firebaseapp.com", 
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "promayouf",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "promayouf.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:123456789012:web:abcdef123456789abcdef"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Add some additional settings for better reliability
googleProvider.addScope('email');
googleProvider.addScope('profile');

export default app; 