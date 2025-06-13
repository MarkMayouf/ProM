export const addDecimals = (num) => {
  return (Math.round(num * 100) / 100).toFixed(2);
};

// NOTE: the code below has been changed from the course code to fix an issue
// with type coercion of strings to numbers.
// Our addDecimals function expects a number and returns a string, so it is not
// correct to call it passing a string as the argument.

export const updateCart = (state) => {
  // Calculate the items price in whole number (pennies) to avoid issues with
  // floating point number calculations
  const itemsPrice = state.cartItems.reduce(
    (acc, item) => {
      const itemTotal = item.price * item.qty;
      // Include customization costs from multiple possible sources
      const customizationCost = 
        item.customizations?.totalCost || 
        item.customizations?.customizationPrice || 
        item.tailoringCost || 
        0;
      return acc + itemTotal + customizationCost;
    },
    0
  );
  state.itemsPrice = addDecimals(itemsPrice);

  // Apply coupon discount if there is one
  if (state.coupon) {
    let discount = 0;
    if (state.coupon.discountType === 'percentage') {
      discount = (itemsPrice * state.coupon.discountValue) / 100;
    } else {
      discount = Math.min(state.coupon.discountValue, itemsPrice); // Don't allow negative totals
    }
    
    // Round to 2 decimal places
    discount = Math.round(discount * 100) / 100;
    state.discountAmount = addDecimals(discount);
    state.discountedItemsPrice = addDecimals(itemsPrice - discount);
    
    // Store the applied coupon for order creation
    state.appliedCoupon = {
      ...state.coupon,
      discountAmount: discount
    };
  } else {
    state.discountAmount = addDecimals(0);
    state.discountedItemsPrice = state.itemsPrice;
    state.appliedCoupon = null;
  }

  // Calculate the shipping price based on the discounted items price
  const effectivePrice = state.coupon ? parseFloat(state.discountedItemsPrice) : itemsPrice;
  const shippingPrice = effectivePrice > 100 ? 0 : 10;
  state.shippingPrice = addDecimals(shippingPrice);

  // Calculate the tax price based on the discounted items price
  const taxPrice = 0.15 * effectivePrice;
  state.taxPrice = addDecimals(taxPrice);

  // Calculate the total price
  const totalPrice = effectivePrice + shippingPrice + taxPrice;
  state.totalPrice = addDecimals(totalPrice);

  // Save the cart to localStorage
  localStorage.setItem('cart', JSON.stringify(state));

  return state;
};
