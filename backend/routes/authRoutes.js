import express from 'express';
import sendEmail from '../utils/sendEmail.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { protect } from '../middleware/firebaseAuth.js';
import { runAllTests, testTokenVerification } from '../utils/testAuth.js';

const router = express.Router();

// Send verification email
router.post('/send-verification-email', async (req, res) => {
  try {
    const { email, name, verificationCode } = req.body;

    if (!email || !name || !verificationCode) {
      return res.status(400).json({ 
        message: 'Email, name, and verification code are required' 
      });
    }

    // Email options
    const emailOptions = {
      email: email.toLowerCase().trim(),
      subject: 'ProMayouf - Email Verification Code',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification</title>
          <style>
            body { 
              font-family: 'Arial', sans-serif; 
              line-height: 1.6; 
              color: #333; 
              background-color: #f8f9fa;
              margin: 0;
              padding: 0;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              padding: 20px; 
              background-color: #ffffff;
            }
            .header { 
              background: linear-gradient(135deg, #1a2c42, #2c4a6b); 
              color: white; 
              padding: 30px; 
              text-align: center; 
              border-radius: 10px 10px 0 0; 
            }
            .content { 
              background: #ffffff; 
              padding: 40px 30px; 
              text-align: center;
            }
            .verification-code {
              background: #f8f9fa;
              border: 2px dashed #28a745;
              border-radius: 10px;
              padding: 20px;
              margin: 30px 0;
              font-size: 32px;
              font-weight: bold;
              letter-spacing: 8px;
              color: #28a745;
              font-family: 'Courier New', monospace;
            }
            .footer { 
              background: #1a2c42; 
              color: white; 
              padding: 20px; 
              text-align: center; 
              border-radius: 0 0 10px 10px;
              font-size: 14px;
            }
            .warning {
              background: #fff3cd;
              border: 1px solid #ffeaa7;
              border-radius: 8px;
              padding: 15px;
              margin: 20px 0;
              color: #856404;
            }
            .company-logo {
              font-size: 28px;
              font-weight: bold;
              margin-bottom: 10px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="company-logo">ProMayouf</div>
              <h1>Email Verification</h1>
              <p>Verify your email to complete registration</p>
            </div>
            
            <div class="content">
              <h2>Hello ${name},</h2>
              <p>Thank you for joining ProMayouf! To complete your registration, please use the verification code below:</p>
              
              <div class="verification-code">
                ${verificationCode}
              </div>
              
              <p><strong>Enter this code in the verification form to activate your account.</strong></p>
              
              <div class="warning">
                <strong>Security Notice:</strong><br>
                • This code expires in 10 minutes<br>
                • Never share this code with anyone<br>
                • If you didn't request this, please ignore this email
              </div>
              
              <p>Welcome to the ProMayouf family! We're excited to help you discover premium menswear.</p>
            </div>
            
            <div class="footer">
              <p><strong>ProMayouf - Premium Menswear</strong></p>
              <p>This is an automated email for account verification. Please do not reply to this email.</p>
              <p>If you need assistance, contact us at support@promayouf.com</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    // Send the verification email
    await sendEmail(emailOptions);

    res.status(200).json({
      success: true,
      message: 'Verification email sent successfully'
    });

  } catch (error) {
    console.error('Error sending verification email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send verification email',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Auth routes working correctly',
    timestamp: new Date().toISOString()
  });
});

// Test authentication endpoint
router.get('/test', protect, asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'Authentication working correctly',
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      isAdmin: req.user.isAdmin,
      isVerified: req.user.isVerified
    },
    timestamp: new Date().toISOString()
  });
}));

// Test system status (no auth required)
router.get('/status', asyncHandler(async (req, res) => {
  const testResults = await runAllTests();
  
  res.json({
    success: true,
    message: 'System status check completed',
    results: testResults,
    environment: {
      nodeEnv: process.env.NODE_ENV,
      hasFirebaseProjectId: !!process.env.FIREBASE_PROJECT_ID,
      hasFirebaseServiceAccount: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    },
    timestamp: new Date().toISOString()
  });
}));

// Test token verification (debug endpoint)
router.post('/verify-token', asyncHandler(async (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'Token is required'
    });
  }
  
  const isValid = await testTokenVerification(token);
  
  res.json({
    success: isValid,
    message: isValid ? 'Token is valid' : 'Token verification failed',
    timestamp: new Date().toISOString()
  });
}));

export default router; 