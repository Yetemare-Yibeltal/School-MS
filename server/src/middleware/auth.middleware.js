// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// AUTH MIDDLEWARE
// kat-school/server/src/middleware/auth.middleware.js
// ============================================

'use strict';

const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const AuditLog = require('../models/AuditLog');
const { HTTP_STATUS, MESSAGES } = require('../config/constants');

// ─── Protect Route ───────────────────────────
// Verifies JWT access token and attaches user to req
const protect = async (req, res, next) => {
  try {
    let token;

    // Get token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Access denied. No token provided.',
        code: 'NO_TOKEN',
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'Token expired. Please refresh.',
          code: 'TOKEN_EXPIRED',
        });
      }
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Invalid token.',
        code: 'INVALID_TOKEN',
      });
    }

    // Get user from database
    const user = await User.findById(decoded.id).select('+passwordChangedAt');

    if (!user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'User no longer exists.',
        code: 'USER_NOT_FOUND',
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Your account has been deactivated.',
        code: 'ACCOUNT_INACTIVE',
      });
    }

    // Check if account is locked
    if (user.isAccountLocked()) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Account is temporarily locked.',
        code: 'ACCOUNT_LOCKED',
      });
    }

    // Check if password was changed after token issued
    if (user.passwordChangedAfter(decoded.iat)) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Password recently changed. Please login again.',
        code: 'PASSWORD_CHANGED',
      });
    }

    // Check if temporary password needs to be changed
    if (user.isTemporaryPassword && !req.path.includes('/auth/change-password')) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Please change your temporary password.',
        code: 'TEMPORARY_PASSWORD',
        redirectTo: '/auth/change-password',
      });
    }

    // Attach user to request
    req.user = user;
    req.userId = user._id;
    req.userRole = user.role;

    // Attach IP and user agent for audit logging
    req.ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
    req.userAgent = req.headers['user-agent'];

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Authentication error.',
    });
  }
};

// ─── Optional Auth ────────────────────────────
// Attaches user if token present but does NOT require it
const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) return next();

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (user && user.isActive) {
        req.user = user;
        req.userId = user._id;
        req.userRole = user.role;
      }
    } catch {
      // Token invalid — continue without user
    }

    next();
  } catch (error) {
    next();
  }
};

// ─── Refresh Token Handler ────────────────────
const refreshAccessToken = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!refreshToken) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'No refresh token provided.',
        code: 'NO_REFRESH_TOKEN',
      });
    }

    // Find valid refresh token
    const tokenDoc = await RefreshToken.findValidToken(refreshToken);

    if (!tokenDoc) {
      // Possible reuse attack — check if this token's family exists
      const revokedToken = await RefreshToken.findOne({
        tokenHash: RefreshToken.hashToken(refreshToken),
      });

      if (revokedToken) {
        // Revoke all tokens in this family
        await RefreshToken.revokeFamily(revokedToken.family, 'suspicious_activity');

        await AuditLog.log({
          action: 'TOKEN_REUSE_DETECTED',
          resource: 'auth',
          description: 'Refresh token reuse detected — all sessions revoked',
          ipAddress: req.ip,
          severity: 'high',
          status: 'failure',
        });
      }

      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Invalid or expired refresh token.',
        code: 'INVALID_REFRESH_TOKEN',
      });
    }

    const user = tokenDoc.user;

    if (!user || !user.isActive) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'User not found or inactive.',
      });
    }

    // Rotate refresh token
    const newTokenData = await RefreshToken.rotateToken({
      oldToken: refreshToken,
      userId: user._id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      family: tokenDoc.family,
    });

    // Generate new access token
    const accessToken = generateAccessToken(user);

    // Set cookies
    setTokenCookies(res, accessToken, newTokenData.token);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      accessToken,
      refreshToken: newTokenData.token,
      user: user.toSafeObject(),
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Token refresh failed.',
    });
  }
};

// ─── Generate Access Token ────────────────────
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      email: user.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    }
  );
};

// ─── Generate Refresh Token ───────────────────
const generateRefreshToken = async (userId, ipAddress, userAgent, family = null) => {
  return RefreshToken.createToken({
    userId,
    ipAddress,
    userAgent,
    family,
    expiryDays: parseInt(process.env.REFRESH_TOKEN_DAYS || '7'),
  });
};

// ─── Set Token Cookies ────────────────────────
const setTokenCookies = (res, accessToken, refreshToken) => {
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: parseInt(process.env.REFRESH_TOKEN_DAYS || '7') * 24 * 60 * 60 * 1000,
    path: '/api/auth/refresh',
  });
};

// ─── Clear Token Cookies ──────────────────────
const clearTokenCookies = (res) => {
  res.cookie('accessToken', '', {
    httpOnly: true,
    expires: new Date(0),
  });
  res.cookie('refreshToken', '', {
    httpOnly: true,
    expires: new Date(0),
    path: '/api/auth/refresh',
  });
};

// ─── Verify Email Token ───────────────────────
const verifyEmailToken = async (req, res, next) => {
  try {
    const { token } = req.params;
    if (!token) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Verification token is required.',
      });
    }

    const crypto = require('crypto');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Invalid or expired verification token.',
      });
    }

    req.verificationUser = user;
    next();
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Email verification failed.',
    });
  }
};

module.exports = {
  protect,
  optionalAuth,
  refreshAccessToken,
  generateAccessToken,
  generateRefreshToken,
  setTokenCookies,
  clearTokenCookies,
  verifyEmailToken,
};
