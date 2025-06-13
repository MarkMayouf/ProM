// Token cleanup utility to fix malformed JWT tokens
export const cleanupTokens = () => {
  try {
    // Clear all authentication related data from localStorage
    localStorage.removeItem('userInfo');
    localStorage.removeItem('token');
    localStorage.removeItem('jwt');
    
    // Clear any other auth-related items
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.includes('auth') || key.includes('token') || key.includes('jwt')) {
        localStorage.removeItem(key);
      }
    });
    
    console.log('✅ Token cleanup completed');
    return true;
  } catch (error) {
    console.error('❌ Error during token cleanup:', error);
    return false;
  }
};

// Check if token is valid format
export const isValidJWT = (token) => {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  return parts.length === 3;
};

// Validate userInfo object and token
export const validateUserInfo = (userInfo) => {
  if (!userInfo || typeof userInfo !== 'object') return false;
  if (!userInfo.token) return false;
  return isValidJWT(userInfo.token);
}; 