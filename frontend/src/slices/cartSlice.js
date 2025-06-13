import {
  createSlice
} from "@reduxjs/toolkit";
import {
  updateCart
} from "../utils/cartUtils";

// Helper function to safely parse localStorage
const getCartFromStorage = () => {
  try {
    const cartData = localStorage.getItem("cart");
    if (cartData) {
      const parsed = JSON.parse(cartData);
      // Ensure all required fields exist
      return {
        cartItems: parsed.cartItems || [],
        shippingAddress: parsed.shippingAddress || {},
        paymentMethod: parsed.paymentMethod || "PayPal",
        itemsPrice: parsed.itemsPrice || '0.00',
        shippingPrice: parsed.shippingPrice || '0.00',
        taxPrice: parsed.taxPrice || '0.00',
        totalPrice: parsed.totalPrice || '0.00',
        discountAmount: parsed.discountAmount || '0.00',
        discountedItemsPrice: parsed.discountedItemsPrice || '0.00',
        appliedCoupon: parsed.appliedCoupon || null,
        coupon: parsed.coupon || null
      };
    }
  } catch (error) {
    console.error('Error parsing cart from localStorage:', error);
  }
  
  return {
    cartItems: [],
    shippingAddress: {},
    paymentMethod: "PayPal",
    itemsPrice: '0.00',
    shippingPrice: '0.00',
    taxPrice: '0.00',
    totalPrice: '0.00',
    discountAmount: '0.00',
    discountedItemsPrice: '0.00',
    appliedCoupon: null,
    coupon: null
  };
};

const initialState = getCartFromStorage();

// Get recently viewed products from localStorage or initialize empty array
const recentlyViewedFromStorage = (() => {
  try {
    const data = localStorage.getItem("recentlyViewed");
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error parsing recently viewed from localStorage:', error);
    return [];
  }
})();

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    ...initialState,
    recentlyViewed: recentlyViewedFromStorage,
  },
  reducers: {
    addToCart: (state, action) => {
      const item = action.payload;

      // Ensure item has required fields and preserve sale information
      const cartItem = {
        _id: item._id,
        name: item.name,
        image: item.image,
        price: parseFloat(item.price) || 0,
        category: item.category,
        brand: item.brand || 'ProMayouf',
        countInStock: item.countInStock || 10,
        qty: parseInt(item.qty) || 1,
        selectedSize: item.selectedSize || null,
        selectedColor: item.selectedColor || null,
        customizations: item.customizations || undefined, // Use undefined instead of null
        tailoringCost: item.tailoringCost || 0,
        isComboItem: item.isComboItem || false,
        combinationId: item.combinationId || null,
        combinationType: item.combinationType || null,
        product: item.product || item._id,
        // Preserve sale information
        isOnSale: item.isOnSale || false,
        salePrice: item.salePrice || null,
        regularPrice: item.regularPrice || null,
        originalPrice: item.originalPrice || null,
        discountPercentage: item.discountPercentage || 0
      };

      // For combination items, always treat them as separate items
      if (cartItem.isComboItem) {
        // Always add combination items as new items
        state.cartItems = [...state.cartItems, cartItem];
      } else {
        // Regular product logic - check for existing items
        const existItem = state.cartItems.find(
          (x) => x._id === cartItem._id && 
                 (cartItem.selectedSize ? x.selectedSize === cartItem.selectedSize : true) &&
                 !x.isComboItem // Don't match with combo items
        );

        if (existItem) {
          state.cartItems = state.cartItems.map((x) =>
              (x._id === existItem._id && 
               (!cartItem.selectedSize || x.selectedSize === cartItem.selectedSize) &&
               !x.isComboItem) ?
              { 
                ...x, 
                qty: cartItem.qty,
                // Update customizations if provided, otherwise keep existing
                customizations: cartItem.customizations !== undefined ? cartItem.customizations : x.customizations,
                tailoringCost: cartItem.tailoringCost || x.tailoringCost || 0
              } : x // Use the new quantity directly and preserve/update customizations
          );
        } else {
          state.cartItems = [...state.cartItems, cartItem];
        }
      }

      // Preserve sale pricing information for items that are actually on sale
      state.cartItems = state.cartItems.map(item => {
        // Only preserve sale information if the item is actually on sale
        if (item.isOnSale && item.salePrice && item.regularPrice) {
          return {
            ...item,
            price: item.salePrice, // Use sale price for cart calculations
            originalPrice: item.regularPrice, // Keep original price for reference
            discountPercentage: Math.round(((item.regularPrice - item.salePrice) / item.regularPrice) * 100)
          };
        }
        return item;
      });

      return updateCart(state);
    },
    removeFromCart: (state, action) => {
      const { id, size } = action.payload;

      state.cartItems = state.cartItems.filter(
        (x) => !(x._id === id && (!size || x.selectedSize === size))
      );

      return updateCart(state);
    },
    updateCartItemColor: (state, action) => {
      const {
        id,
        size,
        customizations,
        color
      } = action.payload;

      state.cartItems = state.cartItems.map(item => {
        if (item._id === id &&
          (!size || item.selectedSize === size) &&
          (JSON.stringify(item.customizations) === JSON.stringify(customizations))) {
          return {
            ...item,
            selectedColor: color
          };
        }
        return item;
      });

      return updateCart(state);
    },
    updateCartItemCustomizations: (state, action) => {
      const { id, size, customizations, tailoringCost } = action.payload;

      state.cartItems = state.cartItems.map(item => {
        if (item._id === id && (!size || item.selectedSize === size)) {
          return {
            ...item,
            customizations,
            tailoringCost: tailoringCost || 0
          };
        }
        return item;
      });

      return updateCart(state);
    },
    saveShippingAddress: (state, action) => {
      state.shippingAddress = action.payload;
      localStorage.setItem('cart', JSON.stringify(state));
    },
    savePaymentMethod: (state, action) => {
      state.paymentMethod = action.payload;
      localStorage.setItem('cart', JSON.stringify(state));
    },
    clearCartItems: (state, action) => {
      state.cartItems = [];
      state.itemsPrice = '0.00';
      state.shippingPrice = '0.00';
      state.taxPrice = '0.00';
      state.totalPrice = '0.00';
      state.discountAmount = '0.00';
      state.discountedItemsPrice = '0.00';
      state.appliedCoupon = null;
      state.coupon = null;
      localStorage.setItem('cart', JSON.stringify(state));
    },
    applyCoupon: (state, action) => {
      const {
        couponCode: code,
        discountType,
        discountValue,
        minimumPurchaseAmount = 0,
        validUntil: expirationDate,
        isActive = true,
        description = ''
      } = action.payload;

      // Calculate subtotal including customization costs
      const subtotal = state.cartItems.reduce((acc, item) => {
        const itemTotal = item.price * item.qty;
        const customizationCost = item.customizations?.customizationPrice || 0;
        return acc + itemTotal + customizationCost;
      }, 0);

      // Check if coupon is applicable based on minimum purchase
      if (minimumPurchaseAmount && subtotal < minimumPurchaseAmount) {
        // Return state without applying coupon if minimum not met
        return updateCart(state);
      }

      // Check if the coupon is expired or inactive
      if (expirationDate && new Date(expirationDate) < new Date()) {
        // Return state without applying coupon if expired
        return updateCart(state);
      }

      if (isActive === false) {
        // Return state without applying coupon if inactive
        return updateCart(state);
      }

      // Store complete coupon information
      state.coupon = {
        code,
        discountType,
        discountValue,
        minimumPurchaseAmount,
        expirationDate,
        description
      };

      return updateCart(state);
    },
    removeCoupon: (state) => {
      state.coupon = null;
      state.discount = 0;
      return updateCart(state);
    },
    resetCart: (state) => {
      state.cartItems = [];
      state.shippingAddress = {};
      state.paymentMethod = "PayPal";
      state.coupon = null;
      state.discount = 0;
      localStorage.setItem('cart', JSON.stringify(state));
    },
    // Recently viewed products reducers
    addToRecentlyViewed: (state, action) => {
      // Add product to recently viewed, but limited to 5 most recent products
      const product = {
        _id: action.payload._id,
        name: action.payload.name,
        image: action.payload.image,
        price: action.payload.price,
        category: action.payload.category,
        subCategory: action.payload.subCategory,
      };

      // Remove if already exists
      state.recentlyViewed = state.recentlyViewed.filter(p => p._id !== product._id);

      // Add to the beginning of the array
      state.recentlyViewed = [product, ...state.recentlyViewed].slice(0, 5);

      // Store in localStorage
      localStorage.setItem('recentlyViewed', JSON.stringify(state.recentlyViewed));
    },
    clearRecentlyViewed: (state) => {
      state.recentlyViewed = [];
      localStorage.removeItem('recentlyViewed');
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  updateCartItemColor,
  updateCartItemCustomizations,
  saveShippingAddress,
  savePaymentMethod,
  clearCartItems,
  resetCart,
  applyCoupon: applyCouponToCart,
  removeCoupon: clearCouponFromCart,
  addToRecentlyViewed,
  clearRecentlyViewed,
} = cartSlice.actions;

export default cartSlice.reducer;