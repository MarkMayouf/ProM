import { configureStore } from "@reduxjs/toolkit";
import { apiSlice } from "./slices/apiSlice";
import cartSliceReducer from "./slices/cartSlice";
import authSliceReducer from "./slices/authSlice"; // Assuming you have this for user auth
import wishlistSliceReducer from "./slices/wishlistSlice";
import Cookies from "js-cookie";

// Helper function to save cart to cookies
const saveCartToCookies = (state) => {
  const { cart } = state;
  
  // Save cart items to cookies with 7-day expiry
  Cookies.set('cartItems', JSON.stringify(cart.cartItems), { expires: 7 });
  Cookies.set('shippingAddress', JSON.stringify(cart.shippingAddress), { expires: 7 });
  Cookies.set('paymentMethod', cart.paymentMethod, { expires: 7 });
  
  // Also persist to localStorage as backup
  localStorage.setItem('cart', JSON.stringify(cart));
};

// Create middleware to save cart state to cookies
const cartMiddleware = (store) => (next) => (action) => {
  const result = next(action);
  
  // Check if the action is from the cart slice
  if (action.type.startsWith('cart/')) {
    saveCartToCookies(store.getState());
    
    // If the action is clearCartItems, also clear cookies
    if (action.type === 'cart/clearCartItems') {
      Cookies.remove('cartItems');
      Cookies.remove('shippingAddress');
      Cookies.remove('paymentMethod');
    }
  }
  
  return result;
};

const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    cart: cartSliceReducer,
    auth: authSliceReducer,
    wishlist: wishlistSliceReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware, cartMiddleware),
  devTools: true,
});

// Initialize cart from cookies if available
const initializeCart = () => {
  const cartItems = Cookies.get('cartItems');
  const shippingAddress = Cookies.get('shippingAddress');
  const paymentMethod = Cookies.get('paymentMethod');
  
  if (cartItems || shippingAddress || paymentMethod) {
    const initialCart = {
      cartItems: cartItems ? JSON.parse(cartItems) : [],
      shippingAddress: shippingAddress ? JSON.parse(shippingAddress) : {},
      paymentMethod: paymentMethod || 'PayPal',
    };
    
    // Combine with any existing localStorage data
    const localStorageCart = localStorage.getItem('cart') 
      ? JSON.parse(localStorage.getItem('cart')) 
      : {};
    
    // Update localStorage with merged data
    const mergedCart = { ...localStorageCart, ...initialCart };
    localStorage.setItem('cart', JSON.stringify(mergedCart));
  }
};

// Initialize cart on store creation
initializeCart();

export default store;
