import asyncHandler from "../middleware/asyncHandler.js";
import Order from "../models/orderModel.js";
import Product from "../models/productModel.js";
import { calcPrices } from "../utils/calcPrices.js";
import { verifyPayPalPayment, checkIfNewTransaction } from "../utils/paypal.js";
import { generateInvoicePDF } from "../utils/invoiceGenerator.js"; // Import JS invoice generator
import path from "path";
import fs from "fs";
import nodemailer from 'nodemailer';

import Coupon from "../models/couponModel.js";

// Helper function to create email transporter
const createEmailTransporter = () => {
  // Check if email configuration is properly set
  const requiredEnvVars = {
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_EMAIL: process.env.SMTP_EMAIL,
    SMTP_PASSWORD: process.env.SMTP_PASSWORD,
    FROM_EMAIL: process.env.FROM_EMAIL
  };

  const missingVars = Object.entries(requiredEnvVars)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0 && process.env.NODE_ENV === 'production') {
    console.warn(`Missing email configuration: ${missingVars.join(', ')}`);
    console.warn('Email functionality may not work properly');
  }

  try {
    if (process.env.NODE_ENV === 'production') {
      // Production email configuration
      const config = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_PORT == 465,
        auth: {
          user: process.env.SMTP_EMAIL,
          pass: process.env.SMTP_PASSWORD
        },
        tls: {
          rejectUnauthorized: false // Allow self-signed certificates in development
        }
      };

      console.log('Creating email transporter for production with config:', {
        host: config.host,
        port: config.port,
        secure: config.secure,
        user: config.auth.user ? '***' : 'not set'
      });

      return nodemailer.createTransporter(config);
    } else {
      // Development configuration with better fallbacks
      const testAccount = {
        user: process.env.ETHEREAL_EMAIL || 'test@ethereal.email',
        pass: process.env.ETHEREAL_PASSWORD || 'testpassword'
      };

      console.log('Creating email transporter for development');

      return nodemailer.createTransporter({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: testAccount,
        tls: {
          rejectUnauthorized: false
        }
      });
    }
  } catch (error) {
    console.error('Error creating email transporter:', error);
    throw new Error(`Failed to create email transporter: ${error.message}`);
  }
};

// Helper function to send purchase receipt email
const sendPurchaseReceiptEmail = async (order) => {
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

// Helper function to send delivery feedback email
const sendDeliveryFeedbackEmail = async (order) => {
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

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const addOrderItems = asyncHandler(async (req, res) => {
  const {
    orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    appliedCoupon,
    discountAmount,
    discountedItemsPrice
  } = req.body;

  if (!orderItems || orderItems.length === 0) {
    res.status(400);
    throw new Error('No order items');
  }

  // Verify coupon if one is applied
  let verifiedCoupon = null;
  let verifiedDiscount = 0;
  
  if (appliedCoupon) {
    const coupon = await Coupon.findOne({ code: appliedCoupon.code });
    
    if (!coupon || !coupon.isValid()) {
      res.status(400);
      throw new Error('Invalid or expired coupon');
    }

    // Check user usage limit
    if (coupon.usageLimitPerUser) {
      const userOrders = await Order.find({
        user: req.user._id,
        'appliedCoupon.code': coupon.code,
        isPaid: true
      });

      if (userOrders.length >= coupon.usageLimitPerUser) {
        res.status(400);
        throw new Error('Coupon usage limit exceeded for this user');
      }
    }

    // Calculate expected discount
    let expectedDiscount = 0;
    if (coupon.discountType === 'percentage') {
      expectedDiscount = (itemsPrice * coupon.discountValue) / 100;
    } else {
      expectedDiscount = Math.min(coupon.discountValue, itemsPrice);
    }

    // Round to 2 decimal places
    expectedDiscount = Math.round(expectedDiscount * 100) / 100;

    // Verify the discount amount matches
    if (Math.abs(expectedDiscount - discountAmount) > 0.01) {
      res.status(400);
      throw new Error('Invalid discount calculation');
    }

    verifiedCoupon = coupon;
    verifiedDiscount = expectedDiscount;

    // Increment coupon usage
    coupon.timesUsed += 1;
    await coupon.save();
  }

  // Create order items with proper references
  const dbOrderItems = await Promise.all(
    orderItems.map(async (item) => {
      const dbItem = {
        name: item.name,
        qty: item.qty,
        image: item.image,
        price: item.price,
        product: item.product,
      };

      if (item.selectedSize) {
        dbItem.selectedSize = item.selectedSize;
      }

      if (item.customizations) {
        dbItem.customizations = item.customizations;
      }

      return dbItem;
    })
  );

  // Debug: Log order items for price calculation
  console.log('=== ORDER ITEMS DEBUG ===');
  dbOrderItems.forEach((item, index) => {
    console.log(`Item ${index + 1}:`, {
      name: item.name,
      price: item.price,
      qty: item.qty,
      customizations: item.customizations,
      totalCost: item.customizations?.totalCost,
      customizationPrice: item.customizations?.customizationPrice
    });
  });
  console.log('=== END ORDER ITEMS DEBUG ===');

  // Calculate prices server-side
  const calculatedPrices = calcPrices(dbOrderItems, verifiedCoupon);

  // Debug: Log the price comparison
  console.log('=== PRICE VALIDATION DEBUG ===');
  console.log('Frontend sent:');
  console.log('  itemsPrice:', itemsPrice);
  console.log('  taxPrice:', taxPrice);
  console.log('  shippingPrice:', shippingPrice);
  console.log('  totalPrice:', totalPrice);
  console.log('Backend calculated:');
  console.log('  itemsPrice:', calculatedPrices.itemsPrice);
  console.log('  taxPrice:', calculatedPrices.taxPrice);
  console.log('  shippingPrice:', calculatedPrices.shippingPrice);
  console.log('  totalPrice:', calculatedPrices.totalPrice);
  console.log('Differences:');
  console.log('  itemsPrice diff:', Math.abs(calculatedPrices.itemsPrice - itemsPrice));
  console.log('  taxPrice diff:', Math.abs(calculatedPrices.taxPrice - taxPrice));
  console.log('  shippingPrice diff:', Math.abs(calculatedPrices.shippingPrice - shippingPrice));
  console.log('  totalPrice diff:', Math.abs(calculatedPrices.totalPrice - totalPrice));
  console.log('=== END PRICE DEBUG ===');

  // Validate prices match with a small tolerance for floating point differences
  const isClose = (a, b) => Math.abs(a - b) < 0.01;

  // For validation, compare the original itemsPrice (before discount)
  // Tax and shipping should be calculated on discounted price
  const expectedTaxPrice = calculatedPrices.taxPrice;
  const expectedShippingPrice = calculatedPrices.shippingPrice;
  const expectedTotalPrice = calculatedPrices.totalPrice;

  if (!isClose(calculatedPrices.itemsPrice, itemsPrice) ||
      !isClose(expectedTaxPrice, taxPrice) ||
      !isClose(expectedShippingPrice, shippingPrice) ||
      !isClose(expectedTotalPrice, totalPrice) ||
      (verifiedCoupon && !isClose(calculatedPrices.discountAmount, discountAmount))) {
    
    console.log('=== VALIDATION FAILED ===');
    console.log('ItemsPrice validation:', !isClose(calculatedPrices.itemsPrice, itemsPrice));
    console.log('TaxPrice validation:', !isClose(expectedTaxPrice, taxPrice));
    console.log('ShippingPrice validation:', !isClose(expectedShippingPrice, shippingPrice));
    console.log('TotalPrice validation:', !isClose(expectedTotalPrice, totalPrice));
    if (verifiedCoupon) {
      console.log('DiscountAmount validation:', !isClose(calculatedPrices.discountAmount, discountAmount));
    }
    console.log('=== END VALIDATION ===');
    
    res.status(400);
    throw new Error('Price calculation mismatch');
  }

  const order = new Order({
    orderItems: dbOrderItems,
    user: req.user._id,
    shippingAddress,
    paymentMethod,
    itemsPrice: calculatedPrices.itemsPrice,
    taxPrice: calculatedPrices.taxPrice,
    shippingPrice: calculatedPrices.shippingPrice,
    totalPrice: calculatedPrices.totalPrice,
    currency: "USD",
    appliedCoupon: verifiedCoupon ? {
      code: verifiedCoupon.code,
      discountType: verifiedCoupon.discountType,
      discountValue: verifiedCoupon.discountValue,
      discountAmount: verifiedDiscount
    } : null,
    discountAmount: verifiedDiscount,
    discountedItemsPrice: calculatedPrices.discountedItemsPrice,
  });

  try {
    // Save the order first
    const createdOrder = await order.save();

    // Update product stock
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      
      if (!product) {
        console.warn(`Product ${item.product} not found for stock update`);
        continue;
      }
      
      if (product.sizes && product.sizes.length > 0) {
        // Update size-specific stock
        const sizeIndex = product.sizes.findIndex(s => s.size === item.selectedSize);
        if (sizeIndex !== -1) {
          product.sizes[sizeIndex].quantity = Math.max(0, product.sizes[sizeIndex].quantity - item.qty);
        }
      } else {
        // Update general stock
        product.countInStock = Math.max(0, product.countInStock - item.qty);
      }
      
      await product.save();
    }

    res.status(201).json(createdOrder);
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(error.status || 500);
    throw error;
  }
});

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(orders);
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate(
    "user",
    "name email"
  );

  if (order) {
    res.json(order);
  } else {
    res.status(404);
    throw new Error("Order not found");
  }
});

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
const updateOrderToPaid = asyncHandler(async (req, res) => {
  try {
    console.log('Payment request body:', JSON.stringify(req.body, null, 2));
    
    const { paymentSource, ...paymentDetailsProvided } = req.body;
    const order = await Order.findById(req.params.id).populate("user", "name email");

    if (!order) {
      res.status(404);
      throw new Error("Order not found");
    }

    if (order.isPaid) {
      res.status(400);
      throw new Error("Order already paid");
    }

    if (!paymentSource) {
      res.status(400);
      throw new Error("Payment source is required");
    }

    // Update order payment details based on payment source
    if (paymentSource === "PayPal") {
      const { id, status, update_time, payer } = paymentDetailsProvided;
      
      if (!id || !status) {
        res.status(400);
        throw new Error("Invalid PayPal payment details");
      }

      order.paymentResult = {
        id,
        status,
        update_time,
        email_address: payer.email_address,
        payment_source: "PayPal"
      };
    } else if (paymentSource === "Stripe") {
      const { id, status } = paymentDetailsProvided;
      
      if (!id || !status) {
        res.status(400);
        throw new Error("Invalid Stripe payment details");
      }

      order.paymentResult = {
        id,
        status,
        update_time: new Date().toISOString(),
        email_address: req.user.email,
        payment_source: "Stripe"
      };
    } else {
      res.status(400);
      throw new Error("Invalid payment source");
    }

    order.isPaid = true;
    order.paidAt = Date.now();

    const updatedOrder = await order.save();

    // Send purchase receipt email automatically
    try {
      await sendPurchaseReceiptEmail(updatedOrder);
      console.log(`Purchase receipt sent to ${updatedOrder.user.email}`);
    } catch (emailError) {
      console.error('Failed to send purchase receipt email:', emailError);
      // Don't fail the payment process if email fails
    }

    res.json(updatedOrder);
  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(error.statusCode || 400);
    throw error;
  }
});

// @desc    Download invoice for an order
// @route   GET /api/orders/:id/invoice
// @access  Private
const downloadInvoice = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (!order) {
        res.status(404);
        throw new Error("Order not found");
    }

    if (order.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
        res.status(403);
        throw new Error("Not authorized to access this invoice");
    }

    if (!order.invoicePath || !order.isPaid) {
        res.status(404);
        throw new Error("Invoice not available for this order or order not paid.");
    }

    const __dirname = path.resolve();
    const filePath = path.join(__dirname, order.invoicePath);

    if (fs.existsSync(filePath)) {
        res.download(filePath, `invoice_${order._id}.pdf`, (err) => {
            if (err) {
                console.error("Error downloading invoice:", err);
                if (!res.headersSent) {
                    res.status(500).send("Could not download the file.");
                }
            }
        });
    } else {
        res.status(404);
        throw new Error("Invoice file not found.");
    }
});


// @desc    Update order to delivered
// @route   PUT /api/orders/:id/deliver
// @access  Private/Admin
const updateOrderToDelivered = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate("user", "name email");

  if (order) {
    order.isDelivered = true;
    order.deliveredAt = Date.now();

    const updatedOrder = await order.save();

    // Send delivery feedback email automatically
    try {
      await sendDeliveryFeedbackEmail(updatedOrder);
      console.log(`Delivery feedback email sent to ${updatedOrder.user.email}`);
    } catch (emailError) {
      console.error('Failed to send delivery feedback email:', emailError);
      // Don't fail the delivery process if email fails
    }

    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error("Order not found");
  }
});

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({}).populate("user", "id name").sort({ createdAt: -1 });
  res.json(orders);
});

// @desc    Generate invoice PDF for an order
// @route   GET /api/orders/:id/generate-invoice
// @access  Private
const generateInvoicePdf = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id).populate(
        "user",
        "name email"
    );

    if (!order) {
        res.status(404);
        throw new Error("Order not found");
    }

    if (order.user._id.toString() !== req.user._id.toString() && !req.user.isAdmin) {
        res.status(403);
        throw new Error("Not authorized to access this invoice");
    }

    const __dirname = path.resolve();
    const invoiceDir = path.join(__dirname, "invoices");
    if (!fs.existsSync(invoiceDir)){
        fs.mkdirSync(invoiceDir, { recursive: true }); // Ensure directory exists
    }
    const invoiceFilename = `invoice_${order._id}.pdf`;
    const invoiceFilePath = path.join(invoiceDir, invoiceFilename);
    
    const orderDataForInvoice = {
        ...order.toObject(),
        user: order.user.toObject(),
    };

    try {
        await generateInvoicePDF(orderDataForInvoice, invoiceFilePath);
        
        // Stream the file to the client
        const file = fs.createReadStream(invoiceFilePath);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${invoiceFilename}`);
        file.pipe(res);
    } catch (error) {
        console.error("Error generating invoice:", error);
        res.status(500);
        throw new Error("Failed to generate invoice");
    }
});

// @desc    Send invoice email
// @route   POST /api/orders/:id/send-invoice
// @access  Private
const sendInvoiceEmail = asyncHandler(async (req, res) => {
    const { email } = req.body;
    
    if (!email) {
        res.status(400);
        throw new Error("Email address is required");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        res.status(400);
        throw new Error("Invalid email address format");
    }
    
    const order = await Order.findById(req.params.id).populate(
        "user",
        "name email"
    );

    if (!order) {
        res.status(404);
        throw new Error("Order not found");
    }

    if (order.user._id.toString() !== req.user._id.toString() && !req.user.isAdmin) {
        res.status(403);
        throw new Error("Not authorized to email this invoice");
    }

    const __dirname = path.resolve();
    const invoiceDir = path.join(__dirname, "invoices");
    
    // Create invoices directory if it doesn't exist
    if (!fs.existsSync(invoiceDir)) {
        try {
            fs.mkdirSync(invoiceDir, { recursive: true });
            console.log('Created invoices directory:', invoiceDir);
        } catch (error) {
            console.error('Error creating invoices directory:', error);
            res.status(500);
            throw new Error("Failed to create invoices directory");
        }
    }

    const invoiceFilename = `invoice_${order._id}.pdf`;
    const invoiceFilePath = path.join(invoiceDir, invoiceFilename);
    
    // Generate the invoice if it doesn't exist
    if (!fs.existsSync(invoiceFilePath)) {
        const orderDataForInvoice = {
            ...order.toObject(),
            user: order.user.toObject(),
        };
        
        try {
            console.log('Generating invoice PDF for order:', order._id);
            await generateInvoicePDF(orderDataForInvoice, invoiceFilePath);
            console.log('Invoice PDF generated successfully:', invoiceFilePath);
        } catch (error) {
            console.error("Error generating invoice for email:", error);
            res.status(500);
            throw new Error("Failed to generate invoice for email");
        }
    }

    // Send the email with the invoice attached
    try {
        console.log('Creating email transporter...');
        const transporter = createEmailTransporter();
        
        // Verify transporter configuration
        console.log('Verifying email transporter...');
        await transporter.verify();
        console.log('Email transporter verified successfully');
        
        const mailOptions = {
            from: `${process.env.FROM_NAME || 'ProMayouf'} <${process.env.FROM_EMAIL || 'noreply@promayouf.com'}>`,
            to: email,
            subject: `Invoice for Order #${order._id.toString().slice(-6)} - ProMayouf`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Invoice</title>
                </head>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa;">
                    <div style="max-width: 600px; margin: 0 auto; background: white; padding: 40px;">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h1 style="color: #1a2c42; margin-bottom: 10px;">ProMayouf</h1>
                            <h2 style="color: #666; margin: 0;">Invoice Attached</h2>
                        </div>
                        
                        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                            <h3 style="color: #1a2c42; margin: 0 0 15px 0;">Order Details</h3>
                            <p style="margin: 5px 0;"><strong>Order ID:</strong> ${order._id}</p>
                            <p style="margin: 5px 0;"><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
                            <p style="margin: 5px 0;"><strong>Total Amount:</strong> $${order.totalPrice.toFixed(2)}</p>
                            ${order.refundProcessed ? `<p style="margin: 5px 0; color: #dc3545;"><strong>Refund Amount:</strong> -$${order.refundAmount.toFixed(2)}</p>` : ''}
                        </div>
                        
                        <p style="margin-bottom: 20px;">
                            Dear ${order.user.name},
                        </p>
                        
                        <p style="margin-bottom: 20px;">
                            Please find attached the invoice for your recent order with ProMayouf. 
                            ${order.refundProcessed ? 'This invoice includes refund information for your reference.' : ''}
                        </p>
                        
                        <p style="margin-bottom: 20px;">
                            If you have any questions about this invoice or your order, please don't hesitate to contact our customer support team.
                        </p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <p style="color: #666; font-size: 14px;">
                                Thank you for choosing ProMayouf!
                            </p>
                        </div>
                        
                        <div style="border-top: 1px solid #dee2e6; padding-top: 20px; text-align: center; color: #666; font-size: 12px;">
                            <p style="margin: 0;">
                                ProMayouf | support@promayouf.com | 1-800-PROMAYOUF
                            </p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            attachments: [
                {
                    filename: invoiceFilename,
                    path: invoiceFilePath,
                    contentType: 'application/pdf'
                }
            ]
        };
        
        console.log('Sending invoice email to:', email);
        const result = await transporter.sendMail(mailOptions);
        console.log(`Invoice email sent successfully to ${email} for order ${order._id}`);
        console.log('Email result:', result.messageId);
        
        res.status(200).json({ 
            message: `Invoice sent successfully to ${email}`,
            messageId: result.messageId
        });
    } catch (error) {
        console.error("Detailed error sending invoice email:", {
            error: error.message,
            stack: error.stack,
            orderId: order._id,
            email: email,
            emailConfig: {
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT,
                user: process.env.SMTP_EMAIL ? '***' : 'not set',
                fromEmail: process.env.FROM_EMAIL
            }
        });
        
        // Provide more specific error messages
        if (error.code === 'EAUTH') {
            res.status(500);
            throw new Error("Email authentication failed. Please check SMTP credentials.");
        } else if (error.code === 'ECONNECTION') {
            res.status(500);
            throw new Error("Failed to connect to email server. Please check SMTP settings.");
        } else if (error.code === 'EENVELOPE') {
            res.status(500);
            throw new Error("Invalid email address. Please check the recipient email.");
        } else {
            res.status(500);
            throw new Error(`Failed to send invoice email: ${error.message}. Please check email configuration.`);
        }
    }
});

// @desc    Update order tracking information
// @route   PUT /api/orders/:id/tracking
// @access  Private/Admin
const updateOrderTracking = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  const { trackingNumber, shippingCarrier, shippingStatus, estimatedDelivery, trackingEvents } = req.body;

  // Validate required fields
  if (!trackingNumber || !shippingCarrier || !shippingStatus) {
    res.status(400);
    throw new Error("Please provide tracking number, carrier, and status");
  }

  // Update tracking information
  order.trackingNumber = trackingNumber;
  order.shippingCarrier = shippingCarrier;
  order.shippingStatus = shippingStatus;
  order.estimatedDelivery = estimatedDelivery || order.estimatedDelivery;
  
  // Update tracking events if provided
  if (trackingEvents && Array.isArray(trackingEvents)) {
    // Validate tracking events structure
    const validEvents = trackingEvents.every(event => 
      event.date && event.location && event.description
    );

    if (!validEvents) {
      res.status(400);
      throw new Error("Invalid tracking events format");
    }

    order.trackingEvents = trackingEvents;
  }

  // If status is delivered, update delivery status
  if (shippingStatus === 'delivered' && !order.isDelivered) {
    order.isDelivered = true;
    order.deliveredAt = Date.now();
  }

  const updatedOrder = await order.save();
  res.json(updatedOrder);
});

// @desc    Process refund for an order
// @route   PUT /api/orders/:id/refund
// @access  Private/Admin
const refundOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate("user", "name email");

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  if (!order.isPaid) {
    res.status(400);
    throw new Error("Order must be paid before processing refund");
  }

  if (order.refundProcessed) {
    res.status(400);
    throw new Error("Order has already been refunded");
  }

  const { refundAmount, refundReason } = req.body;

  // Validate refund amount
  if (!refundAmount || refundAmount <= 0) {
    res.status(400);
    throw new Error("Please provide a valid refund amount");
  }

  if (refundAmount > order.totalPrice) {
    res.status(400);
    throw new Error("Refund amount cannot exceed order total");
  }

  // Validate refund reason
  if (!refundReason || refundReason.trim().length < 5) {
    res.status(400);
    throw new Error("Please provide a detailed reason for the refund");
  }

  try {
    // Update order with refund information
    order.refundProcessed = true;
    order.refundAmount = parseFloat(refundAmount);
    order.refundReason = refundReason.trim();
    order.refundDate = Date.now();
    order.refundProcessedBy = req.user._id;

    // If full refund, mark as refunded
    if (parseFloat(refundAmount) >= order.totalPrice) {
      order.isRefunded = true;
    }

    const updatedOrder = await order.save();

    // Send refund confirmation email
    try {
      await sendRefundConfirmationEmail(updatedOrder);
      console.log(`Refund confirmation email sent to ${updatedOrder.user.email}`);
    } catch (emailError) {
      console.error('Failed to send refund confirmation email:', emailError);
      // Don't fail the refund process if email fails
    }

    res.json({
      message: `Refund of $${refundAmount} processed successfully`,
      order: updatedOrder
    });
  } catch (error) {
    console.error('Refund processing error:', error);
    res.status(500);
    throw new Error("Failed to process refund");
  }
});

// @desc    Update admin notes for an order
// @route   PUT /api/orders/:id/notes
// @access  Private/Admin
const updateOrderNotes = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  const { adminNotes } = req.body;

  order.adminNotes = adminNotes || '';
  order.lastUpdatedBy = req.user._id;
  order.lastUpdated = Date.now();

  const updatedOrder = await order.save();
  res.json(updatedOrder);
});

// @desc    Resend order confirmation email
// @route   POST /api/orders/:id/resend-confirmation
// @access  Private/Admin
const resendOrderConfirmation = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate("user", "name email");

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  // Validate that the order has a user and email
  if (!order.user || !order.user.email) {
    res.status(400);
    throw new Error("Order does not have a valid user or email address");
  }

  try {
    console.log(`Attempting to resend confirmation email for order ${order._id} to ${order.user.email}`);
    
    // Test email transporter before sending
    const transporter = createEmailTransporter();
    console.log('Verifying email transporter for confirmation email...');
    await transporter.verify();
    console.log('Email transporter verified successfully');
    
    await sendPurchaseReceiptEmail(order);
    console.log(`Order confirmation email sent successfully to ${order.user.email}`);
    
    res.json({ 
      message: "Order confirmation email sent successfully",
      sentTo: order.user.email,
      orderId: order._id
    });
  } catch (error) {
    console.error('Failed to resend confirmation email:', {
      error: error.message,
      stack: error.stack,
      orderId: order._id,
      userEmail: order.user?.email,
      emailConfig: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_EMAIL ? '***' : 'not set',
        fromEmail: process.env.FROM_EMAIL
      }
    });
    
    // Provide more specific error messages
    if (error.code === 'EAUTH') {
      res.status(500);
      throw new Error("Email authentication failed. Please check SMTP credentials.");
    } else if (error.code === 'ECONNECTION') {
      res.status(500);
      throw new Error("Failed to connect to email server. Please check SMTP settings.");
    } else {
      res.status(500);
      throw new Error(`Failed to send confirmation email: ${error.message}`);
    }
  }
});

// Helper function to send refund confirmation email
const sendRefundConfirmationEmail = async (order) => {
  const transporter = createEmailTransporter();

  const mailOptions = {
    from: `${process.env.FROM_NAME || 'ProMayouf'} <${process.env.FROM_EMAIL}>`,
    to: order.user.email,
    subject: `Refund Processed - Order #${order._id.toString().slice(-6)}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Refund Confirmation</title>
      </head>
      <body style="font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa;">
        <div style="max-width: 600px; margin: 0 auto; background: white;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #dc3545, #c82333); color: white; padding: 40px 30px; text-align: center;">
            <h1 style="margin: 0 0 10px 0; font-size: 28px; font-weight: bold;">Refund Processed</h1>
            <p style="margin: 0; font-size: 18px; opacity: 0.9;">Order #${order._id.toString().slice(-6)}</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            <h2 style="color: #1a2c42; margin-bottom: 20px;">Hello ${order.user.name},</h2>
            <p style="font-size: 16px; margin-bottom: 30px; color: #666;">
              We have processed your refund request. Here are the details:
            </p>
            
            <!-- Refund Details -->
            <div style="background: #f8f9fa; padding: 25px; border-radius: 12px; margin: 30px 0;">
              <h3 style="color: #1a2c42; margin: 0 0 20px 0; font-size: 20px;">Refund Details</h3>
              <div style="margin-bottom: 15px;">
                <strong style="color: #1a2c42;">Refund Amount:</strong>
                <span style="color: #dc3545; margin-left: 10px; font-size: 18px; font-weight: bold;">$${order.refundAmount.toFixed(2)}</span>
              </div>
              <div style="margin-bottom: 15px;">
                <strong style="color: #1a2c42;">Original Order Total:</strong>
                <span style="color: #666; margin-left: 10px;">$${order.totalPrice.toFixed(2)}</span>
              </div>
              <div style="margin-bottom: 15px;">
                <strong style="color: #1a2c42;">Refund Date:</strong>
                <span style="color: #666; margin-left: 10px;">
                  ${new Date(order.refundDate).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric'
                  })}
                </span>
              </div>
              <div style="margin-bottom: 15px;">
                <strong style="color: #1a2c42;">Reason:</strong>
                <p style="color: #666; margin: 5px 0 0 0; padding: 10px; background: white; border-radius: 6px;">
                  ${order.refundReason}
                </p>
              </div>
            </div>
            
            <!-- Processing Info -->
            <div style="background: #e8f5e8; padding: 25px; border-radius: 12px; margin: 30px 0;">
              <h3 style="color: #1a2c42; margin: 0 0 15px 0; font-size: 18px;">What Happens Next?</h3>
              <ul style="margin: 0; padding-left: 20px; color: #666;">
                <li style="margin-bottom: 8px;">Your refund will be processed back to your original payment method</li>
                <li style="margin-bottom: 8px;">Please allow 3-5 business days for the refund to appear in your account</li>
                <li style="margin-bottom: 8px;">You will receive a separate confirmation from your bank/payment provider</li>
                <li style="margin-bottom: 8px;">If you have any questions, please contact our support team</li>
              </ul>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background: #1a2c42; color: white; padding: 30px; text-align: center;">
            <h3 style="margin: 0 0 15px 0; font-size: 20px;">Thank you for your understanding</h3>
            <p style="margin: 0 0 20px 0; opacity: 0.9;">
              We apologize for any inconvenience and appreciate your business.
            </p>
            <div style="margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; opacity: 0.8;">
                Questions? Contact us at 
                <a href="mailto:support@promayouf.com" style="color: #fff; text-decoration: underline;">support@promayouf.com</a> 
                or call 1-800-PROMAYOUF
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

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Private/Admin
const deleteOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  // Restore product stock if order was paid
  if (order.isPaid) {
    for (const item of order.orderItems) {
      const product = await Product.findById(item.product);
      
      if (product) {
        if (product.sizes && product.sizes.length > 0) {
          // Restore size-specific stock
          const sizeIndex = product.sizes.findIndex(s => s.size === item.selectedSize);
          if (sizeIndex !== -1) {
            product.sizes[sizeIndex].quantity += item.qty;
          }
        } else {
          // Restore general stock
          product.countInStock += item.qty;
        }
        
        await product.save();
      }
    }
  }

  await Order.findByIdAndDelete(req.params.id);
  res.json({ message: "Order deleted successfully" });
});

// @desc    Update order
// @route   PUT /api/orders/:id
// @access  Private/Admin
const updateOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  const {
    shippingAddress,
    paymentMethod,
    isPaid,
    isDelivered,
    adminNotes,
    trackingNumber,
    shippingCarrier,
    shippingStatus,
  } = req.body;

  // Update order fields
  if (shippingAddress) {
    order.shippingAddress = { ...order.shippingAddress, ...shippingAddress };
  }
  
  if (paymentMethod) {
    order.paymentMethod = paymentMethod;
  }

  if (typeof isPaid === 'boolean') {
    order.isPaid = isPaid;
    if (isPaid && !order.paidAt) {
      order.paidAt = Date.now();
    } else if (!isPaid) {
      order.paidAt = undefined;
    }
  }

  if (typeof isDelivered === 'boolean') {
    order.isDelivered = isDelivered;
    if (isDelivered && !order.deliveredAt) {
      order.deliveredAt = Date.now();
    } else if (!isDelivered) {
      order.deliveredAt = undefined;
    }
  }

  if (adminNotes !== undefined) {
    order.adminNotes = adminNotes;
  }

  if (trackingNumber) {
    order.trackingNumber = trackingNumber;
  }

  if (shippingCarrier) {
    order.shippingCarrier = shippingCarrier;
  }

  if (shippingStatus) {
    order.shippingStatus = shippingStatus;
  }

  const updatedOrder = await order.save();
  res.json(updatedOrder);
});

export {
  addOrderItems,
  getMyOrders,
  getOrderById,
  updateOrderToPaid,
  updateOrderToDelivered,
  getOrders,
  downloadInvoice,
  generateInvoicePdf,
  sendInvoiceEmail,
  updateOrderTracking,
  deleteOrder,
  updateOrder,
  refundOrder,
  updateOrderNotes,
  resendOrderConfirmation,
};
