import asyncHandler from 'express-async-handler';
import nodemailer from 'nodemailer';
import Subscriber from '../models/subscriberModel.js';
import EmailCampaign from '../models/emailCampaignModel.js';
import Order from '../models/orderModel.js';

// @desc    Send purchase receipt email
// @route   POST /api/email/purchase-receipt
// @access  Private
const sendPurchaseReceipt = asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  if (!orderId) {
    res.status(400);
    throw new Error('Order ID is required');
  }

  // Get order details with user information
  const order = await Order.findById(orderId).populate('user', 'name email');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (!order.isPaid) {
    res.status(400);
    throw new Error('Order must be paid before sending receipt');
  }

  try {
    await sendReceiptEmail(order);
    
    res.status(200).json({
      message: 'Purchase receipt sent successfully',
      sentTo: order.user.email
    });
  } catch (error) {
    console.error('Error sending purchase receipt:', error);
    res.status(500);
    throw new Error('Failed to send purchase receipt email');
  }
});

// @desc    Send delivery feedback email
// @route   POST /api/email/delivery-feedback
// @access  Private
const sendDeliveryFeedback = asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  if (!orderId) {
    res.status(400);
    throw new Error('Order ID is required');
  }

  // Get order details with user information
  const order = await Order.findById(orderId).populate('user', 'name email');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (!order.isDelivered) {
    res.status(400);
    throw new Error('Order must be delivered before sending feedback request');
  }

  try {
    await sendFeedbackEmail(order);
    
    res.status(200).json({
      message: 'Delivery feedback email sent successfully',
      sentTo: order.user.email
    });
  } catch (error) {
    console.error('Error sending delivery feedback email:', error);
    res.status(500);
    throw new Error('Failed to send delivery feedback email');
  }
});

// @desc    Send order status update email
// @route   POST /api/email/order-status
// @access  Private
const sendOrderStatusUpdate = asyncHandler(async (req, res) => {
  const { orderId, status, message } = req.body;

  if (!orderId || !status) {
    res.status(400);
    throw new Error('Order ID and status are required');
  }

  // Get order details with user information
  const order = await Order.findById(orderId).populate('user', 'name email');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  try {
    await sendStatusUpdateEmail(order, status, message);
    
    res.status(200).json({
      message: 'Order status update email sent successfully',
      sentTo: order.user.email
    });
  } catch (error) {
    console.error('Error sending order status update email:', error);
    res.status(500);
    throw new Error('Failed to send order status update email');
  }
});

// @desc    Subscribe to newsletter
// @route   POST /api/email/subscribe
// @access  Public
const subscribeToNewsletter = asyncHandler(async (req, res) => {
  const { email, firstName, lastName } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Email is required');
  }

  // Check if already subscribed
  const existingSubscriber = await Subscriber.findOne({ email });
  if (existingSubscriber) {
    // If already subscribed but unsubscribed before, reactivate
    if (!existingSubscriber.isActive) {
      existingSubscriber.isActive = true;
      existingSubscriber.unsubscribedAt = null;
      await existingSubscriber.save();
      return res.status(200).json({
        message: 'Your subscription has been reactivated',
        subscriber: existingSubscriber
      });
    }
    return res.status(400).json({ message: 'Email already subscribed' });
  }

  // Create new subscriber
  const subscriber = await Subscriber.create({
    email,
    firstName: firstName || '',
    lastName: lastName || '',
    isActive: true
  });

  if (subscriber) {
    // Send welcome email
    try {
      await sendWelcomeEmail(subscriber);
      res.status(201).json({
        message: 'Successfully subscribed to the newsletter',
        subscriber
      });
    } catch (error) {
      console.error('Error sending welcome email:', error);
      res.status(201).json({
        message: 'Successfully subscribed, but welcome email could not be sent',
        subscriber
      });
    }
  } else {
    res.status(400);
    throw new Error('Invalid subscriber data');
  }
});

// @desc    Unsubscribe from newsletter
// @route   PUT /api/email/unsubscribe
// @access  Public
const unsubscribeFromNewsletter = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Email is required');
  }

  const subscriber = await Subscriber.findOne({ email });
  if (!subscriber) {
    res.status(404);
    throw new Error('Subscriber not found');
  }

  subscriber.isActive = false;
  subscriber.unsubscribedAt = Date.now();
  await subscriber.save();

  res.status(200).json({ message: 'Successfully unsubscribed from the newsletter' });
});

// @desc    Get all subscribers
// @route   GET /api/email/subscribers
// @access  Private/Admin
const getSubscribers = asyncHandler(async (req, res) => {
  const pageSize = Number(req.query.pageSize) || 10;
  const page = Number(req.query.pageNumber) || 1;
  const status = req.query.status;
  
  let query = {};
  if (status === 'active') {
    query.isActive = true;
  } else if (status === 'inactive') {
    query.isActive = false;
  }

  const count = await Subscriber.countDocuments(query);
  const subscribers = await Subscriber.find(query)
    .sort({ createdAt: -1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({
    subscribers,
    page,
    pages: Math.ceil(count / pageSize),
    total: count
  });
});

// @desc    Delete subscriber
// @route   DELETE /api/email/subscribers/:id
// @access  Private/Admin
const deleteSubscriber = asyncHandler(async (req, res) => {
  const subscriber = await Subscriber.findById(req.params.id);

  if (!subscriber) {
    res.status(404);
    throw new Error('Subscriber not found');
  }

  await subscriber.remove();
  res.json({ message: 'Subscriber removed' });
});

// @desc    Create email campaign
// @route   POST /api/email/campaigns
// @access  Private/Admin
const createCampaign = asyncHandler(async (req, res) => {
  const { subject, content, targetAudience, scheduledFor } = req.body;

  if (!subject || !content) {
    res.status(400);
    throw new Error('Subject and content are required');
  }

  const campaign = await EmailCampaign.create({
    subject,
    content,
    targetAudience: targetAudience || 'all',
    scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
    createdBy: req.user._id
  });

  res.status(201).json(campaign);
});

// @desc    Get all campaigns
// @route   GET /api/email/campaigns
// @access  Private/Admin
const getCampaigns = asyncHandler(async (req, res) => {
  const pageSize = Number(req.query.pageSize) || 10;
  const page = Number(req.query.pageNumber) || 1;
  const status = req.query.status;

  let query = {};
  if (status === 'sent') {
    query.isSent = true;
  } else if (status === 'scheduled') {
    query.isSent = false;
    query.scheduledFor = { $ne: null };
  } else if (status === 'draft') {
    query.isSent = false;
    query.scheduledFor = null;
  }

  const count = await EmailCampaign.countDocuments(query);
  const campaigns = await EmailCampaign.find(query)
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({
    campaigns,
    page,
    pages: Math.ceil(count / pageSize),
    total: count
  });
});

// @desc    Get campaign by ID
// @route   GET /api/email/campaigns/:id
// @access  Private/Admin
const getCampaignById = asyncHandler(async (req, res) => {
  const campaign = await EmailCampaign.findById(req.params.id)
    .populate('createdBy', 'name email');

  if (!campaign) {
    res.status(404);
    throw new Error('Campaign not found');
  }

  res.json(campaign);
});

// @desc    Update campaign
// @route   PUT /api/email/campaigns/:id
// @access  Private/Admin
const updateCampaign = asyncHandler(async (req, res) => {
  const { subject, content, targetAudience, scheduledFor } = req.body;

  const campaign = await EmailCampaign.findById(req.params.id);

  if (!campaign) {
    res.status(404);
    throw new Error('Campaign not found');
  }

  // Don't allow updating sent campaigns
  if (campaign.isSent) {
    res.status(400);
    throw new Error('Cannot edit a campaign that has already been sent');
  }

  campaign.subject = subject || campaign.subject;
  campaign.content = content || campaign.content;
  campaign.targetAudience = targetAudience || campaign.targetAudience;
  campaign.scheduledFor = scheduledFor ? new Date(scheduledFor) : campaign.scheduledFor;
  campaign.updatedAt = Date.now();

  const updatedCampaign = await campaign.save();
  res.json(updatedCampaign);
});

// @desc    Delete campaign
// @route   DELETE /api/email/campaigns/:id
// @access  Private/Admin
const deleteCampaign = asyncHandler(async (req, res) => {
  const campaign = await EmailCampaign.findById(req.params.id);

  if (!campaign) {
    res.status(404);
    throw new Error('Campaign not found');
  }

  // Don't allow deleting sent campaigns
  if (campaign.isSent) {
    res.status(400);
    throw new Error('Cannot delete a campaign that has already been sent');
  }

  await campaign.remove();
  res.json({ message: 'Campaign removed' });
});

// @desc    Send campaign
// @route   POST /api/email/campaigns/:id/send
// @access  Private/Admin
const sendCampaign = asyncHandler(async (req, res) => {
  const campaign = await EmailCampaign.findById(req.params.id);

  if (!campaign) {
    res.status(404);
    throw new Error('Campaign not found');
  }

  if (campaign.isSent) {
    res.status(400);
    throw new Error('Campaign has already been sent');
  }

  // Get target subscribers based on targetAudience
  let subscribersQuery = { isActive: true };
  if (campaign.targetAudience !== 'all') {
    // Add additional targeting criteria if needed
    // For example: subscribersQuery.tags = campaign.targetAudience;
  }

  const subscribers = await Subscriber.find(subscribersQuery);

  if (subscribers.length === 0) {
    res.status(400);
    throw new Error('No active subscribers found for this campaign');
  }

  // Send emails in batches to avoid overloading the email server
  try {
    const batchSize = 50; // Send emails in batches of 50
    let successCount = 0;
    let errorCount = 0;
    let errors = [];

    // Process in batches
    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize);
      
      // Process each subscriber in the batch
      const promises = batch.map(async (subscriber) => {
        try {
          await sendEmailToSubscriber(subscriber, campaign);
          return { success: true };
        } catch (error) {
          return { success: false, error, email: subscriber.email };
        }
      });
      
      const results = await Promise.all(promises);
      
      // Count successes and failures
      results.forEach(result => {
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
          errors.push({
            email: result.email,
            error: result.error.message
          });
        }
      });
    }

    // Update campaign as sent
    campaign.isSent = true;
    campaign.sentAt = Date.now();
    campaign.stats = {
      totalSent: successCount,
      totalFailed: errorCount,
      openCount: 0,
      clickCount: 0,
      unsubscribeCount: 0
    };
    
    await campaign.save();

    res.json({
      message: 'Campaign sent',
      stats: {
        totalSubscribers: subscribers.length,
        successCount,
        errorCount,
        errors: errors.slice(0, 10) // Return only first 10 errors
      }
    });
  } catch (error) {
    res.status(500);
    throw new Error(`Failed to send campaign: ${error.message}`);
  }
});

// @desc    Get email statistics
// @route   GET /api/email/stats
// @access  Private/Admin
const getEmailStats = asyncHandler(async (req, res) => {
  try {
    // Get overall subscriber stats
    const totalSubscribers = await Subscriber.countDocuments();
    const activeSubscribers = await Subscriber.countDocuments({ isActive: true });
    const inactiveSubscribers = await Subscriber.countDocuments({ isActive: false });

    // Get campaign stats
    const totalCampaigns = await EmailCampaign.countDocuments();
    const sentCampaigns = await EmailCampaign.countDocuments({ isSent: true });
    const scheduledCampaigns = await EmailCampaign.countDocuments({ 
      isSent: false,
      scheduledFor: { $ne: null }
    });
    const draftCampaigns = await EmailCampaign.countDocuments({ 
      isSent: false,
      scheduledFor: null
    });

    // Get recent subscriber trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const dailySubscribers = await Subscriber.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: { 
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } 
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Get subscriber sources
    const subscriberSources = await Subscriber.aggregate([
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get monthly subscriber growth
    const monthlyGrowth = await Subscriber.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      },
      {
        $limit: 12
      }
    ]);

    // Get campaign performance metrics
    const campaignPerformance = await EmailCampaign.aggregate([
      {
        $match: { isSent: true }
      },
      {
        $group: {
          _id: null,
          totalSent: { $sum: '$stats.totalSent' },
          totalOpened: { $sum: '$stats.openCount' },
          totalClicked: { $sum: '$stats.clickCount' },
          totalUnsubscribed: { $sum: '$stats.unsubscribeCount' },
          avgOpenRate: { $avg: '$stats.openRate' },
          avgClickRate: { $avg: '$stats.clickRate' }
        }
      }
    ]);

    // Get top performing campaigns
    const topCampaigns = await EmailCampaign.find({ isSent: true })
      .sort({ 'stats.openRate': -1 })
      .limit(10)
      .select('subject sentAt stats targetAudience');

    // Get recent campaigns
    const recentCampaigns = await EmailCampaign.find({ isSent: true })
      .sort({ sentAt: -1 })
      .limit(5)
      .select('subject sentAt stats');

    // Calculate engagement metrics
    const engagementMetrics = {
      averageOpenRate: campaignPerformance[0]?.avgOpenRate || 0,
      averageClickRate: campaignPerformance[0]?.avgClickRate || 0,
      totalEmailsSent: campaignPerformance[0]?.totalSent || 0,
      totalEmailsOpened: campaignPerformance[0]?.totalOpened || 0,
      totalEmailsClicked: campaignPerformance[0]?.totalClicked || 0,
      unsubscribeRate: campaignPerformance[0]?.totalSent > 0 
        ? ((campaignPerformance[0]?.totalUnsubscribed || 0) / campaignPerformance[0].totalSent * 100).toFixed(2)
        : 0
    };

    // Get subscriber activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentActivity = {
      newSubscribers: await Subscriber.countDocuments({
        createdAt: { $gte: sevenDaysAgo }
      }),
      unsubscribes: await Subscriber.countDocuments({
        unsubscribedAt: { $gte: sevenDaysAgo }
      }),
      campaignsSent: await EmailCampaign.countDocuments({
        sentAt: { $gte: sevenDaysAgo }
      })
    };

    res.json({
      subscribers: {
        total: totalSubscribers,
        active: activeSubscribers,
        inactive: inactiveSubscribers,
        sources: subscriberSources,
        monthlyGrowth: monthlyGrowth
      },
      campaigns: {
        total: totalCampaigns,
        sent: sentCampaigns,
        scheduled: scheduledCampaigns,
        draft: draftCampaigns,
        performance: engagementMetrics
      },
      trends: {
        dailySubscribers,
        recentActivity
      },
      topCampaigns,
      recentCampaigns,
      engagementMetrics
    });
  } catch (error) {
    console.error('Error getting email stats:', error);
    res.status(500);
    throw new Error('Failed to get email statistics');
  }
});

// Helper functions
const sendWelcomeEmail = async (subscriber) => {
  // Create a transporter with your email service configuration
  const transporter = createEmailTransporter();

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@mystore.com',
    to: subscriber.email,
    subject: 'Welcome to MyStore Newsletter!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to MyStore!</h2>
        <p>Hello ${subscriber.firstName || 'there'},</p>
        <p>Thank you for subscribing to our newsletter. You'll now be the first to know about our latest products, promotions, and exclusive offers!</p>
        <p>We're excited to have you join our community.</p>
        <p>Best regards,<br>The MyStore Team</p>
        <p style="font-size: 12px; color: #777;">
          If you didn't subscribe to our newsletter, you can <a href="${process.env.FRONTEND_URL}/unsubscribe?email=${subscriber.email}">unsubscribe here</a>.
        </p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
};

const sendEmailToSubscriber = async (subscriber, campaign) => {
  const transporter = createEmailTransporter();

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'marketing@mystore.com',
    to: subscriber.email,
    subject: campaign.subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        ${campaign.content}
        <p style="font-size: 12px; color: #777; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px;">
          You're receiving this email because you subscribed to our newsletter.
          <br>
          <a href="${process.env.FRONTEND_URL}/unsubscribe?email=${subscriber.email}">Unsubscribe</a> | <a href="${process.env.FRONTEND_URL}/preferences?email=${subscriber.email}">Update Preferences</a>
        </p>
      </div>
    `,
    headers: {
      'X-Campaign-ID': campaign._id.toString()
    }
  };

  return transporter.sendMail(mailOptions);
};

const createEmailTransporter = () => {
  // For production, use your actual email service
  if (process.env.NODE_ENV === 'production') {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  } 
  
  // For development, use ethereal.email (fake SMTP service)
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: process.env.ETHEREAL_EMAIL || 'default@ethereal.email',
      pass: process.env.ETHEREAL_PASSWORD || 'password'
    }
  });
};

// Helper functions for email templates
const sendReceiptEmail = async (order) => {
  const transporter = createEmailTransporter();

  const orderItemsHtml = order.orderItems.map(item => `
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 15px 0; vertical-align: top;">
        <div style="display: flex; align-items: center;">
          <img src="${process.env.FRONTEND_URL}${item.image}" alt="${item.name}" 
               style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; margin-right: 15px;">
          <div>
            <h4 style="margin: 0 0 5px 0; color: #1a2c42; font-size: 16px;">${item.name}</h4>
            ${item.selectedSize ? `<p style="margin: 0; color: #666; font-size: 14px;">Size: ${item.selectedSize}</p>` : ''}
            ${item.customizations ? '<p style="margin: 0; color: #28a745; font-size: 14px;"><em>Custom tailoring included</em></p>' : ''}
          </div>
        </div>
      </td>
      <td style="padding: 15px 0; text-align: center; color: #666;">
        ${item.qty}
      </td>
      <td style="padding: 15px 0; text-align: right; font-weight: 600; color: #1a2c42;">
        $${(item.price * item.qty).toFixed(2)}
      </td>
    </tr>
  `).join('');

  const customizationTotal = order.orderItems.reduce((total, item) => {
    return total + (item.customizations?.totalCost || 0);
  }, 0);

  const mailOptions = {
    from: `${process.env.FROM_NAME || 'ProMayouf'} <${process.env.FROM_EMAIL}>`,
    to: order.user.email,
    subject: `ProMayouf - Order Confirmation #${order._id.toString().slice(-6)}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation</title>
      </head>
      <body style="font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa;">
        <div style="max-width: 600px; margin: 0 auto; background: white;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #1a2c42, #2c4a6b); color: white; padding: 40px 30px; text-align: center;">
            <h1 style="margin: 0 0 10px 0; font-size: 28px; font-weight: bold;">Thank You for Your Order!</h1>
            <p style="margin: 0; font-size: 18px; opacity: 0.9;">Order #${order._id.toString().slice(-6)}</p>
            <div style="margin-top: 20px; padding: 15px; background: rgba(255,255,255,0.1); border-radius: 8px; display: inline-block;">
              <p style="margin: 0; font-size: 16px;">Order Date: ${new Date(order.createdAt).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</p>
            </div>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            <h2 style="color: #1a2c42; margin-bottom: 20px;">Hello ${order.user.name},</h2>
            <p style="font-size: 16px; margin-bottom: 30px; color: #666;">
              We're excited to confirm that we've received your order and it's being processed with care. 
              Here are your order details:
            </p>
            
            <!-- Order Items -->
            <div style="background: #f8f9fa; padding: 25px; border-radius: 12px; margin: 30px 0;">
              <h3 style="color: #1a2c42; margin: 0 0 20px 0; font-size: 20px;">Order Summary</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="border-bottom: 2px solid #1a2c42;">
                    <th style="padding: 15px 0; text-align: left; color: #1a2c42; font-weight: 600;">Item</th>
                    <th style="padding: 15px 0; text-align: center; color: #1a2c42; font-weight: 600;">Qty</th>
                    <th style="padding: 15px 0; text-align: right; color: #1a2c42; font-weight: 600;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${orderItemsHtml}
                </tbody>
              </table>
              
              <!-- Order Totals -->
              <div style="margin-top: 25px; padding-top: 20px; border-top: 2px solid #1a2c42;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                  <span style="color: #666;">Subtotal:</span>
                  <span style="font-weight: 600; color: #1a2c42;">$${order.itemsPrice.toFixed(2)}</span>
                </div>
                ${customizationTotal > 0 ? `
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                  <span style="color: #666;">Customization:</span>
                  <span style="font-weight: 600; color: #28a745;">+$${customizationTotal.toFixed(2)}</span>
                </div>
                ` : ''}
                ${order.discountAmount > 0 ? `
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                  <span style="color: #666;">Discount:</span>
                  <span style="font-weight: 600; color: #dc3545;">-$${order.discountAmount.toFixed(2)}</span>
                </div>
                ` : ''}
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                  <span style="color: #666;">Shipping:</span>
                  <span style="font-weight: 600; color: #1a2c42;">$${order.shippingPrice.toFixed(2)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                  <span style="color: #666;">Tax:</span>
                  <span style="font-weight: 600; color: #1a2c42;">$${order.taxPrice.toFixed(2)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 15px 0; border-top: 1px solid #ddd; border-bottom: 1px solid #ddd;">
                  <span style="font-size: 18px; font-weight: bold; color: #1a2c42;">Total:</span>
                  <span style="font-size: 18px; font-weight: bold; color: #1a2c42;">$${order.totalPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            <!-- Shipping Information -->
            <div style="background: white; border: 2px solid #e9ecef; padding: 25px; border-radius: 12px; margin: 30px 0;">
              <h3 style="color: #1a2c42; margin: 0 0 15px 0; font-size: 18px;">📦 Shipping Information</h3>
              <div style="color: #666; line-height: 1.8;">
                <strong style="color: #1a2c42;">${order.user.name}</strong><br>
                ${order.shippingAddress.address}<br>
                ${order.shippingAddress.city}, ${order.shippingAddress.postalCode}<br>
                ${order.shippingAddress.country}
              </div>
            </div>
            
            <!-- What's Next -->
            <div style="background: linear-gradient(135deg, #e8f5e8, #f0f8f0); padding: 25px; border-radius: 12px; margin: 30px 0;">
              <h3 style="color: #1a2c42; margin: 0 0 15px 0; font-size: 18px;">🚀 What's Next?</h3>
              <ul style="margin: 0; padding-left: 20px; color: #666;">
                <li style="margin-bottom: 8px;">We'll send you a shipping confirmation with tracking information</li>
                <li style="margin-bottom: 8px;">Your order will be delivered within 5-7 business days</li>
                <li style="margin-bottom: 8px;">Custom tailored items may take an additional 2-3 days</li>
                <li style="margin-bottom: 8px;">You'll receive a delivery confirmation once your order arrives</li>
              </ul>
            </div>
            
            <!-- Action Buttons -->
            <div style="text-align: center; margin: 40px 0;">
              <a href="${process.env.FRONTEND_URL}/order/${order._id}" 
                 style="display: inline-block; background: linear-gradient(135deg, #1a2c42, #2c4a6b); color: white; 
                        padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; 
                        margin: 0 10px 10px 0; box-shadow: 0 4px 15px rgba(26, 44, 66, 0.3);">
                Track Your Order
              </a>
              <a href="${process.env.FRONTEND_URL}/profile" 
                 style="display: inline-block; background: transparent; color: #1a2c42; 
                        padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; 
                        border: 2px solid #1a2c42; margin: 0 10px 10px 0;">
                View Order History
              </a>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background: #1a2c42; color: white; padding: 30px; text-align: center;">
            <h3 style="margin: 0 0 15px 0; font-size: 20px;">Thank you for choosing ProMayouf!</h3>
            <p style="margin: 0 0 20px 0; opacity: 0.9;">
              Experience the finest in men's fashion with our premium collection of suits, shoes, and accessories.
            </p>
            <div style="margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; opacity: 0.8;">
                Questions? Contact us at 
                <a href="mailto:support@promayouf.com" style="color: #fff; text-decoration: underline;">support@promayouf.com</a> 
                or call 1-800-PROMAYOUF
              </p>
            </div>
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.2);">
              <p style="margin: 0; font-size: 12px; opacity: 0.7;">
                Follow us: 
                <a href="#" style="color: #fff; text-decoration: none; margin: 0 5px;">Facebook</a> | 
                <a href="#" style="color: #fff; text-decoration: none; margin: 0 5px;">Instagram</a> | 
                <a href="#" style="color: #fff; text-decoration: none; margin: 0 5px;">Twitter</a>
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  };

  return transporter.sendMail(mailOptions);
};

const sendFeedbackEmail = async (order) => {
  const transporter = createEmailTransporter();

  const orderItemsHtml = order.orderItems.map(item => `
    <li style="margin-bottom: 8px; color: #666;">
      <strong style="color: #1a2c42;">${item.name}</strong> (Qty: ${item.qty})
      ${item.selectedSize ? ` - Size: ${item.selectedSize}` : ''}
    </li>
  `).join('');

  const mailOptions = {
    from: `${process.env.FROM_NAME || 'ProMayouf'} <${process.env.FROM_EMAIL}>`,
    to: order.user.email,
    subject: `🎉 Your ProMayouf Order Has Been Delivered! Share Your Experience`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Delivery Confirmation & Feedback</title>
      </head>
      <body style="font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa;">
        <div style="max-width: 600px; margin: 0 auto; background: white;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #28a745, #20c997); color: white; padding: 40px 30px; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 15px;">🎉</div>
            <h1 style="margin: 0 0 10px 0; font-size: 28px; font-weight: bold;">Your Order Has Been Delivered!</h1>
            <p style="margin: 0; font-size: 18px; opacity: 0.9;">Order #${order._id.toString().slice(-6)}</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            <h2 style="color: #1a2c42; margin-bottom: 20px;">Hello ${order.user.name},</h2>
            <p style="font-size: 16px; margin-bottom: 30px; color: #666;">
              Great news! Your ProMayouf order has been successfully delivered. We hope you love your new items and that they exceed your expectations!
            </p>
            
            <!-- Delivery Details -->
            <div style="background: #f8f9fa; padding: 25px; border-radius: 12px; margin: 30px 0;">
              <h3 style="color: #1a2c42; margin: 0 0 20px 0; font-size: 20px;">📦 Delivery Details</h3>
              <div style="margin-bottom: 15px;">
                <strong style="color: #1a2c42;">Delivered on:</strong>
                <span style="color: #666; margin-left: 10px;">
                  ${new Date(order.deliveredAt).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              ${order.trackingNumber ? `
              <div style="margin-bottom: 15px;">
                <strong style="color: #1a2c42;">Tracking Number:</strong>
                <span style="color: #666; margin-left: 10px;">${order.trackingNumber}</span>
              </div>
              ` : ''}
              <div style="margin-bottom: 15px;">
                <strong style="color: #1a2c42;">Items Delivered:</strong>
              </div>
              <ul style="margin: 10px 0; padding-left: 20px;">
                ${orderItemsHtml}
              </ul>
            </div>
            
            <!-- Feedback Section -->
            <div style="background: linear-gradient(135deg, #e8f5e8, #f0f8f0); padding: 30px; border-radius: 12px; margin: 30px 0; text-align: center;">
              <h3 style="color: #1a2c42; margin: 0 0 15px 0; font-size: 22px;">How Was Your Experience?</h3>
              <p style="color: #666; margin-bottom: 20px; font-size: 16px;">
                Your feedback helps us improve and helps other customers make informed decisions.
              </p>
              <div style="font-size: 32px; margin: 20px 0; color: #ffc107;">⭐⭐⭐⭐⭐</div>
              <p style="color: #666; margin-bottom: 30px;">Rate your experience and share your thoughts!</p>
              
              <div style="margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL}/feedback/${order._id}" 
                   style="display: inline-block; background: linear-gradient(135deg, #28a745, #20c997); color: white; 
                          padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; 
                          margin: 0 10px 15px 0; box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);">
                  ⭐ Leave a Review
                </a>
                <a href="${process.env.FRONTEND_URL}/share-photos/${order._id}" 
                   style="display: inline-block; background: linear-gradient(135deg, #007bff, #0056b3); color: white; 
                          padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; 
                          margin: 0 10px 15px 0; box-shadow: 0 4px 15px rgba(0, 123, 255, 0.3);">
                  📸 Share Photos
                </a>
              </div>
            </div>
            
            <!-- Help Section -->
            <div style="background: white; border: 2px solid #e9ecef; padding: 25px; border-radius: 12px; margin: 30px 0;">
              <h3 style="color: #1a2c42; margin: 0 0 20px 0; font-size: 18px;">🤝 Need Help?</h3>
              <ul style="margin: 0; padding-left: 20px; color: #666; line-height: 1.8;">
                <li style="margin-bottom: 10px;">
                  <strong style="color: #1a2c42;">Fit Issues?</strong> We offer free alterations within 30 days
                </li>
                <li style="margin-bottom: 10px;">
                  <strong style="color: #1a2c42;">Quality Concerns?</strong> Contact us for immediate assistance
                </li>
                <li style="margin-bottom: 10px;">
                  <strong style="color: #1a2c42;">Love Your Purchase?</strong> Share it on social media with #ProMayoufStyle
                </li>
                <li style="margin-bottom: 10px;">
                  <strong style="color: #1a2c42;">Care Instructions?</strong> Check our care guide for best practices
                </li>
              </ul>
            </div>

            <!-- Social Sharing -->
            <div style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); padding: 25px; border-radius: 12px; margin: 30px 0; text-align: center;">
              <h3 style="color: #1a2c42; margin: 0 0 15px 0; font-size: 18px;">📱 Share Your Style</h3>
              <p style="color: #666; margin-bottom: 20px;">
                Show off your new ProMayouf pieces and inspire others! Tag us for a chance to be featured.
              </p>
              <p style="color: #1a2c42; font-weight: 600; font-size: 16px;">#ProMayoufStyle #MensFashion #PremiumSuits</p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background: #1a2c42; color: white; padding: 30px; text-align: center;">
            <h3 style="margin: 0 0 15px 0; font-size: 20px;">Thank you for choosing ProMayouf!</h3>
            <p style="margin: 0 0 20px 0; opacity: 0.9;">
              We're committed to providing you with exceptional quality and service.
            </p>
            <div style="margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; opacity: 0.8;">
                Follow us: 
                <a href="#" style="color: #fff; text-decoration: none; margin: 0 5px;">@ProMayouf</a> | 
                Visit: <a href="${process.env.FRONTEND_URL}" style="color: #fff; text-decoration: none;">www.promayouf.com</a>
              </p>
              <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.8;">
                Support: 
                <a href="mailto:support@promayouf.com" style="color: #fff; text-decoration: underline;">support@promayouf.com</a> | 
                1-800-PROMAYOUF
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  };

  return transporter.sendMail(mailOptions);
};

const sendStatusUpdateEmail = async (order, status, customMessage = '') => {
  const transporter = createEmailTransporter();

  const statusMessages = {
    'processing': {
      title: 'Order is Being Processed',
      message: 'Your order is currently being prepared by our team.',
      icon: '⚙️',
      color: '#ffc107'
    },
    'packed': {
      title: 'Order Has Been Packed',
      message: 'Your order has been carefully packed and is ready for shipment.',
      icon: '📦',
      color: '#17a2b8'
    },
    'shipped': {
      title: 'Order Has Been Shipped',
      message: 'Your order is on its way! You should receive it within 5-7 business days.',
      icon: '🚚',
      color: '#007bff'
    },
    'in_transit': {
      title: 'Order is In Transit',
      message: 'Your order is currently being transported to your address.',
      icon: '🛣️',
      color: '#6f42c1'
    },
    'out_for_delivery': {
      title: 'Out for Delivery',
      message: 'Your order is out for delivery and should arrive today!',
      icon: '🚛',
      color: '#fd7e14'
    },
    'delivered': {
      title: 'Order Delivered',
      message: 'Your order has been successfully delivered!',
      icon: '✅',
      color: '#28a745'
    }
  };

  const statusInfo = statusMessages[status] || {
    title: 'Order Status Update',
    message: customMessage || 'Your order status has been updated.',
    icon: '📋',
    color: '#6c757d'
  };

  const mailOptions = {
    from: `${process.env.FROM_NAME || 'ProMayouf'} <${process.env.FROM_EMAIL}>`,
    to: order.user.email,
    subject: `ProMayouf - ${statusInfo.title} (Order #${order._id.toString().slice(-6)})`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Status Update</title>
      </head>
      <body style="font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa;">
        <div style="max-width: 600px; margin: 0 auto; background: white;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, ${statusInfo.color}, ${statusInfo.color}dd); color: white; padding: 40px 30px; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 15px;">${statusInfo.icon}</div>
            <h1 style="margin: 0 0 10px 0; font-size: 24px; font-weight: bold;">${statusInfo.title}</h1>
            <p style="margin: 0; font-size: 16px; opacity: 0.9;">Order #${order._id.toString().slice(-6)}</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px; text-align: center;">
            <h2 style="color: #1a2c42; margin-bottom: 20px;">Hello ${order.user.name},</h2>
            <p style="font-size: 16px; margin-bottom: 30px; color: #666;">
              ${statusInfo.message}
              ${customMessage ? `<br><br>${customMessage}` : ''}
            </p>
            
            ${order.trackingNumber ? `
            <div style="background: #f8f9fa; padding: 25px; border-radius: 12px; margin: 30px 0;">
              <h3 style="color: #1a2c42; margin: 0 0 15px 0;">Tracking Information</h3>
              <p style="margin: 0; color: #666;">
                <strong>Tracking Number:</strong> ${order.trackingNumber}
              </p>
              ${order.shippingCarrier ? `
              <p style="margin: 10px 0 0 0; color: #666;">
                <strong>Carrier:</strong> ${order.shippingCarrier}
              </p>
              ` : ''}
            </div>
            ` : ''}
            
            <div style="margin: 40px 0;">
              <a href="${process.env.FRONTEND_URL}/order/${order._id}" 
                 style="display: inline-block; background: linear-gradient(135deg, #1a2c42, #2c4a6b); color: white; 
                        padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; 
                        box-shadow: 0 4px 15px rgba(26, 44, 66, 0.3);">
                View Order Details
              </a>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background: #1a2c42; color: white; padding: 30px; text-align: center;">
            <p style="margin: 0; opacity: 0.9;">
              Thank you for choosing ProMayouf!
            </p>
            <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.8;">
              Questions? Contact us at 
              <a href="mailto:support@promayouf.com" style="color: #fff; text-decoration: underline;">support@promayouf.com</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  return transporter.sendMail(mailOptions);
};

export {
  sendPurchaseReceipt,
  sendDeliveryFeedback,
  sendOrderStatusUpdate,
  subscribeToNewsletter,
  unsubscribeFromNewsletter,
  getSubscribers,
  deleteSubscriber,
  createCampaign,
  getCampaigns,
  getCampaignById,
  updateCampaign,
  deleteCampaign,
  sendCampaign,
  getEmailStats
}; 