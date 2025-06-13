import asyncHandler from "../middleware/asyncHandler.js";
import Return from "../models/returnModel.js";
import Order from "../models/orderModel.js";
import Product from "../models/productModel.js";
import nodemailer from 'nodemailer';

// Helper function to create email transporter
const createEmailTransporter = () => {
  if (process.env.NODE_ENV === 'production') {
    return nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_PORT == 465,
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD
      }
    });
  }
  
  return nodemailer.createTransporter({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: process.env.ETHEREAL_EMAIL || 'default@ethereal.email',
      pass: process.env.ETHEREAL_PASSWORD || 'password'
    }
  });
};

// @desc    Create new return request
// @route   POST /api/returns
// @access  Private
const createReturn = asyncHandler(async (req, res) => {
  const {
    orderId,
    returnItems,
    returnReason,
    detailedReason,
    returnShippingAddress,
    returnMethod,
    customerNotes,
    images
  } = req.body;

  // Validate order exists and belongs to user
  const order = await Order.findById(orderId).populate('user', 'name email');
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.user._id.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to return this order');
  }

  // Check if order is eligible for return (e.g., within return window)
  const orderDate = new Date(order.createdAt);
  const currentDate = new Date();
  const daysDifference = (currentDate - orderDate) / (1000 * 60 * 60 * 24);
  
  if (daysDifference > 30) {
    res.status(400);
    throw new Error('Return window has expired. Returns must be initiated within 30 days of purchase.');
  }

  if (!order.isPaid) {
    res.status(400);
    throw new Error('Order must be paid before initiating a return');
  }

  if (!order.isDelivered) {
    res.status(400);
    throw new Error('Order must be delivered before initiating a return');
  }

  // Check if return already exists for this order
  const existingReturn = await Return.findOne({ order: orderId });
  if (existingReturn) {
    res.status(400);
    throw new Error('A return request already exists for this order');
  }

  // Validate return items
  if (!returnItems || !Array.isArray(returnItems) || returnItems.length === 0) {
    res.status(400);
    throw new Error('Please select at least one item to return');
  }

  // Calculate total refund amount
  let totalRefundAmount = 0;
  const validatedReturnItems = [];

  for (const item of returnItems) {
    const orderItem = order.orderItems.find(oi => oi._id.toString() === item.orderItemId);
    if (!orderItem) {
      res.status(400);
      throw new Error(`Order item not found: ${item.orderItemId}`);
    }

    if (item.returnQty > orderItem.qty) {
      res.status(400);
      throw new Error(`Cannot return more items than ordered for ${orderItem.name}`);
    }

    const refundAmount = (orderItem.price * item.returnQty);
    totalRefundAmount += refundAmount;

    validatedReturnItems.push({
      orderItem: orderItem._id,
      product: orderItem.product,
      name: orderItem.name,
      image: orderItem.image,
      price: orderItem.price,
      qty: orderItem.qty,
      returnQty: item.returnQty,
      selectedSize: orderItem.selectedSize,
      returnReason: item.returnReason,
      condition: item.condition || 'new',
      refundAmount: refundAmount
    });
  }

  // Create return request
  const returnRequest = new Return({
    order: orderId,
    user: req.user._id,
    returnItems: validatedReturnItems,
    returnReason,
    detailedReason,
    totalRefundAmount,
    returnShippingAddress,
    returnMethod: returnMethod || 'mail',
    customerNotes,
    images: images || [],
    statusHistory: [{
      status: 'pending',
      updatedBy: req.user._id,
      notes: 'Return request created by customer'
    }]
  });

  const createdReturn = await returnRequest.save();
  await createdReturn.populate(['user', 'order']);

  // Send confirmation email to customer
  try {
    await sendReturnConfirmationEmail(createdReturn);
  } catch (emailError) {
    console.error('Failed to send return confirmation email:', emailError);
  }

  // Send notification email to admin
  try {
    await sendAdminReturnNotification(createdReturn);
  } catch (emailError) {
    console.error('Failed to send admin return notification:', emailError);
  }

  res.status(201).json(createdReturn);
});

// @desc    Get all returns (Admin)
// @route   GET /api/returns
// @access  Private/Admin
const getReturns = asyncHandler(async (req, res) => {
  const page = Number(req.query.pageNumber) || 1;
  const limit = Number(req.query.limit) || 10;
  const status = req.query.status;
  const priority = req.query.priority;
  const assigned = req.query.assigned;
  const search = req.query.search;

  let query = {};

  // Filter by status
  if (status && status !== 'all') {
    query.status = status;
  }

  // Filter by priority
  if (priority && priority !== 'all') {
    query.priorityLevel = priority;
  }

  // Filter by assigned user
  if (assigned && assigned !== 'all') {
    query.assignedTo = assigned;
  }

  // Search functionality
  if (search) {
    query.$or = [
      { returnNumber: { $regex: search, $options: 'i' } },
      { returnReason: { $regex: search, $options: 'i' } },
      { 'returnItems.name': { $regex: search, $options: 'i' } }
    ];
  }

  const count = await Return.countDocuments(query);
  const returns = await Return.find(query)
    .populate('user', 'name email')
    .populate('order', 'createdAt totalPrice')
    .populate('assignedTo', 'name')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  res.json({
    returns,
    page,
    pages: Math.ceil(count / limit),
    total: count
  });
});

// @desc    Get user's returns
// @route   GET /api/returns/mine
// @access  Private
const getUserReturns = asyncHandler(async (req, res) => {
  const returns = await Return.find({ user: req.user._id })
    .populate('order', 'createdAt totalPrice _id')
    .sort({ createdAt: -1 });

  res.json(returns);
});

// @desc    Get return by ID
// @route   GET /api/returns/:id
// @access  Private
const getReturnById = asyncHandler(async (req, res) => {
  const returnRequest = await Return.findById(req.params.id)
    .populate('user', 'name email')
    .populate('order', 'createdAt totalPrice orderItems shippingAddress')
    .populate('assignedTo', 'name email')
    .populate('statusHistory.updatedBy', 'name')
    .populate('qualityCheckResults.checkedBy', 'name')
    .populate('communication.sentBy', 'name');

  if (!returnRequest) {
    res.status(404);
    throw new Error('Return not found');
  }

  // Check authorization
  if (!req.user.isAdmin && returnRequest.user._id.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to view this return');
  }

  res.json(returnRequest);
});

// @desc    Update return status
// @route   PUT /api/returns/:id/status
// @access  Private/Admin
const updateReturnStatus = asyncHandler(async (req, res) => {
  const { status, notes } = req.body;

  const returnRequest = await Return.findById(req.params.id).populate('user', 'name email');

  if (!returnRequest) {
    res.status(404);
    throw new Error('Return not found');
  }

  const oldStatus = returnRequest.status;
  returnRequest.status = status;

  // Add to status history
  returnRequest.statusHistory.push({
    status,
    updatedBy: req.user._id,
    notes: notes || `Status updated from ${oldStatus} to ${status}`
  });

  // Update timestamps for specific statuses
  if (status === 'received' && !returnRequest.returnShippingInfo.returnDate) {
    returnRequest.returnShippingInfo.returnDate = new Date();
  }

  if (status === 'refund_processed' && !returnRequest.refundInfo.refundDate) {
    returnRequest.refundInfo.refundDate = new Date();
  }

  const updatedReturn = await returnRequest.save();

  // Send status update email
  try {
    await sendReturnStatusUpdateEmail(updatedReturn, oldStatus);
  } catch (emailError) {
    console.error('Failed to send status update email:', emailError);
  }

  res.json(updatedReturn);
});

// @desc    Process return refund
// @route   PUT /api/returns/:id/refund
// @access  Private/Admin
const processReturnRefund = asyncHandler(async (req, res) => {
  const {
    refundAmount,
    refundMethod,
    restockingFee,
    returnShippingCost,
    refundTransactionId,
    notes
  } = req.body;

  const returnRequest = await Return.findById(req.params.id).populate(['user', 'order']);

  if (!returnRequest) {
    res.status(404);
    throw new Error('Return not found');
  }

  if (returnRequest.status !== 'approved_refund') {
    res.status(400);
    throw new Error('Return must be approved before processing refund');
  }

  // Validate refund amount
  const maxRefund = returnRequest.totalRefundAmount;
  const finalRefundAmount = refundAmount - (restockingFee || 0) - (returnShippingCost || 0);

  if (finalRefundAmount > maxRefund) {
    res.status(400);
    throw new Error('Refund amount cannot exceed the total return amount');
  }

  if (finalRefundAmount < 0) {
    res.status(400);
    throw new Error('Final refund amount cannot be negative');
  }

  try {
    // Enhanced refund processing with payment processor integration
    const refundResult = await processPaymentRefund({
      orderId: returnRequest.order._id,
      amount: finalRefundAmount,
      method: refundMethod || 'original_payment',
      transactionId: refundTransactionId
    });

    // Update refund information
    returnRequest.refundInfo = {
      refundMethod: refundMethod || 'original_payment',
      refundAmount: finalRefundAmount,
      refundDate: new Date(),
      refundTransactionId: refundResult.transactionId || refundTransactionId || `REF_${Date.now()}`,
      restockingFee: restockingFee || 0,
      returnShippingCost: returnShippingCost || 0,
      processedBy: req.user._id,
      paymentProcessorResponse: refundResult
    };

    returnRequest.status = 'refund_processed';

    // Add to status history
    returnRequest.statusHistory.push({
      status: 'refund_processed',
      updatedBy: req.user._id,
      notes: notes || `Refund of $${finalRefundAmount} processed via ${refundMethod || 'original_payment'}`
    });

    // Update original order refund status
    if (returnRequest.order) {
      returnRequest.order.refundProcessed = true;
      returnRequest.order.refundAmount = (returnRequest.order.refundAmount || 0) + finalRefundAmount;
      returnRequest.order.refundDate = new Date();
      returnRequest.order.isRefunded = returnRequest.order.refundAmount >= returnRequest.order.totalPrice;
      await returnRequest.order.save();
    }
  } catch (error) {
    res.status(500);
    throw new Error(`Failed to process refund: ${error.message}`);
  }

  const updatedReturn = await returnRequest.save();

  // Send refund confirmation email
  try {
    await sendRefundProcessedEmail(updatedReturn);
  } catch (emailError) {
    console.error('Failed to send refund confirmation email:', emailError);
  }

  res.json({
    message: 'Refund processed successfully',
    return: updatedReturn,
    refundDetails: returnRequest.refundInfo
  });
});

// EXAMPLE: Real Stripe refund integration (replace the mock function)
const processPaymentRefund = async ({ orderId, amount, method, transactionId }) => {
  // Option 1: Stripe Integration
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  
  try {
    // Find the original payment intent from the order
    const order = await Order.findById(orderId);
    if (!order || !order.paymentIntentId) {
      throw new Error('Original payment not found');
    }

    // Create refund through Stripe
    const refund = await stripe.refunds.create({
      payment_intent: order.paymentIntentId,
      amount: Math.round(amount * 100), // Convert to cents
      reason: 'requested_by_customer',
      metadata: {
        order_id: orderId,
        return_transaction_id: transactionId
      }
    });

    return {
      success: true,
      transactionId: refund.id,
      amount,
      method: 'stripe_refund',
      processedAt: new Date(),
      status: refund.status,
      processorResponse: refund
    };

  } catch (error) {
    throw new Error(`Stripe refund failed: ${error.message}`);
  }
};

// @desc    Add quality check results
// @route   PUT /api/returns/:id/quality-check
// @access  Private/Admin
const addQualityCheck = asyncHandler(async (req, res) => {
  const {
    overallCondition,
    itemChecks,
    approved,
    finalRefundAmount,
    restockable,
    notes
  } = req.body;

  const returnRequest = await Return.findById(req.params.id);

  if (!returnRequest) {
    res.status(404);
    throw new Error('Return not found');
  }

  returnRequest.qualityCheckResults = {
    checkedBy: req.user._id,
    checkDate: new Date(),
    overallCondition,
    itemChecks: itemChecks || [],
    approved,
    finalRefundAmount,
    restockable: restockable !== false
  };

  // Update status based on approval
  const newStatus = approved ? 'approved_refund' : 'rejected';
  returnRequest.status = newStatus;

  // Add to status history
  returnRequest.statusHistory.push({
    status: newStatus,
    updatedBy: req.user._id,
    notes: notes || `Quality check completed - ${approved ? 'Approved' : 'Rejected'}`
  });

  const updatedReturn = await returnRequest.save();
  res.json(updatedReturn);
});

// @desc    Get return statistics for dashboard
// @route   GET /api/returns/stats
// @access  Private/Admin
const getReturnStats = asyncHandler(async (req, res) => {
  const totalReturns = await Return.countDocuments();
  const pendingReturns = await Return.countDocuments({ status: 'pending' });
  const approvedReturns = await Return.countDocuments({ status: { $in: ['approved_refund', 'refund_processed', 'completed'] } });
  const rejectedReturns = await Return.countDocuments({ status: 'rejected' });

  // Calculate return rate (returns vs orders)
  const totalOrders = await Order.countDocuments({ isPaid: true });
  const returnRate = totalOrders > 0 ? ((totalReturns / totalOrders) * 100).toFixed(2) : 0;

  // Get recent returns
  const recentReturns = await Return.find()
    .populate('user', 'name')
    .populate('order', 'totalPrice')
    .sort({ createdAt: -1 })
    .limit(5);

  // Calculate refund amounts
  const refundStats = await Return.aggregate([
    { $match: { status: 'refund_processed' } },
    {
      $group: {
        _id: null,
        totalRefunded: { $sum: '$refundInfo.refundAmount' },
        avgRefund: { $avg: '$refundInfo.refundAmount' },
        count: { $sum: 1 }
      }
    }
  ]);

  // Return reasons analysis
  const returnReasons = await Return.aggregate([
    {
      $group: {
        _id: '$returnReason',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);

  res.json({
    totalReturns,
    pendingReturns,
    approvedReturns,
    rejectedReturns,
    returnRate: parseFloat(returnRate),
    recentReturns,
    refundStats: refundStats[0] || { totalRefunded: 0, avgRefund: 0, count: 0 },
    returnReasons
  });
});

// Email helper functions
const sendReturnConfirmationEmail = async (returnRequest) => {
  const transporter = createEmailTransporter();

  const itemsHtml = returnRequest.returnItems.map(item => `
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 10px 0;">
        <img src="${process.env.FRONTEND_URL}${item.image}" alt="${item.name}" 
             style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">
      </td>
      <td style="padding: 10px;">${item.name}</td>
      <td style="padding: 10px; text-align: center;">${item.returnQty}</td>
      <td style="padding: 10px; text-align: right;">$${item.refundAmount.toFixed(2)}</td>
    </tr>
  `).join('');

  const mailOptions = {
    from: `${process.env.FROM_NAME || 'ProMayouf'} <${process.env.FROM_EMAIL}>`,
    to: returnRequest.user.email,
    subject: `Return Request Received - ${returnRequest.returnNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Return Request Confirmation</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border: 1px solid #ddd; border-radius: 8px;">
          <div style="background: #1a2c42; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">Return Request Received</h1>
            <p style="margin: 10px 0 0 0;">Return #${returnRequest.returnNumber}</p>
          </div>
          
          <div style="padding: 30px;">
            <h2>Hello ${returnRequest.user.name},</h2>
            <p>We've received your return request and are processing it. Here are the details:</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <h3>Return Items</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background: #e9ecef;">
                    <th style="padding: 10px; text-align: left;">Image</th>
                    <th style="padding: 10px; text-align: left;">Item</th>
                    <th style="padding: 10px; text-align: center;">Qty</th>
                    <th style="padding: 10px; text-align: right;">Refund</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
              <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd; text-align: right;">
                <strong>Total Refund Amount: $${returnRequest.totalRefundAmount.toFixed(2)}</strong>
              </div>
            </div>
            
            <div style="background: #e8f5e8; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <h3>What Happens Next?</h3>
              <ol style="margin: 0; padding-left: 20px;">
                <li>We'll review your return request within 1-2 business days</li>
                <li>If approved, you'll receive return shipping instructions</li>
                <li>Once we receive your items, we'll inspect them</li>
                <li>Your refund will be processed within 3-5 business days after approval</li>
              </ol>
            </div>
            
            <p>You can track your return status at any time by visiting your account page.</p>
            <p>If you have any questions, please contact our customer service team.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  await transporter.sendMail(mailOptions);
};

// @desc    Generate shipping label for return
// @route   POST /api/returns/:id/generate-shipping-label
// @access  Private/Admin
const generateShippingLabel = asyncHandler(async (req, res) => {
  const returnRequest = await Return.findById(req.params.id)
    .populate('user', 'name email')
    .populate('order', 'shippingAddress');

  if (!returnRequest) {
    res.status(404);
    throw new Error('Return not found');
  }

  if (returnRequest.status !== 'approved') {
    res.status(400);
    throw new Error('Return must be approved before generating shipping label');
  }

  try {
    // Mock shipping label generation - in production, integrate with carrier API
    const shippingLabel = {
      labelUrl: `${process.env.BASE_URL}/api/returns/${returnRequest._id}/shipping-label`,
      trackingNumber: `RT${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      carrier: 'USPS',
      estimatedArrival: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      returnAddress: {
        name: 'ProMayouf Returns Center',
        address: '123 Returns Ave',
        city: 'Warehouse City',
        state: 'WC',
        zipCode: '12345',
        country: 'USA'
      }
    };

    // Update return with shipping info
    returnRequest.returnShippingInfo = {
      carrier: shippingLabel.carrier,
      trackingNumber: shippingLabel.trackingNumber,
      shippingLabel: shippingLabel.labelUrl,
      estimatedArrival: shippingLabel.estimatedArrival
    };

    await returnRequest.save();

    // Send email with shipping label to customer
    await sendReturnShippingLabelEmail(returnRequest, shippingLabel);

    res.json({
      message: 'Shipping label generated successfully',
      labelUrl: shippingLabel.labelUrl,
      trackingNumber: shippingLabel.trackingNumber,
      returnShippingInfo: returnRequest.returnShippingInfo
    });
  } catch (error) {
    res.status(500);
    throw new Error('Failed to generate shipping label');
  }
});

// @desc    Download shipping label
// @route   GET /api/returns/:id/shipping-label
// @access  Private
const downloadShippingLabel = asyncHandler(async (req, res) => {
  const returnRequest = await Return.findById(req.params.id);

  if (!returnRequest) {
    res.status(404);
    throw new Error('Return not found');
  }

  // Check authorization
  if (!req.user.isAdmin && returnRequest.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to download this shipping label');
  }

  if (!returnRequest.returnShippingInfo?.shippingLabel) {
    res.status(404);
    throw new Error('Shipping label not found');
  }

  try {
    // Generate PDF shipping label
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="return-label-${returnRequest._id}.pdf"`);
    
    doc.pipe(res);

    // Add shipping label content
    doc.fontSize(20).text('Return Shipping Label', 50, 50);
    doc.fontSize(12);
    
    // From address (customer)
    doc.text('FROM:', 50, 100);
    doc.text(returnRequest.returnShippingAddress.address, 50, 120);
    doc.text(`${returnRequest.returnShippingAddress.city}, ${returnRequest.returnShippingAddress.postalCode}`, 50, 135);
    doc.text(returnRequest.returnShippingAddress.country, 50, 150);
    
    // To address (company)
    doc.text('TO:', 300, 100);
    doc.text('ProMayouf Returns Center', 300, 120);
    doc.text('123 Returns Ave', 300, 135);
    doc.text('Warehouse City, WC 12345', 300, 150);
    doc.text('USA', 300, 165);
    
    // Tracking number
    doc.fontSize(16).text(`Tracking Number: ${returnRequest.returnShippingInfo.trackingNumber}`, 50, 200);
    
    // Return details
    doc.fontSize(12);
    doc.text(`Return ID: ${returnRequest.returnNumber}`, 50, 230);
    doc.text(`Return Date: ${format(returnRequest.createdAt, 'MM/dd/yyyy')}`, 50, 245);
    doc.text(`Carrier: ${returnRequest.returnShippingInfo.carrier}`, 50, 260);
    
    // Instructions
    doc.text('Instructions:', 50, 300);
    doc.text('1. Package items securely in original packaging if available', 50, 320);
    doc.text('2. Attach this label to the outside of the package', 50, 335);
    doc.text('3. Drop off at any USPS location or schedule pickup', 50, 350);
    doc.text('4. Keep tracking number for your records', 50, 365);
    
    doc.end();
  } catch (error) {
    res.status(500);
    throw new Error('Failed to generate shipping label PDF');
  }
});

const sendReturnShippingLabelEmail = async (returnRequest, shippingLabel) => {
  const transporter = createEmailTransporter();

  const mailOptions = {
    to: returnRequest.user.email,
    subject: `Return Shipping Label - Return #${returnRequest.returnNumber}`,
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <div style="background: linear-gradient(135deg, #1a2c42, #2c4a6b); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">Return Approved!</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">
            Your return shipping label is ready
          </p>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <p>Hello ${returnRequest.user.name},</p>
          
          <p>Great news! Your return request has been approved. Please follow the instructions below to ship your items back to us.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
            <h3 style="color: #1a2c42; margin: 0 0 15px 0;">Return Details</h3>
            <p><strong>Return Number:</strong> ${returnRequest.returnNumber}</p>
            <p><strong>Tracking Number:</strong> ${shippingLabel.trackingNumber}</p>
            <p><strong>Carrier:</strong> ${shippingLabel.carrier}</p>
            <p><strong>Estimated Processing:</strong> 3-5 business days after we receive your items</p>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1a2c42; margin: 0 0 15px 0;">Return Instructions</h3>
            <ol style="margin: 0; padding-left: 20px;">
              <li>Download and print the attached shipping label</li>
              <li>Package your items securely (original packaging preferred)</li>
              <li>Attach the shipping label to the outside of the package</li>
              <li>Drop off at any ${shippingLabel.carrier} location or schedule a pickup</li>
            </ol>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${shippingLabel.labelUrl}" 
               style="display: inline-block; background: linear-gradient(135deg, #1a2c42, #2c4a6b); color: white; 
                      padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600;">
              Download Shipping Label
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            If you have any questions about your return, please contact our customer service team.
          </p>
        </div>
        
        <div style="background: #1a2c42; color: white; padding: 20px; text-align: center;">
          <p style="margin: 0; opacity: 0.9;">
            Thank you for choosing ProMayouf!
          </p>
        </div>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
};

// Send admin notification for new return request
const sendAdminReturnNotification = async (returnRequest) => {
  const transporter = createEmailTransporter();

  // Get admin emails from environment or database
  const adminEmails = process.env.ADMIN_EMAILS ? 
    process.env.ADMIN_EMAILS.split(',').map(email => email.trim()) : 
    ['admin@promayouf.com']; // fallback admin email

  const itemsHtml = returnRequest.returnItems.map(item => `
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 10px;">
        <img src="${process.env.FRONTEND_URL}${item.image}" alt="${item.name}" 
             style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">
      </td>
      <td style="padding: 10px;">${item.name}</td>
      <td style="padding: 10px; text-align: center;">${item.returnQty}</td>
      <td style="padding: 10px; text-align: right;">$${item.refundAmount.toFixed(2)}</td>
      <td style="padding: 10px;">${item.returnReason || 'Not specified'}</td>
    </tr>
  `).join('');

  const mailOptions = {
    from: `${process.env.FROM_NAME || 'ProMayouf'} <${process.env.FROM_EMAIL}>`,
    to: adminEmails,
    subject: `🚨 New Return Request - ${returnRequest.returnNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Return Request</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #dc3545, #c82333); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">🚨 New Return Request</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">
              Action Required - Return #${returnRequest.returnNumber}
            </p>
          </div>
          
          <!-- Content -->
          <div style="padding: 30px;">
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
              <h3 style="color: #856404; margin: 0 0 10px 0;">⚠️ Pending Review Required</h3>
              <p style="margin: 0; color: #856404;">
                A new return request has been submitted and requires your immediate attention.
              </p>
            </div>

            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
              <h3 style="color: #1a2c42; margin: 0 0 15px 0;">Return Details</h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div>
                  <p style="margin: 5px 0;"><strong>Return Number:</strong> ${returnRequest.returnNumber}</p>
                  <p style="margin: 5px 0;"><strong>Customer:</strong> ${returnRequest.user.name}</p>
                  <p style="margin: 5px 0;"><strong>Email:</strong> ${returnRequest.user.email}</p>
                  <p style="margin: 5px 0;"><strong>Order ID:</strong> ${returnRequest.order._id}</p>
                </div>
                <div>
                  <p style="margin: 5px 0;"><strong>Return Reason:</strong> ${returnRequest.returnReason}</p>
                  <p style="margin: 5px 0;"><strong>Return Method:</strong> ${returnRequest.returnMethod.replace('_', ' ').toUpperCase()}</p>
                  <p style="margin: 5px 0;"><strong>Total Refund:</strong> $${returnRequest.totalRefundAmount.toFixed(2)}</p>
                  <p style="margin: 5px 0;"><strong>Submitted:</strong> ${format(returnRequest.createdAt, 'MMM dd, yyyy HH:mm')}</p>
                </div>
              </div>
            </div>

            ${returnRequest.detailedReason ? `
            <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #2196f3;">
              <h4 style="color: #1976d2; margin: 0 0 10px 0;">Customer Notes:</h4>
              <p style="margin: 0; color: #1976d2; font-style: italic;">"${returnRequest.detailedReason}"</p>
            </div>
            ` : ''}

            <div style="background: white; border: 1px solid #dee2e6; border-radius: 8px; overflow: hidden; margin-bottom: 25px;">
              <h3 style="background: #f8f9fa; margin: 0; padding: 15px; border-bottom: 1px solid #dee2e6; color: #1a2c42;">
                Items to Return
              </h3>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background: #f8f9fa;">
                    <th style="padding: 12px 10px; text-align: left; border-bottom: 1px solid #dee2e6;">Item</th>
                    <th style="padding: 12px 10px; text-align: left; border-bottom: 1px solid #dee2e6;">Product</th>
                    <th style="padding: 12px 10px; text-align: center; border-bottom: 1px solid #dee2e6;">Qty</th>
                    <th style="padding: 12px 10px; text-align: right; border-bottom: 1px solid #dee2e6;">Refund</th>
                    <th style="padding: 12px 10px; text-align: left; border-bottom: 1px solid #dee2e6;">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
            </div>

            <div style="background: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
              <h3 style="color: #155724; margin: 0 0 15px 0;">⏰ Next Steps</h3>
              <ol style="margin: 0; padding-left: 20px; color: #155724;">
                <li>Review the return request details</li>
                <li>Check order history and customer account</li>
                <li>Approve or reject the return request</li>
                <li>If approved, generate shipping label for customer</li>
              </ol>
            </div>

            <!-- Action Buttons -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/admin/returns/${returnRequest._id}" 
                 style="display: inline-block; background: linear-gradient(135deg, #28a745, #20c997); color: white; 
                        padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 0 10px;">
                Review Return Request
              </a>
              <a href="${process.env.FRONTEND_URL}/admin/returns" 
                 style="display: inline-block; background: linear-gradient(135deg, #1a2c42, #2c4a6b); color: white; 
                        padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 0 10px;">
                View All Returns
              </a>
            </div>

            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 25px;">
              <p style="margin: 0; color: #666; font-size: 14px; text-align: center;">
                <strong>Response Time Target:</strong> Please review and respond to this return request within 24-48 hours.
              </p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background: #1a2c42; color: white; padding: 20px; text-align: center;">
            <p style="margin: 0; opacity: 0.9;">
              ProMayouf Admin Notification System
            </p>
            <p style="margin: 10px 0 0 0; font-size: 12px; opacity: 0.7;">
              This is an automated notification. Please do not reply to this email.
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  return transporter.sendMail(mailOptions);
};

const sendReturnStatusUpdateEmail = async (returnRequest, oldStatus) => {
  const transporter = createEmailTransporter();

  const statusMessages = {
    approved: 'Your return has been approved! Please check your email for return shipping instructions.',
    rejected: 'Unfortunately, your return request has been rejected. Please contact customer service for more information.',
    shipped_back: 'Thank you for shipping your return. We\'ll process it once received.',
    received: 'We\'ve received your returned items and are now inspecting them.',
    inspecting: 'We\'re currently inspecting your returned items.',
    approved_refund: 'Your return has passed inspection and refund has been approved!',
    refund_processed: 'Your refund has been processed and will appear in your account within 3-5 business days.',
    completed: 'Your return has been completed successfully.',
    cancelled: 'Your return request has been cancelled.'
  };

  const message = statusMessages[returnRequest.status] || `Your return status has been updated to ${returnRequest.status}.`;

  const mailOptions = {
    from: `${process.env.FROM_NAME || 'ProMayouf'} <${process.env.FROM_EMAIL}>`,
    to: returnRequest.user.email,
    subject: `Return Update - ${returnRequest.returnNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Return Status Update</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border: 1px solid #ddd; border-radius: 8px;">
          <div style="background: #1a2c42; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">Return Status Update</h1>
            <p style="margin: 10px 0 0 0;">Return #${returnRequest.returnNumber}</p>
          </div>
          
          <div style="padding: 30px;">
            <h2>Hello ${returnRequest.user.name},</h2>
            <p>${message}</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <strong>Current Status:</strong> ${returnRequest.status.replace('_', ' ').toUpperCase()}
            </div>
            
            <p>You can view the full details of your return by visiting your account page.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  await transporter.sendMail(mailOptions);
};

const sendRefundProcessedEmail = async (returnRequest) => {
  const transporter = createEmailTransporter();

  const mailOptions = {
    from: `${process.env.FROM_NAME || 'ProMayouf'} <${process.env.FROM_EMAIL}>`,
    to: returnRequest.user.email,
    subject: `Refund Processed - ${returnRequest.returnNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Refund Processed</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border: 1px solid #ddd; border-radius: 8px;">
          <div style="background: #28a745; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">Refund Processed Successfully!</h1>
            <p style="margin: 10px 0 0 0;">Return #${returnRequest.returnNumber}</p>
          </div>
          
          <div style="padding: 30px;">
            <h2>Hello ${returnRequest.user.name},</h2>
            <p>Great news! Your refund has been processed successfully.</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <h3>Refund Details</h3>
              <p><strong>Refund Amount:</strong> $${returnRequest.refundInfo.refundAmount.toFixed(2)}</p>
              <p><strong>Refund Method:</strong> ${returnRequest.refundInfo.refundMethod.replace('_', ' ')}</p>
              <p><strong>Processing Date:</strong> ${new Date(returnRequest.refundInfo.refundDate).toLocaleDateString()}</p>
              ${returnRequest.refundInfo.refundTransactionId ? `<p><strong>Transaction ID:</strong> ${returnRequest.refundInfo.refundTransactionId}</p>` : ''}
            </div>
            
            <div style="background: #e8f5e8; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <p><strong>Important:</strong> Please allow 3-5 business days for the refund to appear in your account, depending on your payment method and bank processing times.</p>
            </div>
            
            <p>Thank you for your business and we apologize for any inconvenience.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  await transporter.sendMail(mailOptions);
};

export {
  createReturn,
  getReturns,
  getUserReturns,
  getReturnById,
  updateReturnStatus,
  processReturnRefund,
  addQualityCheck,
  getReturnStats,
  generateShippingLabel,
  downloadShippingLabel
}; 