import { fetchBaseQuery, createApi } from '@reduxjs/toolkit/query/react';
import { BASE_URL } from '../constants';
import { logout } from './authSlice';
import { getCurrentUserToken } from '../services/authService';

// NOTE: code here has changed to handle when our JWT and Cookie expire.
// We need to customize the baseQuery to be able to intercept any 401 responses
// and log the user out
// https://redux-toolkit.js.org/rtk-query/usage/customizing-queries#customizing-queries-with-basequery

// Updated base query to handle Firebase authentication
const baseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  credentials: 'include',
  prepareHeaders: async (headers, { getState }) => {
    // Try to get Firebase token first (preferred)
    let token = await getCurrentUserToken();
    
    // Fallback to Redux token if Firebase token not available
    if (!token) {
      token = getState().auth.userInfo?.token;
    }
    
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    
    return headers;
  },
});

// Create a custom base query that handles errors
const baseQueryWithAuth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  // Handle 401 errors - user is not authenticated
  if (result?.error?.status === 401) {
    console.log('401 error - logging out user');
    api.dispatch(logout());
  }

  return result;
};

export const apiSlice = createApi({
  baseQuery: baseQueryWithAuth,
  tagTypes: ['Product', 'Order', 'User', 'Coupon', 'WebsiteContent', 'Templates'],
  endpoints: (builder) => ({}),
});
