import { verifyFirebaseToken } from '../config/firebase.js';
import asyncHandler from './asyncHandler.js';
import User from '../models/userModel.js';

// Protect routes - Firebase token verification
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Get token from header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify Firebase token
      const result = await verifyFirebaseToken(token);
      
      if (!result.success) {
        console.error('Firebase token verification failed:', result.error);
        
        // In development, if Firebase is not configured, we can try basic JWT verification
        if (process.env.NODE_ENV === 'development' && result.error.includes('Firebase Admin not properly initialized')) {
          console.warn('⚠️ Firebase not configured, skipping token verification for development');
          // For development only - extract basic user info from token
          try {
            const base64Payload = token.split('.')[1];
            const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString());
            
            if (payload.email) {
              // Find user by email for development
              let user = await User.findOne({ email: payload.email });
              if (user) {
                req.user = {
                  _id: user._id,
                  firebaseUid: payload.sub || user.firebaseUid,
                  name: user.name,
                  email: user.email,
                  isAdmin: user.isAdmin || payload.email === 'admin@email.com',
                  isVerified: user.isVerified
                };
                console.log('🔧 Development mode: Using local user data for', payload.email);
                return next();
              }
            }
          } catch (devError) {
            console.error('Development fallback failed:', devError.message);
          }
        }
        
        res.status(401);
        throw new Error('Not authorized, token failed');
      }

      // Get user info from Firebase token
      const firebaseUser = result.user;
      
      // Special handling for admin@email.com to prevent duplicate key errors
      if (firebaseUser.email === 'admin@email.com') {
        let user = await User.findOne({ email: 'admin@email.com' });
        
        if (user) {
          // Update firebaseUid if not set
          if (!user.firebaseUid) {
            try {
              user.firebaseUid = firebaseUser.uid;
              user.isAdmin = true; // Ensure admin status
              await user.save();
            } catch (error) {
              // Ignore duplicate key errors for admin user
              console.log('Admin user firebaseUid update failed (likely already set):', error.message);
            }
          }
          
          // Set admin user in request
          req.user = {
            _id: user._id,
            firebaseUid: user.firebaseUid || firebaseUser.uid,
            name: user.name,
            email: user.email,
            isAdmin: true, // Force admin status for admin@email.com
            isVerified: user.isVerified
          };
          
          return next();
        }
      }
      
      // Find or create user in our database (for non-admin users)
      let user = await User.findOne({ firebaseUid: firebaseUser.uid });
      
      if (!user) {
        // Try to find user by email first (in case user exists but doesn't have firebaseUid)
        user = await User.findOne({ email: firebaseUser.email });
        
        if (user) {
          // User exists but doesn't have firebaseUid, update it
          if (!user.firebaseUid) {
            try {
              user.firebaseUid = firebaseUser.uid;
              if (firebaseUser.name && !user.name) {
                user.name = firebaseUser.name;
              }
              user.isVerified = firebaseUser.email_verified || user.isVerified;
              await user.save();
            } catch (error) {
              if (error.code === 11000) {
                console.log('Duplicate key error updating existing user - continuing with found user');
              } else {
                throw error;
              }
            }
          }
        } else {
          // Create new user if doesn't exist
          try {
            user = await User.create({
              firebaseUid: firebaseUser.uid,
              name: firebaseUser.name || firebaseUser.email?.split('@')[0] || 'User',
              email: firebaseUser.email,
              isVerified: firebaseUser.email_verified || false
            });
          } catch (error) {
            if (error.code === 11000) {
              // Duplicate key error, try to find the user again
              console.log('Duplicate key error during user creation, searching for existing user...');
              user = await User.findOne({ email: firebaseUser.email });
              if (!user) {
                // Try finding by firebaseUid as well
                user = await User.findOne({ firebaseUid: firebaseUser.uid });
              }
              if (!user) {
                console.error('Duplicate key error but user not found:', error.message);
                throw new Error('User creation failed - duplicate email but user not found');
              } else {
                console.log('Found existing user after duplicate key error');
              }
            } else {
              console.error('Error creating user:', error.message);
              throw error;
            }
          }
        }
      }

      // Ensure user exists at this point
      if (!user) {
        // Last resort - try to find by email one more time
        console.log('User still null, attempting final lookup by email...');
        user = await User.findOne({ email: firebaseUser.email });
        if (!user) {
          console.error('User not found after all attempts:', firebaseUser.email);
          throw new Error('User not found and could not be created');
        } else {
          console.log('Found user in final lookup:', user.email);
        }
      }

      // Set user in request - check Firebase custom claims for admin status
      const isAdmin = firebaseUser.admin || firebaseUser.isAdmin || user.isAdmin || firebaseUser.email === 'admin@email.com';
      
      req.user = {
        _id: user._id,
        firebaseUid: firebaseUser.uid,
        name: user.name,
        email: user.email,
        isAdmin: isAdmin,
        isVerified: user.isVerified
      };

      next();
    } catch (error) {
      console.error('Token verification error:', error);
      
      // Special handling for database errors - don't return 401 for these
      if (error.code === 11000 || error.message.includes('duplicate key') || error.message.includes('E11000')) {
        console.log('Database duplicate key error - attempting recovery...');
        try {
          // Try to verify token and find user one more time
          const firebaseTokenResult = await verifyFirebaseToken(token);
          if (firebaseTokenResult.success) {
            const firebaseUser = firebaseTokenResult.user;
            let user = await User.findOne({ email: firebaseUser.email });
            
            if (!user) {
              user = await User.findOne({ firebaseUid: firebaseUser.uid });
            }
            
            if (user) {
              console.log('Successfully recovered user after duplicate key error');
              req.user = {
                _id: user._id,
                firebaseUid: firebaseUser.uid,
                name: user.name,
                email: user.email,
                isAdmin: user.isAdmin || firebaseUser.email === 'admin@email.com',
                isVerified: user.isVerified
              };
              return next();
            }
          }
          console.log('Recovery attempt failed - continuing with 401');
        } catch (retryError) {
          console.error('Recovery failed:', retryError.message);
        }
      }
      
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

// Admin middleware
const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(401);
    throw new Error('Not authorized as an admin');
  }
};

export { protect, admin }; 