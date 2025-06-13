import mongoose from 'mongoose';

const subscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    firstName: {
      type: String,
      trim: true,
      default: ''
    },
    lastName: {
      type: String,
      trim: true,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true
    },
    unsubscribedAt: {
      type: Date,
      default: null
    },
    preferences: {
      promotions: {
        type: Boolean,
        default: true
      },
      newsletter: {
        type: Boolean,
        default: true
      },
      productUpdates: {
        type: Boolean,
        default: true
      }
    },
    source: {
      type: String,
      enum: ['website', 'checkout', 'manual', 'import', 'other'],
      default: 'website'
    },
    tags: [String],
    lastEmailSentAt: {
      type: Date,
      default: null
    },
    emailsSent: {
      type: Number,
      default: 0
    },
    emailsOpened: {
      type: Number,
      default: 0
    },
    emailsClicked: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Create indexes for better performance
subscriberSchema.index({ isActive: 1 });
subscriberSchema.index({ tags: 1 });

const Subscriber = mongoose.model('Subscriber', subscriberSchema);

export default Subscriber; 