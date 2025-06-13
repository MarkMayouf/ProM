// Email Service for ProMayouf
import { toast } from 'react-toastify';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

class EmailService {
  // Send purchase receipt email
  static async sendPurchaseReceipt(orderData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/email/purchase-receipt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          orderId: orderData.orderId,
          customerEmail: orderData.customerEmail,
          customerName: orderData.customerName,
          orderItems: orderData.orderItems,
          totalAmount: orderData.totalAmount,
          shippingAddress: orderData.shippingAddress,
          paymentMethod: orderData.paymentMethod,
          orderDate: orderData.orderDate,
          customizations: orderData.customizations || [],
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Purchase receipt sent to your email!');
        return { success: true, data: result };
      } else {
        throw new Error(result.message || 'Failed to send receipt');
      }
    } catch (error) {
      console.error('Error sending purchase receipt:', error);
      toast.error('Failed to send receipt email');
      return { success: false, error: error.message };
    }
  }

  // Send delivery feedback email
  static async sendDeliveryFeedback(feedbackData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/email/delivery-feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          orderId: feedbackData.orderId,
          customerEmail: feedbackData.customerEmail,
          customerName: feedbackData.customerName,
          deliveryDate: feedbackData.deliveryDate,
          trackingNumber: feedbackData.trackingNumber,
          orderItems: feedbackData.orderItems,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Delivery confirmation and feedback request sent!');
        return { success: true, data: result };
      } else {
        throw new Error(result.message || 'Failed to send delivery feedback');
      }
    } catch (error) {
      console.error('Error sending delivery feedback:', error);
      toast.error('Failed to send delivery feedback email');
      return { success: false, error: error.message };
    }
  }

  // Send feedback reminder email
  static async sendFeedbackReminder(reminderData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/email/feedback-reminder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          orderId: reminderData.orderId,
          customerEmail: reminderData.customerEmail,
          customerName: reminderData.customerName,
          orderItems: reminderData.orderItems,
          purchaseDate: reminderData.purchaseDate,
          reminderType: reminderData.reminderType || 'follow-up',
        }),
      });

      const result = await response.json();

      if (response.ok) {
        return { success: true, data: result };
      } else {
        throw new Error(result.message || 'Failed to send feedback reminder');
      }
    } catch (error) {
      console.error('Error sending feedback reminder:', error);
      return { success: false, error: error.message };
    }
  }

  // Send order status update email
  static async sendOrderStatusUpdate(statusData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/email/order-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          orderId: statusData.orderId,
          customerEmail: statusData.customerEmail,
          customerName: statusData.customerName,
          orderStatus: statusData.orderStatus,
          trackingNumber: statusData.trackingNumber,
          estimatedDelivery: statusData.estimatedDelivery,
          orderItems: statusData.orderItems,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        return { success: true, data: result };
      } else {
        throw new Error(result.message || 'Failed to send status update');
      }
    } catch (error) {
      console.error('Error sending order status update:', error);
      return { success: false, error: error.message };
    }
  }

  // Generate email templates
  static generateReceiptTemplate(orderData) {
    return {
      subject: `ProMayouf - Order Confirmation #${orderData.orderId}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Confirmation</title>
          <style>
            body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1a2c42, #2c4a6b); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; }
            .order-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .item { border-bottom: 1px solid #eee; padding: 15px 0; }
            .item:last-child { border-bottom: none; }
            .total { background: #e8f5e8; padding: 15px; border-radius: 8px; font-weight: bold; }
            .footer { background: #1a2c42; color: white; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }
            .btn { background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Thank You for Your Order!</h1>
              <p>Order #${orderData.orderId}</p>
            </div>
            
            <div class="content">
              <h2>Hello ${orderData.customerName},</h2>
              <p>We're excited to confirm that we've received your order and it's being processed. Here are your order details:</p>
              
              <div class="order-details">
                <h3>Order Summary</h3>
                ${orderData.orderItems.map(item => `
                  <div class="item">
                    <strong>${item.name}</strong><br>
                    Quantity: ${item.qty} | Price: $${item.price.toFixed(2)}<br>
                    ${item.selectedSize ? `Size: ${item.selectedSize}<br>` : ''}
                    ${item.selectedColor ? `Color: ${item.selectedColor.name}<br>` : ''}
                    ${item.customizations ? '<em>Custom tailoring included</em>' : ''}
                  </div>
                `).join('')}
                
                <div class="total">
                  Total: $${orderData.totalAmount.toFixed(2)}
                </div>
              </div>
              
              <div class="order-details">
                <h3>Shipping Information</h3>
                <p>
                  ${orderData.shippingAddress.address}<br>
                  ${orderData.shippingAddress.city}, ${orderData.shippingAddress.postalCode}<br>
                  ${orderData.shippingAddress.country}
                </p>
              </div>
              
              <div class="order-details">
                <h3>What's Next?</h3>
                <ul>
                  <li>We'll send you a shipping confirmation with tracking information</li>
                  <li>Your order will be delivered within 5-7 business days</li>
                  <li>Custom tailored items may take an additional 2-3 days</li>
                </ul>
              </div>
              
              <div style="text-align: center;">
                <a href="${API_BASE_URL}/track-order/${orderData.orderId}" class="btn">Track Your Order</a>
              </div>
            </div>
            
            <div class="footer">
              <p>Thank you for choosing ProMayouf!</p>
              <p>Questions? Contact us at support@promayouf.com or call 1-800-PROMAYOUF</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
  }

  static generateFeedbackTemplate(feedbackData) {
    return {
      subject: `ProMayouf - Your Order Has Been Delivered! Share Your Experience`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Delivery Confirmation & Feedback</title>
          <style>
            body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #28a745, #20c997); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; }
            .delivery-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .feedback-section { background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
            .btn { background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px; font-weight: bold; }
            .btn-secondary { background: #007bff; }
            .stars { font-size: 24px; color: #ffc107; }
            .footer { background: #1a2c42; color: white; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Your Order Has Been Delivered!</h1>
              <p>Order #${feedbackData.orderId}</p>
            </div>
            
            <div class="content">
              <h2>Hello ${feedbackData.customerName},</h2>
              <p>Great news! Your ProMayouf order has been successfully delivered. We hope you love your new items!</p>
              
              <div class="delivery-info">
                <h3>Delivery Details</h3>
                <p><strong>Delivered on:</strong> ${new Date(feedbackData.deliveryDate).toLocaleDateString()}</p>
                <p><strong>Tracking Number:</strong> ${feedbackData.trackingNumber}</p>
                <p><strong>Items Delivered:</strong></p>
                <ul>
                  ${feedbackData.orderItems.map(item => `
                    <li>${item.name} (Qty: ${item.qty})</li>
                  `).join('')}
                </ul>
              </div>
              
              <div class="feedback-section">
                <h3>How Was Your Experience?</h3>
                <p>Your feedback helps us improve and helps other customers make informed decisions.</p>
                <div class="stars">⭐⭐⭐⭐⭐</div>
                <p>Rate your experience and share your thoughts!</p>
                
                <a href="${API_BASE_URL}/feedback/${feedbackData.orderId}" class="btn">Leave a Review</a>
                <a href="${API_BASE_URL}/share-photos/${feedbackData.orderId}" class="btn btn-secondary">Share Photos</a>
              </div>
              
              <div class="delivery-info">
                <h3>Need Help?</h3>
                <ul>
                  <li><strong>Fit Issues?</strong> We offer free alterations within 30 days</li>
                  <li><strong>Quality Concerns?</strong> Contact us for immediate assistance</li>
                  <li><strong>Love Your Purchase?</strong> Share it on social media with #ProMayoufStyle</li>
                </ul>
              </div>
            </div>
            
            <div class="footer">
              <p>Thank you for choosing ProMayouf!</p>
              <p>Follow us: @ProMayouf | Visit: www.promayouf.com</p>
              <p>Support: support@promayouf.com | 1-800-PROMAYOUF</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
  }
}

export default EmailService; 