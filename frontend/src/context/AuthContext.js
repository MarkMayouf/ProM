import React, { createContext, useContext, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setCredentials, logout } from '../slices/authSlice';
import { onAuthStateChange } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const dispatch = useDispatch();

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (user) => {
      if (user) {
        // User is signed in
        setCurrentUser(user);
        const token = await user.getIdToken();
        setUserToken(token);
        localStorage.setItem('firebaseToken', token);
        
        // Get custom claims for admin status
        const idTokenResult = await user.getIdTokenResult();
        const isAdmin = idTokenResult.claims.admin || idTokenResult.claims.isAdmin || user.email === 'admin@email.com';
        
        // Sync with Redux store - only if not already set to prevent logout loops
        const currentReduxUser = JSON.parse(localStorage.getItem('userInfo') || 'null');
        if (!currentReduxUser || currentReduxUser._id !== user.uid) {
          dispatch(setCredentials({
            _id: user.uid,
            name: user.displayName || user.email?.split('@')[0] || 'User',
            email: user.email,
            token: token,
            isAdmin: isAdmin
          }));
        }
      } else {
        // User is signed out - only clear if we actually had a user before
        if (currentUser) {
          setCurrentUser(null);
          setUserToken(null);
          localStorage.removeItem('firebaseToken');
          
          // Sync logout with Redux store
          dispatch(logout());
        }
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [dispatch, currentUser]);

  const value = {
    currentUser,
    userToken,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 