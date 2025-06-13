import mongoose from "mongoose";

const returnItemSchema = mongoose.Schema({
  orderItem: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Order.orderItems",
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Product",
  },
  name: { type: String, required: true },
  image: { type: String, required: true },
  price: { type: Number, required: true },
  qty: { type: Number, required: true },
  returnQty: { type: Number, required: true },
  selectedSize: { type: String },
  returnReason: {
    type: String,
    required: true,
    enum: [
      'defective',
      'wrong_size',
      'wrong_item',
      'not_as_described',
      'damaged_shipping',
      'quality_issue',
      'changed_mind',
      'duplicate_order',
      'other'
    ],
  },
  condition: {
    type: String,
    required: true,
    enum: ['new', 'like_new', 'good', 'fair', 'poor'],
    default: 'new'
  },
  refundAmount: { type: Number, required: true },
});

const returnSchema = mongoose.Schema(
  {
    returnNumber: {
      type: String,
      required: true,
      unique: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Order",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    returnItems: [returnItemSchema],
    returnReason: {
      type: String,
      required: true,
    },
    detailedReason: {
      type: String,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: [
        'pending',
        'approved',
        'rejected',
        'shipped_back',
        'received',
        'inspecting',
        'approved_refund',
        'refund_processed',
        'completed',
        'cancelled'
      ],
      default: 'pending',
    },
    totalRefundAmount: {
      type: Number,
      required: true,
      default: 0.0,
    },
    returnShippingAddress: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
    },
    returnMethod: {
      type: String,
      enum: ['mail', 'store_return', 'pickup'],
      default: 'mail',
    },
    returnShippingInfo: {
      carrier: {
        type: String,
        enum: ['FedEx', 'UPS', 'USPS', 'DHL'],
      },
      trackingNumber: { type: String },
      shippingLabel: { type: String }, // URL to shipping label
      returnDate: { type: Date },
      estimatedArrival: { type: Date },
    },
    refundInfo: {
      refundMethod: {
        type: String,
        enum: ['original_payment', 'store_credit', 'bank_transfer'],
        default: 'original_payment',
      },
      refundAmount: { type: Number },
      refundDate: { type: Date },
      refundTransactionId: { type: String },
      restockingFee: { type: Number, default: 0 },
      returnShippingCost: { type: Number, default: 0 },
    },
    images: [{
      url: { type: String, required: true },
      description: { type: String },
      uploadedAt: { type: Date, default: Date.now },
    }],
    adminNotes: {
      type: String,
      default: '',
    },
    customerNotes: {
      type: String,
      maxlength: 500,
    },
    priorityLevel: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    statusHistory: [{
      status: {
        type: String,
        required: true,
      },
      date: {
        type: Date,
        default: Date.now,
      },
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      notes: { type: String },
    }],
    qualityCheckResults: {
      checkedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      checkDate: { type: Date },
      overallCondition: {
        type: String,
        enum: ['excellent', 'good', 'acceptable', 'poor', 'damaged'],
      },
      itemChecks: [{
        item: { type: String },
        condition: { type: String },
        notes: { type: String },
      }],
      approved: { type: Boolean },
      finalRefundAmount: { type: Number },
      restockable: { type: Boolean, default: true },
    },
    communication: [{
      type: {
        type: String,
        enum: ['email', 'sms', 'phone', 'internal_note'],
        required: true,
      },
      direction: {
        type: String,
        enum: ['inbound', 'outbound'],
        required: true,
      },
      content: { type: String, required: true },
      sentBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      sentAt: { type: Date, default: Date.now },
      read: { type: Boolean, default: false },
    }],
    isUrgent: {
      type: Boolean,
      default: false,
    },
    tags: [{ type: String }],
    expiresAt: {
      type: Date,
      // 30 days from creation for return window
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to generate return number
returnSchema.pre('save', async function (next) {
  if (!this.returnNumber) {
    const count = await this.constructor.countDocuments();
    this.returnNumber = `RET${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Index for faster queries
returnSchema.index({ status: 1, createdAt: -1 });
returnSchema.index({ user: 1, createdAt: -1 });
returnSchema.index({ order: 1 });
returnSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Return = mongoose.model("Return", returnSchema);

export default Return; 