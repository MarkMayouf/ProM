function addDecimals(num) {
  return (Math.round(num * 100) / 100).toFixed(2);
}

// NOTE: the code below has been changed from the course code to fix an issue
// with type coercion of strings to numbers.
// Our addDecimals function expects a number and returns a string, so it is not
// correct to call it passing a string as the argument.

export const calcPrices = (orderItems, coupon = null) => {
  // Calculate the base items price (before discount)
  const itemsPrice = orderItems.reduce((acc, item) => {
    const itemTotal = item.price * item.qty;
    // Check for customization costs in multiple possible fields
    const customizationCost = 
      item.customizations?.totalCost || 
      item.customizations?.customizationPrice || 
      item.tailoringCost || 
      0;
    return acc + itemTotal + customizationCost;
  }, 0);

  // Apply coupon discount if available
  let discountedItemsPrice = itemsPrice;
  let discountAmount = 0;

  if (coupon) {
    if (coupon.discountType === 'percentage') {
      discountAmount = (itemsPrice * coupon.discountValue) / 100;
    } else {
      discountAmount = Math.min(coupon.discountValue, itemsPrice); // Don't allow negative prices
    }
    discountedItemsPrice = itemsPrice - discountAmount;
  }

  // Calculate shipping (free shipping over $100 after discount)
  const shippingPrice = discountedItemsPrice > 100 ? 0 : 10;

  // Calculate tax on discounted price
  const taxPrice = 0.15 * discountedItemsPrice;

  // Calculate total
  const totalPrice = discountedItemsPrice + shippingPrice + taxPrice;

  // Format all prices to 2 decimal places
  return {
    itemsPrice: Number(itemsPrice.toFixed(2)), // Original price before discount
    discountedItemsPrice: Number(discountedItemsPrice.toFixed(2)),
    discountAmount: Number(discountAmount.toFixed(2)),
    shippingPrice: Number(shippingPrice.toFixed(2)),
    taxPrice: Number(taxPrice.toFixed(2)),
    totalPrice: Number(totalPrice.toFixed(2)),
  };
};
