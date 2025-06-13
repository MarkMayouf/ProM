// Price utility functions to standardize pricing logic across the application

/**
 * Get the current effective price for a product (what customer should pay)
 * @param {Object} product - Product object
 * @returns {number} - Current effective price
 */
export const getCurrentPrice = (product) => {
  if (!product) return 0;
  
  // For sale items, use the current price (which should already be discounted)
  // For non-sale items, use the regular price
  if (product.isOnSale) {
    // Use salePrice if available, otherwise use price (which should be the sale price)
    return product.salePrice || product.price;
  }
  
  return product.price;
};

/**
 * Get the original price (before any discounts)
 * @param {Object} product - Product object
 * @returns {number} - Original price before discount
 */
export const getOriginalPrice = (product) => {
  if (!product) return 0;
  
  // For sale items, regularPrice is the original full price
  if (product.isOnSale && product.regularPrice) {
    return product.regularPrice;
  }
  
  // For non-sale items, price is the original price
  return product.price;
};

/**
 * Calculate discount percentage
 * @param {Object} product - Product object
 * @returns {number} - Discount percentage (0-100)
 */
export const calculateDiscountPercentage = (product) => {
  if (!product || !product.isOnSale) return 0;
  
  const originalPrice = getOriginalPrice(product);
  const currentPrice = getCurrentPrice(product);
  
  if (originalPrice && currentPrice && originalPrice > currentPrice) {
    return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  }
  
  return 0;
};

/**
 * Get the display price info for a product
 * @param {Object} product - Product object
 * @returns {Object} - Price display information
 */
export const getPriceDisplayInfo = (product) => {
  if (!product) {
    return {
      currentPrice: 0,
      originalPrice: 0,
      isOnSale: false,
      discountPercentage: 0,
      savings: 0
    };
  }
  
  const currentPrice = getCurrentPrice(product);
  const originalPrice = getOriginalPrice(product);
  const discountPercentage = calculateDiscountPercentage(product);
  const savings = originalPrice - currentPrice;
  
  return {
    currentPrice,
    originalPrice,
    isOnSale: product.isOnSale || false,
    discountPercentage,
    savings: Math.max(0, savings)
  };
};

/**
 * Format a price for display
 * @param {number} price - Price to format
 * @returns {string} - Formatted price string
 */
export const formatPrice = (price) => {
  if (typeof price !== 'number' || isNaN(price)) return '$0.00';
  return `$${price.toFixed(2)}`;
};

/**
 * Prepare product data for cart with correct pricing
 * @param {Object} product - Product object
 * @param {Object} options - Additional options (qty, selectedSize, etc.)
 * @returns {Object} - Cart-ready product data
 */
export const prepareProductForCart = (product, options = {}) => {
  const priceInfo = getPriceDisplayInfo(product);
  
  return {
    ...product,
    price: priceInfo.currentPrice, // Always use the current effective price for cart
    originalPrice: priceInfo.originalPrice, // Keep for reference
    isOnSale: priceInfo.isOnSale,
    discountPercentage: priceInfo.discountPercentage,
    savings: priceInfo.savings,
    ...options
  };
}; 