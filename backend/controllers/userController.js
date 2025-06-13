import asyncHandler from '../middleware/asyncHandler.js';
import generateToken from '../utils/generateToken.js';
import User from '../models/userModel.js';
import crypto from 'crypto';
import sendEmail from '../utils/sendEmail.js';

// Temporary storage for verification codes (in production, use Redis or database)
const verificationCodes = new Map();

// Generate 6-digit verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Mock SMS sending function (replace with real SMS service like Twilio)
const sendSMS = async (phone, message) => {
  // In a real application, integrate with SMS service
  console.log(`SMS to ${phone}: ${message}`);
  // For demo purposes, we'll just log it
  return Promise.resolve();
};

// @desc    Auth user & get token
// @route   POST /api/users/auth
// @access  Public
const authUser = asyncHandler(async (req, res) => {
  const {
    email,
    password
  } = req.body;

  const user = await User.findOne({
    email
  });

  // Check if account is locked
  if (user && user.lastLoginAttempts && user.lastLoginAttempts.lockedUntil) {
    const lockTime = new Date(user.lastLoginAttempts.lockedUntil);
    const now = new Date();

    if (lockTime > now) {
      // Account is still locked
      const remainingTime = Math.ceil((lockTime - now) / 1000 / 60); // minutes
      res.status(401);
      throw new Error(`Account temporarily locked. Try again in ${remainingTime} minutes.`);
    }
  }

  // If user exists and password matches
  if (user && (await user.matchPassword(password))) {
    // Reset failed login attempts
    if (user.lastLoginAttempts) {
      user.lastLoginAttempts.count = 0;
      user.lastLoginAttempts.lockedUntil = undefined;
      await user.save();
    }

    const token = generateToken(res, user._id);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      token: token,
    });
  } else {
    // Invalid login attempt
    if (user) {
      // Increment failed login attempts
      if (!user.lastLoginAttempts) {
        user.lastLoginAttempts = {
          count: 1,
          lastAttempt: new Date()
        };
      } else {
        user.lastLoginAttempts.count += 1;
        user.lastLoginAttempts.lastAttempt = new Date();
      }

      // Lock account after 5 failed attempts
      if (user.lastLoginAttempts.count >= 5) {
        const lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        user.lastLoginAttempts.lockedUntil = lockUntil;
      }

      await user.save();

      // If account is now locked
      if (user.lastLoginAttempts.count >= 5) {
        res.status(401);
        throw new Error('Account locked due to too many failed attempts. Try again in 15 minutes.');
      }
    }

    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    phone,
    acceptMarketing,
    isVerified
  } = req.body;

  const userExists = await User.findOne({
    email
  });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  // Only create user if verification is successful
  if (!isVerified) {
    res.status(400);
    throw new Error('Email/Phone verification required');
  }

  const user = await User.create({
    name,
    email,
    password,
    phone,
    acceptMarketing: acceptMarketing || false,
    isVerified: true
  });

  if (user) {
    const token = generateToken(res, user._id);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      token: token,
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Logout user / clear cookie
// @route   POST /api/users/logout
// @access  Public
const logoutUser = (req, res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({
    message: 'Logged out successfully'
  });
};

// @desc    Send verification code via email or SMS
// @route   POST /api/users/send-verification-code
// @access  Public
const sendVerificationCode = asyncHandler(async (req, res) => {
  const { email, phone, method, type } = req.body;

  if (!method || !type) {
    res.status(400);
    throw new Error('Verification method and type are required');
  }

  // Generate 6-digit verification code
  const code = generateVerificationCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Create unique key for this verification request
  const key = method === 'email' ? email : phone;
  
  // Store verification code temporarily
  verificationCodes.set(key, {
    code,
    expiresAt,
    method,
    type,
    attempts: 0
  });

  // Log verification code in development mode
  if (process.env.NODE_ENV === 'development') {
    console.log('\n🔐 DEVELOPMENT MODE - VERIFICATION CODE:');
    console.log(`📧 To: ${key}`);
    console.log(`🔢 Code: ${code}`);
    console.log(`⏰ Expires: ${expiresAt.toLocaleString()}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }

  try {
    if (method === 'email') {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400);
        throw new Error('Invalid email address');
      }

      // Send email with verification code
      const message = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">ProMayouf</h1>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #333; margin-bottom: 20px;">Email Verification</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Thank you for registering with ProMayouf! Please use the verification code below to complete your registration:
            </p>
            <div style="background: white; padding: 20px; margin: 20px 0; border-radius: 10px; text-align: center; border: 2px solid #667eea;">
              <h1 style="color: #667eea; font-size: 36px; margin: 0; letter-spacing: 5px;">${code}</h1>
            </div>
            <p style="color: #666; font-size: 14px;">
              This code will expire in 10 minutes. If you didn't request this verification, please ignore this email.
            </p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              © ${new Date().getFullYear()} ProMayouf. All rights reserved.
            </p>
          </div>
        </div>
      `;

      await sendEmail({
        email,
        subject: 'ProMayouf - Email Verification Code',
        html: message,
      });
    } else if (method === 'sms') {
      // Validate phone format
      const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
      if (!phoneRegex.test(phone)) {
        res.status(400);
        throw new Error('Invalid phone number');
      }

      // Send SMS with verification code
      const message = `ProMayouf verification code: ${code}. This code expires in 10 minutes. Don't share this code with anyone.`;
      await sendSMS(phone, message);
    }

    res.status(200).json({
      message: `Verification code sent successfully via ${method}`,
      expiresIn: 600, // 10 minutes in seconds
      ...(process.env.NODE_ENV === 'development' && { 
        developmentNote: 'Check console for verification code in development mode',
        code: code // Include code in response for development testing
      })
    });
  } catch (error) {
    // Remove the stored code if sending fails
    verificationCodes.delete(key);
    res.status(500);
    throw new Error(`Failed to send verification code: ${error.message}`);
  }
});

// @desc    Verify code (email or SMS)
// @route   POST /api/users/verify-code
// @access  Public
const verifyCode = asyncHandler(async (req, res) => {
  const { email, phone, code, method, type } = req.body;

  if (!code || !method || !type) {
    res.status(400);
    throw new Error('Verification code, method, and type are required');
  }

  const key = method === 'email' ? email : phone;
  const stored = verificationCodes.get(key);

  if (!stored) {
    res.status(400);
    throw new Error('No verification code found. Please request a new code.');
  }

  // Check if code has expired
  if (new Date() > stored.expiresAt) {
    verificationCodes.delete(key);
    res.status(400);
    throw new Error('Verification code has expired. Please request a new code.');
  }

  // Check if too many attempts
  if (stored.attempts >= 3) {
    verificationCodes.delete(key);
    res.status(429);
    throw new Error('Too many failed attempts. Please request a new code.');
  }

  // Verify the code
  if (stored.code !== code) {
    stored.attempts += 1;
    verificationCodes.set(key, stored);
    res.status(400);
    throw new Error(`Invalid verification code. ${3 - stored.attempts} attempts remaining.`);
  }

  // Code is valid, remove it from storage
  verificationCodes.delete(key);

  res.status(200).json({
    message: 'Verification successful',
    verified: true
  });
});

// @desc    Request password reset
// @route   POST /api/users/reset-password
// @access  Public
const requestPasswordReset = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (user) {
    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash and set to resetPasswordToken field
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set expire to 10 minutes
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;

    await user.save();

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    const message = `
      <h1>You have requested a password reset</h1>
      <p>Please click on the link below to reset your password:</p>
      <a href=${resetUrl} clicktracking=off>${resetUrl}</a>
      <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Password Reset Request',
        html: message,
      });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      throw new Error('Email could not be sent');
    }
  }

  // Always return the same response whether the email exists or not (security)
  res.status(200).json({
    message: 'If your email exists in our database, you will receive a password recovery link'
  });
});

// @desc    Reset password with token
// @route   POST /api/users/reset-password/:token
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const {
    password
  } = req.body;
  const {
    token
  } = req.params;

  // Hash the token from the URL
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  // Find user with the token that hasn't expired
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: {
      $gt: Date.now()
    },
  });

  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired password reset token');
  }

  // Set the new password
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  // Log the user in
  generateToken(res, user._id);

  res.status(200).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    isAdmin: user.isAdmin,
  });
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({});
  res.json(users);
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    if (user.isAdmin) {
      res.status(400);
      throw new Error('Can not delete admin user');
    }
    await User.deleteOne({
      _id: user._id
    });
    res.json({
      message: 'User removed'
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');

  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.isAdmin = Boolean(req.body.isAdmin);

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

export {
  getUserProfile,
  updateUserProfile,
  getUsers,
  deleteUser,
  getUserById,
  updateUser,
};