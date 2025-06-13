import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
  onAuthStateChanged,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  linkWithCredential,
  signInWithCredential
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return {
      success: true,
      user: result.user,
      token: await result.user.getIdToken()
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

// Register with email and password
export const registerWithEmailAndPassword = async (email, password, name) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update user profile with name
    await updateProfile(result.user, {
      displayName: name
    });
    
    return {
      success: true,
      user: result.user,
      token: await result.user.getIdToken()
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

// Sign in with email and password
export const signInWithEmailAndPassword_ = async (email, password) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return {
      success: true,
      user: result.user,
      token: await result.user.getIdToken()
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

// Sign out
export const signOutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

// Reset password
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

// Auth state observer
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// Get current user token
export const getCurrentUserToken = async () => {
  if (auth.currentUser) {
    return await auth.currentUser.getIdToken();
  }
  return null;
};

// Phone verification
export const setupPhoneVerification = (elementId) => {
  try {
    console.log('🔧 Setting up phone verification for element:', elementId);
    
    // Clear any existing reCAPTCHA instance
    const existingVerifier = window.recaptchaVerifier;
    if (existingVerifier) {
      console.log('🧹 Clearing existing ReCAPTCHA verifier');
      existingVerifier.clear();
      window.recaptchaVerifier = null;
    }
    
    // Check if element exists
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`ReCAPTCHA container element '${elementId}' not found in DOM`);
    }
    
    console.log('✅ ReCAPTCHA container element found, creating verifier...');
    
    const recaptchaVerifier = new RecaptchaVerifier(auth, elementId, {
      size: 'normal',
      callback: (response) => {
        console.log('✅ ReCAPTCHA verified successfully:', response);
      },
      'expired-callback': () => {
        console.log('⚠️ ReCAPTCHA expired, user needs to complete it again');
      },
      'error-callback': (error) => {
        console.error('❌ ReCAPTCHA error:', error);
      }
    });
    
    // Store verifier globally for cleanup
    window.recaptchaVerifier = recaptchaVerifier;
    console.log('🎉 ReCAPTCHA verifier created successfully');
    
    return recaptchaVerifier;
  } catch (error) {
    console.error('❌ Error setting up phone verification:', error);
    throw error;
  }
};

// Send phone verification code
export const sendPhoneVerificationCode = async (phoneNumber, recaptchaVerifier) => {
  try {
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
    return {
      success: true,
      verificationId: confirmationResult.verificationId
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

// Verify phone code
export const verifyPhoneCode = async (verificationId, code) => {
  try {
    const credential = PhoneAuthProvider.credential(verificationId, code);
    return {
      success: true,
      credential
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

// Link phone credential with current user
export const linkPhoneCredential = async (user, credential) => {
  try {
    const result = await linkWithCredential(user, credential);
    return {
      success: true,
      user: result.user
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

// Send email verification
export const sendEmailVerification_ = async (user) => {
  try {
    await sendEmailVerification(user);
    return {
      success: true,
      message: 'Verification email sent'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

// Register with phone number only
export const registerWithPhoneNumber = async (phoneNumber, verificationCode, name) => {
  try {
    // First, verify the phone number and create the user
    const credential = PhoneAuthProvider.credential(verificationCode.verificationId, verificationCode.code);
    const result = await signInWithCredential(auth, credential);
    
    // Update user profile with name
    await updateProfile(result.user, {
      displayName: name
    });
    
    return {
      success: true,
      user: result.user,
      token: await result.user.getIdToken()
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

// Register with email only (with email verification)
export const registerWithEmailOnly = async (email, password, name) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update user profile with name
    await updateProfile(result.user, {
      displayName: name
    });
    
    // Send email verification
    await sendEmailVerification(result.user);
    
    // Sign out user after registration to force verification
    await signOut(auth);
    
    return {
      success: true,
      user: result.user,
      requiresVerification: true,
      message: 'Registration successful. Please verify your email before signing in.'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

// Send verification email to backend for custom handling
export const sendCustomEmailVerification = async (email, name, verificationCode) => {
  try {
    const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/auth/send-verification-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        name,
        verificationCode
      }),
    });

    const result = await response.json();

    if (response.ok) {
      return {
        success: true,
        message: result.message
      };
    } else {
      throw new Error(result.message || 'Failed to send verification email');
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}; 