// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// AUTH CONTROLLER
// kat-school/server/src/controllers/auth.controller.js
// ============================================

'use strict';

const crypto = require('crypto');
const mongoose = require('mongoose');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const AuditLog = require('../models/AuditLog');
const {
  generateAccessToken,
  generateRefreshToken,
  setTokenCookies,
  clearTokenCookies,
} = require('../middleware/auth.middleware');
const { sendWelcomeEmail, sendPasswordResetEmail, sendVerificationEmail } = require('../utils/email.util');
const { auditLog } = require('../middleware/audit.middleware');
const { catchAsync } = require('../middleware/errorHandler.middleware');
const { HTTP_STATUS } = require('../config/constants');

// ─── Register ─────────────────────────────────
exports.register = catchAsync(async (req, res) => {
  const {
    firstName,
    fatherName,
    grandFatherName,
    email,
    phone,
    password,
    role,
    gender,
    dateOfBirth,
  } = req.body;

  // Check if email already exists
  const existingUser = await User.findOne({
    email: email.toLowerCase(),
  });

  if (existingUser) {
    return res.status(HTTP_STATUS.CONFLICT).json({
      success: false,
      message: 'An account with this email already exists.',
      code: 'EMAIL_EXISTS',
    });
  }

  // Create user
  const user = await User.create({
    firstName,
    fatherName,
    grandFatherName,
    email: email.toLowerCase(),
    phone,
    password,
    role,
    gender,
    dateOfBirth,
    createdBy: req.user?._id || null,
  });

  // Generate email verification token
  const verificationToken = user.generateEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  // Send welcome email
  try {
    const verificationUrl = `${process.env.CLIENT_URL}/auth/verify-email/${verificationToken}`;
    await sendVerificationEmail(user, verificationUrl);
  } catch (emailError) {
    console.error('Welcome email failed:', emailError.message);
  }

  // Audit log
  await auditLog({
    req,
    action: 'CREATE_USER',
    resource: 'user',
    resourceId: user._id,
    description: `New user registered: ${user.email} (${user.role})`,
  });

  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Account created successfully. Please verify your email.',
    data: {
      user: user.toSafeObject(),
    },
  });
});

// ─── Login ────────────────────────────────────
exports.login = catchAsync(async (req, res) => {
  const { email, password, rememberMe } = req.body;

  if (!email || !password) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Email and password are required.',
    });
  }

  // Find user with password
  const user = await User.findOne({
    email: email.toLowerCase(),
  }).select(
    '+password +loginAttempts +lockUntil +passwordChangedAt +isTemporaryPassword'
  );

  if (!user) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'Invalid email or password.',
      code: 'INVALID_CREDENTIALS',
    });
  }

  // Check if account is locked
  if (user.isAccountLocked()) {
    const lockMinutes = Math.ceil(
      (user.lockUntil - Date.now()) / 60000
    );
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: `Account locked due to too many failed attempts. Try again in ${lockMinutes} minute(s).`,
      code: 'ACCOUNT_LOCKED',
      lockedUntil: user.lockUntil,
    });
  }

  // Check if account is active
  if (!user.isActive) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'Your account has been deactivated. Please contact the administrator.',
      code: 'ACCOUNT_INACTIVE',
    });
  }

  // Verify password
  const isPasswordCorrect = await user.comparePassword(password);

  if (!isPasswordCorrect) {
    await user.incrementLoginAttempts();

    const attemptsLeft =
      (parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5) -
      (user.loginAttempts + 1);

    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: `Invalid email or password. ${
        attemptsLeft > 0
          ? `${attemptsLeft} attempt(s) remaining.`
          : 'Account locked.'
      }`,
      code: 'INVALID_CREDENTIALS',
      attemptsLeft: Math.max(0, attemptsLeft),
    });
  }

  // Reset login attempts on success
  await user.resetLoginAttempts();

  // Update last login
  user.lastLogin = new Date();
  user.lastLoginIP =
    req.ip || req.connection?.remoteAddress;
  await user.save({ validateBeforeSave: false });

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshTokenData = await generateRefreshToken(
    user._id,
    req.ip,
    req.headers['user-agent'],
    null
  );

  // Set cookies
  setTokenCookies(res, accessToken, refreshTokenData.token);

  // Audit log
  await auditLog({
    req,
    action: 'LOGIN',
    resource: 'auth',
    description: `User logged in: ${user.email}`,
    severity: 'low',
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Login successful.',
    data: {
      user: user.toSafeObject(),
      accessToken,
      refreshToken: refreshTokenData.token,
      isTemporaryPassword: user.isTemporaryPassword,
    },
  });
});

// ─── Logout ───────────────────────────────────
exports.logout = catchAsync(async (req, res) => {
  const refreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (refreshToken) {
    try {
      await RefreshToken.revokeToken(
        refreshToken,
        'logout'
      );
    } catch (err) {
      // Non-critical
    }
  }

  clearTokenCookies(res);

  await auditLog({
    req,
    action: 'LOGOUT',
    resource: 'auth',
    description: `User logged out: ${req.user?.email}`,
    severity: 'low',
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Logged out successfully.',
  });
});

// ─── Get Current User ─────────────────────────
exports.getMe = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('roleRef', 'name permissions')
    .lean();

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'User profile fetched.',
    data: { user },
  });
});

// ─── Update Profile ───────────────────────────
exports.updateProfile = catchAsync(async (req, res) => {
  const allowedFields = [
    'firstName',
    'fatherName',
    'grandFatherName',
    'phone',
    'dateOfBirth',
    'bio',
    'address',
  ];

  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  const user = await User.findByIdAndUpdate(
    req.user._id,
    updates,
    { new: true, runValidators: true }
  );

  await auditLog({
    req,
    action: 'UPDATE',
    resource: 'user',
    resourceId: user._id,
    description: `User updated their profile: ${user.email}`,
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Profile updated successfully.',
    data: { user: user.toSafeObject() },
  });
});

// ─── Change Password ──────────────────────────
exports.changePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select(
    '+password'
  );

  // Verify current password
  const isCorrect = await user.comparePassword(currentPassword);
  if (!isCorrect) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'Current password is incorrect.',
      code: 'WRONG_PASSWORD',
    });
  }

  // Prevent using the same password
  const isSamePassword = await user.comparePassword(newPassword);
  if (isSamePassword) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'New password must be different from the current password.',
    });
  }

  user.password = newPassword;
  user.isTemporaryPassword = false;
  user.passwordChangedAt = new Date();
  await user.save();

  // Revoke all existing refresh tokens (force re-login on other devices)
  await RefreshToken.revokeAllForUser(
    user._id,
    'password_changed'
  );

  clearTokenCookies(res);

  await auditLog({
    req,
    action: 'CHANGE_PASSWORD',
    resource: 'auth',
    resourceId: user._id,
    description: `Password changed for: ${user.email}`,
    severity: 'medium',
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Password changed successfully. Please login again.',
  });
});

// ─── Forgot Password ──────────────────────────
exports.forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({
    email: email.toLowerCase(),
    isActive: true,
  });

  // Always respond with success to prevent email enumeration
  if (!user) {
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'If an account with that email exists, a reset link has been sent.',
    });
  }

  // Generate reset token
  const resetToken = user.generatePasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL}/auth/reset-password/${resetToken}`;

  try {
    await sendPasswordResetEmail(user, resetToken, resetUrl);

    await auditLog({
      req,
      action: 'PASSWORD_RESET_REQUEST',
      resource: 'auth',
      resourceId: user._id,
      description: `Password reset requested for: ${user.email}`,
      severity: 'medium',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to send reset email. Please try again.',
    });
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'If an account with that email exists, a reset link has been sent.',
  });
});

// ─── Reset Password ───────────────────────────
exports.resetPassword = catchAsync(async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  // Hash token to match stored hash
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
    isActive: true,
  });

  if (!user) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Reset token is invalid or has expired.',
      code: 'INVALID_RESET_TOKEN',
    });
  }

  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.isTemporaryPassword = false;
  user.passwordChangedAt = new Date();
  await user.save();

  // Revoke all refresh tokens
  await RefreshToken.revokeAllForUser(user._id, 'password_reset');

  await auditLog({
    req,
    action: 'PASSWORD_RESET',
    resource: 'auth',
    resourceId: user._id,
    description: `Password reset completed for: ${user.email}`,
    severity: 'medium',
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Password reset successful. Please login with your new password.',
  });
});

// ─── Verify Email ─────────────────────────────
exports.verifyEmail = catchAsync(async (req, res) => {
  const { token } = req.params;

  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Verification token is invalid or has expired.',
      code: 'INVALID_VERIFICATION_TOKEN',
    });
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save({ validateBeforeSave: false });

  await auditLog({
    req,
    action: 'VERIFY_EMAIL',
    resource: 'auth',
    resourceId: user._id,
    description: `Email verified for: ${user.email}`,
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Email verified successfully.',
    data: { user: user.toSafeObject() },
  });
});

// ─── Resend Verification ──────────────────────
exports.resendVerification = catchAsync(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({
    email: email.toLowerCase(),
    isActive: true,
  });

  if (!user) {
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'If the account exists, a verification email has been sent.',
    });
  }

  if (user.isEmailVerified) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Email is already verified.',
    });
  }

  const verificationToken = user.generateEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  const verificationUrl = `${process.env.CLIENT_URL}/auth/verify-email/${verificationToken}`;
  await sendVerificationEmail(user, verificationUrl);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Verification email sent.',
  });
});

// ─── Upload Profile Photo ─────────────────────
exports.uploadProfilePhoto = catchAsync(async (req, res) => {
  if (!req.file) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Please upload a photo.',
    });
  }

  const { uploadProfilePhoto } = require('../utils/fileUpload.util');
  const result = await uploadProfilePhoto(req.file.path, 'admin');

  if (!result.success) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Photo upload failed.',
    });
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      'photo.url': result.url,
      'photo.publicId': result.publicId,
    },
    { new: true }
  );

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Profile photo updated.',
    data: {
      photo: user.photo,
    },
  });
});

// ─── Get All Users (Admin) ────────────────────
exports.getAllUsers = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    role,
    isActive,
    search,
    sort = 'createdAt',
    order = 'desc',
  } = req.query;

  const filter = {};
  if (role) filter.role = role;
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  if (search) {
    const regex = { $regex: search, $options: 'i' };
    filter.$or = [
      { firstName: regex },
      { fatherName: regex },
      { email: regex },
      { phone: regex },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sortObj = { [sort]: order === 'asc' ? 1 : -1 };

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-password -loginAttempts -lockUntil')
      .lean(),
    User.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / parseInt(limit));

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Users fetched successfully.',
    data: { users },
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages,
      hasNextPage: parseInt(page) < totalPages,
      hasPreviousPage: parseInt(page) > 1,
    },
  });
});

// ─── Get User by ID (Admin) ───────────────────
exports.getUserById = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select('-password -loginAttempts -lockUntil')
    .lean();

  if (!user) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'User not found.',
    });
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'User fetched.',
    data: { user },
  });
});

// ─── Update User (Admin) ──────────────────────
exports.updateUser = catchAsync(async (req, res) => {
  const forbiddenFields = ['password', 'email', 'loginAttempts', 'lockUntil'];
  forbiddenFields.forEach((f) => delete req.body[f]);

  const user = await User.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).select('-password');

  if (!user) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'User not found.',
    });
  }

  await auditLog({
    req,
    action: 'UPDATE',
    resource: 'user',
    resourceId: user._id,
    description: `User updated by admin: ${user.email}`,
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'User updated successfully.',
    data: { user },
  });
});

// ─── Deactivate User ──────────────────────────
exports.deactivateUser = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'User not found.',
    });
  }

  if (user._id.toString() === req.user._id.toString()) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'You cannot deactivate your own account.',
    });
  }

  user.isActive = false;
  await user.save({ validateBeforeSave: false });

  // Revoke all tokens
  await RefreshToken.revokeAllForUser(user._id, 'account_deactivated');

  await auditLog({
    req,
    action: 'DEACTIVATE',
    resource: 'user',
    resourceId: user._id,
    description: `User deactivated: ${user.email}`,
    severity: 'high',
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'User deactivated successfully.',
  });
});

// ─── Reactivate User ──────────────────────────
exports.reactivateUser = catchAsync(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    {
      isActive: true,
      loginAttempts: 0,
      lockUntil: undefined,
    },
    { new: true }
  );

  if (!user) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'User not found.',
    });
  }

  await auditLog({
    req,
    action: 'REACTIVATE',
    resource: 'user',
    resourceId: user._id,
    description: `User reactivated: ${user.email}`,
    severity: 'medium',
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'User reactivated successfully.',
    data: { user: user.toSafeObject() },
  });
});

// ─── Reset User Password (Admin) ──────────────
exports.resetUserPassword = catchAsync(async (req, res) => {
  const { temporaryPassword } = req.body;

  if (!temporaryPassword) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Temporary password is required.',
    });
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'User not found.',
    });
  }

  user.password = temporaryPassword;
  user.isTemporaryPassword = true;
  user.passwordChangedAt = new Date();
  await user.save();

  await RefreshToken.revokeAllForUser(user._id, 'admin_password_reset');

  try {
    await sendWelcomeEmail(user, temporaryPassword);
  } catch (err) {
    console.error('Email failed:', err.message);
  }

  await auditLog({
    req,
    action: 'RESET_PASSWORD',
    resource: 'user',
    resourceId: user._id,
    description: `Password reset by admin for: ${user.email}`,
    severity: 'high',
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Password reset successfully. Temporary password sent to user email.',
  });
});

// ─── Get Auth Stats (Admin) ───────────────────
exports.getAuthStats = catchAsync(async (req, res) => {
  const [
    totalUsers,
    activeUsers,
    byRole,
    recentLogins,
    activeTokens,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    User.find({ lastLogin: { $exists: true } })
      .sort({ lastLogin: -1 })
      .limit(10)
      .select('firstName fatherName email role lastLogin lastLoginIP'),
    RefreshToken.countDocuments({
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    }),
  ]);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Auth stats fetched.',
    data: {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      byRole,
      recentLogins,
      activeTokens,
    },
  });
});