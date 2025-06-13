import mongoose from 'mongoose';

const emailCampaignSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: true,
      trim: true
    },
    content: {
      type: String,
      required: true
    },
    targetAudience: {
      type: String,
      enum: ['all', 'newsletter', 'promotions', 'productUpdates', 'custom'],
      default: 'all'
    },
    customTargeting: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    scheduledFor: {
      type: Date,
      default: null
    },
    isSent: {
      type: Boolean,
      default: false
    },
    sentAt: {
      type: Date,
      default: null
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    stats: {
      totalSent: {
        type: Number,
        default: 0
      },
      totalFailed: {
        type: Number,
        default: 0
      },
      openCount: {
        type: Number,
        default: 0
      },
      clickCount: {
        type: Number,
        default: 0
      },
      unsubscribeCount: {
        type: Number,
        default: 0
      },
      openRate: {
        type: Number,
        default: 0,
        get: function() {
          return this.stats.totalSent > 0 
            ? (this.stats.openCount / this.stats.totalSent * 100).toFixed(2) 
            : 0;
        },
        set: function(v) {
          return v;
        }
      },
      clickRate: {
        type: Number,
        default: 0,
        get: function() {
          return this.stats.totalSent > 0 
            ? (this.stats.clickCount / this.stats.totalSent * 100).toFixed(2) 
            : 0;
        },
        set: function(v) {
          return v;
        }
      }
    },
    templateId: {
      type: String,
      default: null
    },
    tags: [String]
  },
  {
    timestamps: true
  }
);

// Create indexes for better performance
emailCampaignSchema.index({ isSent: 1 });
emailCampaignSchema.index({ scheduledFor: 1 });
emailCampaignSchema.index({ targetAudience: 1 });
emailCampaignSchema.index({ createdBy: 1 });

const EmailCampaign = mongoose.model('EmailCampaign', emailCampaignSchema);

export default EmailCampaign; 