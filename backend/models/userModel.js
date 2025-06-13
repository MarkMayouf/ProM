import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = mongoose.Schema({
  firebaseUid: {
    type: String,
    unique: true,
    sparse: true, // For backward compatibility
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phone: {
    type: String,
    sparse: true, // Allows multiple null values but unique non-null values
  },
  password: {
    type: String,
    required: function() {
      // Password is required only if there's no Firebase UID (for backward compatibility)
      return !this.firebaseUid;
    },
  },
  isAdmin: {
    type: Boolean,
    required: true,
    default: false,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationMethod: {
    type: String,
    enum: ['email', 'sms'],
    default: 'email',
  },
  acceptMarketing: {
    type: Boolean,
    default: false,
  },
  googleId: {
    type: String,
    sparse: true, // Allows multiple null values but unique non-null values
  },
  profileImage: {
    type: String,
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  // Email verification
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  emailOTP: String,
  emailOTPExpires: Date,
  // Phone verification
  phoneOTP: String,
  phoneOTPExpires: Date,
  phoneVerified: {
    type: Boolean,
    default: false,
  },
  // Password reset OTP
  passwordResetOTP: String,
  passwordResetOTPExpires: Date,
  lastLoginAttempts: {
    count: {
      type: Number,
      default: 0
    },
    lastAttempt: Date,
    lockedUntil: Date
  }
}, {
  timestamps: true,
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate OTP
userSchema.methods.generateOTP = function() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
};

// Generate email verification OTP
userSchema.methods.generateEmailOTP = function() {
  const otp = this.generateOTP();
  this.emailOTP = otp;
  this.emailOTPExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  return otp;
};

// Generate phone verification OTP
userSchema.methods.generatePhoneOTP = function() {
  const otp = this.generateOTP();
  this.phoneOTP = otp;
  this.phoneOTPExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  return otp;
};

// Generate password reset OTP
userSchema.methods.generatePasswordResetOTP = function() {
  const otp = this.generateOTP();
  this.passwordResetOTP = otp;
  this.passwordResetOTPExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  return otp;
};

// Verify email OTP
userSchema.methods.verifyEmailOTP = function(otp) {
  return this.emailOTP === otp && this.emailOTPExpires > new Date();
};

// Verify phone OTP
userSchema.methods.verifyPhoneOTP = function(otp) {
  return this.phoneOTP === otp && this.phoneOTPExpires > new Date();
};

// Verify password reset OTP
userSchema.methods.verifyPasswordResetOTP = function(otp) {
  return this.passwordResetOTP === otp && this.passwordResetOTPExpires > new Date();
};

// Clear email OTP
userSchema.methods.clearEmailOTP = function() {
  this.emailOTP = undefined;
  this.emailOTPExpires = undefined;
};

// Clear phone OTP
userSchema.methods.clearPhoneOTP = function() {
  this.phoneOTP = undefined;
  this.phoneOTPExpires = undefined;
};

// Clear password reset OTP
userSchema.methods.clearPasswordResetOTP = function() {
  this.passwordResetOTP = undefined;
  this.passwordResetOTPExpires = undefined;
};

// Encrypt password using bcrypt (only if password exists)
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);

export default User;