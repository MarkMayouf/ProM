import asyncHandler from "../middleware/asyncHandler.js";
import Coupon from "../models/couponModel.js";
import Order from "../models/orderModel.js"; // May be needed for user-specific coupon usage checks later

// @desc    Apply a coupon to a cart (validate and calculate discount)
// @route   POST /api/coupons/apply
// @access  Public
const applyCoupon = asyncHandler(async (req, res) => {
  const { couponCode, cartTotal } = req.body;

  if (!couponCode || typeof cartTotal === "undefined") {
    res.status(400);
    throw new Error("Coupon code and cart total are required.");
  }

  const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });

  if (!coupon) {
    res.status(404);
    throw new Error("Coupon not found. Please check the code and try again.");
  }

  // Check if coupon is valid using the model method
  if (!coupon.isValid()) {
    let reason = "Coupon is not valid.";
    
    if (!coupon.isActive) {
      reason = "This coupon is currently inactive.";
    } else if (coupon.validFrom > new Date()) {
      reason = `This coupon is not valid yet. It becomes active on ${new Date(coupon.validFrom).toLocaleDateString()}.`;
    } else if (coupon.validUntil < new Date()) {
      reason = `This coupon has expired on ${new Date(coupon.validUntil).toLocaleDateString()}.`;
    } else if (coupon.usageLimitPerCoupon !== null && coupon.timesUsed >= coupon.usageLimitPerCoupon) {
      reason = "This coupon has reached its usage limit.";
    }
    
    res.status(400);
    throw new Error(reason);
  }

  // Check minimum purchase amount
  if (cartTotal < coupon.minimumPurchaseAmount) {
    res.status(400);
    throw new Error(`Minimum purchase amount of $${coupon.minimumPurchaseAmount.toFixed(2)} not met. Add more items to your cart.`);
  }

  // Check user-specific usage limit if user is logged in
  if (req.user && coupon.usageLimitPerUser !== null) {
    const userOrders = await Order.find({
      user: req.user._id,
      'appliedCoupon.code': coupon.code,
      isPaid: true // Only count paid orders
    });
    
    if (userOrders.length >= coupon.usageLimitPerUser) {
      res.status(400);
      throw new Error(`You've already used this coupon ${coupon.usageLimitPerUser} time(s), which is the maximum allowed per user.`);
    }
  }

  // Calculate discount amount
  let discountAmount = 0;
  if (coupon.discountType === "percentage") {
    discountAmount = (cartTotal * coupon.discountValue) / 100;
  } else if (coupon.discountType === "fixed_amount") {
    discountAmount = Math.min(coupon.discountValue, cartTotal); // Don't allow negative totals
  }

  // Round to 2 decimal places to avoid floating point issues
  discountAmount = Math.round(discountAmount * 100) / 100;
  const newTotal = Math.round((cartTotal - discountAmount) * 100) / 100;

  res.status(200).json({
    message: "Coupon applied successfully!",
    couponCode: coupon.code,
    discountAmount,
    newTotal,
    originalTotal: cartTotal,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    description: coupon.description || '',
    validUntil: coupon.validUntil,
    minimumPurchaseAmount: coupon.minimumPurchaseAmount,
  });
});

// @desc    Create a new coupon
// @route   POST /api/coupons
// @access  Private/Admin
const createCoupon = asyncHandler(async (req, res) => {
  const {
    code,
    description,
    discountType,
    discountValue,
    minimumPurchaseAmount,
    isActive,
    validFrom,
    validUntil,
    usageLimitPerCoupon,
    usageLimitPerUser,
    isPromoCode,
  } = req.body;

  // Validate required fields
  if (!code || !discountType || !discountValue || !validFrom || !validUntil) {
    res.status(400);
    throw new Error("Please provide all required fields: code, discount type, discount value, valid from, and valid until dates.");
  }

  // Check if coupon code already exists
  const couponExists = await Coupon.findOne({ code: code.toUpperCase() });
  if (couponExists) {
    res.status(400);
    throw new Error("Coupon code already exists. Please use a different code.");
  }

  // Validate dates
  const fromDate = new Date(validFrom);
  const untilDate = new Date(validUntil);
  
  if (fromDate > untilDate) {
    res.status(400);
    throw new Error("Valid from date cannot be after valid until date.");
  }

  // Create coupon object
  const coupon = new Coupon({
    code: code.toUpperCase(),
    description,
    discountType,
    discountValue,
    minimumPurchaseAmount: minimumPurchaseAmount || 0,
    isActive: isActive !== undefined ? isActive : true,
    validFrom: fromDate,
    validUntil: untilDate,
    usageLimitPerCoupon,
    usageLimitPerUser,
    isPromoCode: isPromoCode || false,
  });

  const createdCoupon = await coupon.save();
  res.status(201).json(createdCoupon);
});

// @desc    Get all coupons
// @route   GET /api/coupons
// @access  Private/Admin
const getCoupons = asyncHandler(async (req, res) => {
  const { type } = req.query;
  
  // Build filter based on query params
  const filter = {};
  
  // If type=promo is specified, filter to only show promo codes
  if (type === 'promo') {
    filter.isPromoCode = true;
  } else if (type === 'coupon') {
    filter.isPromoCode = { $ne: true }; // Show only regular coupons
  }
  
  const coupons = await Coupon.find(filter).sort({ createdAt: -1 });
  res.json(coupons);
});

// @desc    Get coupon by ID
// @route   GET /api/coupons/:id
// @access  Private/Admin
const getCouponById = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (coupon) {
    res.json(coupon);
  } else {
    res.status(404);
    throw new Error("Coupon not found");
  }
});

// @desc    Update a coupon
// @route   PUT /api/coupons/:id
// @access  Private/Admin
const updateCoupon = asyncHandler(async (req, res) => {
  const {
    code,
    description,
    discountType,
    discountValue,
    minimumPurchaseAmount,
    isActive,
    validFrom,
    validUntil,
    usageLimitPerCoupon,
    usageLimitPerUser,
    timesUsed,
    isPromoCode,
  } = req.body;

  const coupon = await Coupon.findById(req.params.id);

  if (coupon) {
    // If code is changing, check that the new code doesn't already exist
    if (code && code.toUpperCase() !== coupon.code) {
      const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
      if (existingCoupon) {
        res.status(400);
        throw new Error("This coupon code is already in use. Please choose a different code.");
      }
    }

    // Validate dates if both are provided
    if (validFrom && validUntil) {
      const fromDate = new Date(validFrom);
      const untilDate = new Date(validUntil);
      
      if (fromDate > untilDate) {
        res.status(400);
        throw new Error("Valid from date cannot be after valid until date.");
      }
    }

    // Update coupon fields
    coupon.code = code ? code.toUpperCase() : coupon.code;
    coupon.description = description !== undefined ? description : coupon.description;
    coupon.discountType = discountType || coupon.discountType;
    coupon.discountValue = discountValue !== undefined ? discountValue : coupon.discountValue;
    coupon.minimumPurchaseAmount = minimumPurchaseAmount !== undefined ? minimumPurchaseAmount : coupon.minimumPurchaseAmount;
    coupon.isActive = isActive !== undefined ? isActive : coupon.isActive;
    coupon.validFrom = validFrom || coupon.validFrom;
    coupon.validUntil = validUntil || coupon.validUntil;
    coupon.usageLimitPerCoupon = usageLimitPerCoupon !== undefined ? usageLimitPerCoupon : coupon.usageLimitPerCoupon;
    coupon.usageLimitPerUser = usageLimitPerUser !== undefined ? usageLimitPerUser : coupon.usageLimitPerUser;
    coupon.timesUsed = timesUsed !== undefined ? timesUsed : coupon.timesUsed; // Allow admin to reset or adjust
    coupon.isPromoCode = isPromoCode !== undefined ? isPromoCode : coupon.isPromoCode;

    const updatedCoupon = await coupon.save();
    res.json(updatedCoupon);
  } else {
    res.status(404);
    throw new Error("Coupon not found");
  }
});

// @desc    Delete a coupon
// @route   DELETE /api/coupons/:id
// @access  Private/Admin
const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);

  if (coupon) {
    await Coupon.deleteOne({ _id: coupon._id });
    res.json({ message: "Coupon removed" });
  } else {
    res.status(404);
    throw new Error("Coupon not found");
  }
});

export {
  applyCoupon,
  createCoupon,
  getCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
};

