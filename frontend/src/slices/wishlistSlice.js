import { createSlice } from '@reduxjs/toolkit';

// Get wishlist from localStorage or initialize empty array with error handling
const getWishlistFromStorage = () => {
  try {
    const wishlistData = localStorage.getItem('wishlistItems');
    if (wishlistData) {
      const parsed = JSON.parse(wishlistData);
      // Ensure it's an array
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (error) {
    console.error('Error parsing wishlist from localStorage:', error);
  }
  return [];
};

const wishlistItemsFromStorage = getWishlistFromStorage();

const initialState = {
  wishlistItems: wishlistItemsFromStorage,
};

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    addToWishlist: (state, action) => {
      const item = action.payload;

      const existItem = state.wishlistItems.find(
        (x) => x._id === item._id
      );

      if (!existItem) {
        const wishlistItem = {
          _id: item._id,
          name: item.name,
          image: item.image,
          price: item.price,
          brand: item.brand || 'ProMayouf',
          category: item.category,
          dateAdded: new Date().toISOString(),
        };
        state.wishlistItems = [...state.wishlistItems, wishlistItem];
      }

      // Save to localStorage with error handling
      try {
        localStorage.setItem('wishlistItems', JSON.stringify(state.wishlistItems));
      } catch (error) {
        console.error('Error saving wishlist to localStorage:', error);
      }
    },
    removeFromWishlist: (state, action) => {
      const id = action.payload;
      state.wishlistItems = state.wishlistItems.filter((x) => x._id !== id);
      
      // Save to localStorage with error handling
      try {
        localStorage.setItem('wishlistItems', JSON.stringify(state.wishlistItems));
      } catch (error) {
        console.error('Error saving wishlist to localStorage:', error);
      }
    },
    clearWishlist: (state) => {
      state.wishlistItems = [];
      
      // Save to localStorage with error handling
      try {
        localStorage.setItem('wishlistItems', JSON.stringify(state.wishlistItems));
      } catch (error) {
        console.error('Error saving wishlist to localStorage:', error);
      }
    },
    toggleWishlistItem: (state, action) => {
      const item = action.payload;
      const existItemIndex = state.wishlistItems.findIndex((x) => x._id === item._id);
      
      if (existItemIndex >= 0) {
        // Remove from wishlist if it already exists
        state.wishlistItems = state.wishlistItems.filter((x) => x._id !== item._id);
      } else {
        // Add to wishlist if it doesn't exist
        const wishlistItem = {
          _id: item._id,
          name: item.name,
          image: item.image,
          price: item.price,
          brand: item.brand || 'ProMayouf',
          category: item.category,
          dateAdded: new Date().toISOString(),
        };
        state.wishlistItems = [...state.wishlistItems, wishlistItem];
      }
      
      // Save to localStorage with error handling
      try {
        localStorage.setItem('wishlistItems', JSON.stringify(state.wishlistItems));
      } catch (error) {
        console.error('Error saving wishlist to localStorage:', error);
      }
    }
  },
});

export const {
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
  toggleWishlistItem,
} = wishlistSlice.actions;

export default wishlistSlice.reducer; 