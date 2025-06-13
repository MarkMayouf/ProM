import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    description: {
      type: String,
      required: false, // Optional description for admin reference
    },
    discountType: {
      type: String,
      required: true,
      enum: ["percentage", "fixed_amount"], // Type of discount
    },
    discountValue: {
      type: Number,
      required: true, // Value of the discount (e.g., 10 for 10% or 10 for $10)
    },
    minimumPurchaseAmount: {
      type: Number,
      required: false, // Minimum cart total for the coupon to be applicable
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true, // To enable/disable the coupon
    },
    validFrom: {
      type: Date,
      required: true,
      default: Date.now, // Coupon validity start date
    },
    validUntil: {
      type: Date,
      required: true, // Coupon expiry date
    },
    usageLimitPerCoupon: {
      type: Number,
      required: false, // How many times this coupon can be used in total (e.g., 100 times)
      default: null, // null means unlimited
    },
    usageLimitPerUser: {
      type: Number,
      required: false, // How many times a single user can use this coupon (e.g., 1 time)
      default: 1, // Default to once per user, null for unlimited for a user
    },
    timesUsed: {
      type: Number,
      default: 0, // How many times this coupon has been used
    },
    isPromoCode: {
      type: Boolean,
      default: false, // To distinguish between regular coupons and promo codes
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    // To track which users have used this coupon and how many times (if usageLimitPerUser is set)
    // This could be an array of objects like { userId: ObjectId, timesUsed: Number }
    // For simplicity in this initial model, we'll rely on a separate tracking mechanism or enhance later if needed.
    // For now, `timesUsed` tracks total uses. User-specific tracking might be in the Order model or a separate CouponUsage model.

    // Future enhancements could include:
    // - applicableToProducts: [mongoose.Schema.Types.ObjectId], // Specific products coupon applies to
    // - applicableToCategories: [String], // Specific categories coupon applies to
    // - excludedProducts: [mongoose.Schema.Types.ObjectId],
    // - excludedCategories: [String],
  },
  {
    timestamps: true,
  }
);

// Method to check if coupon is currently valid (date range and active status)
couponSchema.methods.isValid = function () {
  const now = new Date();
  return (
    this.isActive &&
    this.validFrom <= now &&
    this.validUntil >= now &&
    (this.usageLimitPerCoupon === null || this.timesUsed < this.usageLimitPerCoupon)
  );
};

// Method to increment usage count
couponSchema.methods.incrementUsage = async function () {
  this.timesUsed += 1;
  return this.save();
};

const Coupon = mongoose.model("Coupon", couponSchema);

export default Coupon;

