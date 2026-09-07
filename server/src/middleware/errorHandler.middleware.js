// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// ERROR HANDLER MIDDLEWARE
// kat-school/server/src/middleware/errorHandler.middleware.js
// ============================================

'use strict';

const mongoose = require('mongoose');
const { HTTP_STATUS } = require('../config/constants');

// ─── Custom Error Class ───────────────────────
class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

// ─── Handle Mongoose Cast Error ───────────────
const handleCastError = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, HTTP_STATUS.BAD_REQUEST, 'INVALID_ID');
};

// ─── Handle Duplicate Key Error ───────────────
const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  const message = `${field.charAt(0).toUpperCase() + field.slice(1)} '${value}' already exists.`;
  return new AppError(message, HTTP_STATUS.CONFLICT, 'DUPLICATE_VALUE');
};

// ─── Handle Validation Error ──────────────────
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map((el) => ({
    field: el.path,
    message: el.message,
  }));
  const message = `Validation failed: ${errors.map((e) => e.message).join('. ')}`;
  return new AppError(message, HTTP_STATUS.BAD_REQUEST, 'VALIDATION_ERROR');
};

// ─── Handle JWT Errors ────────────────────────
const handleJWTError = () =>
  new AppError('Invalid token. Please login again.', HTTP_STATUS.UNAUTHORIZED, 'INVALID_TOKEN');

const handleJWTExpiredError = () =>
  new AppError('Token has expired. Please login again.', HTTP_STATUS.UNAUTHORIZED, 'TOKEN_EXPIRED');

// ─── Send Error Response ──────────────────────
const sendErrorDev = (err, req, res) => {
  return res.status(err.statusCode).json({
    success: false,
    status: err.status,
    error: err,
    message: err.message,
    code: err.code || null,
    stack: err.stack,
  });
};

const sendErrorProd = (err, req, res) => {
  // Operational errors: send message to client
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
      code: err.code || null,
    });
  }

  // Programming errors: don't leak details
  console.error('💥 UNHANDLED ERROR:', err);
  return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    success: false,
    status: 'error',
    message: 'Something went wrong. Please try again.',
  });
};

// ─── Global Error Handler ─────────────────────
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  err.status = err.status || 'error';

  const env = process.env.NODE_ENV;

  if (env === 'development') {
    sendErrorDev(err, req, res);
  } else {
    let error = { ...err };
    error.message = err.message;
    error.name = err.name;

    // Handle specific error types
    if (error.name === 'CastError' || err instanceof mongoose.Error.CastError) {
      error = handleCastError(error);
    }

    if (error.code === 11000) {
      error = handleDuplicateKeyError(error);
    }

    if (error.name === 'ValidationError' || err instanceof mongoose.Error.ValidationError) {
      error = handleValidationError(error);
    }

    if (error.name === 'JsonWebTokenError') {
      error = handleJWTError();
    }

    if (error.name === 'TokenExpiredError') {
      error = handleJWTExpiredError();
    }

    sendErrorProd(error, req, res);
  }
};

// ─── Not Found Handler ────────────────────────
const notFoundHandler = (req, res, next) => {
  const err = new AppError(
    `Route not found: ${req.originalUrl}`,
    HTTP_STATUS.NOT_FOUND,
    'ROUTE_NOT_FOUND'
  );
  next(err);
};

// ─── Async Error Wrapper ──────────────────────
// Wraps async route handlers to catch errors
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// ─── Create App Error ─────────────────────────
const createError = (message, statusCode, code = null) => {
  return new AppError(message, statusCode, code);
};

module.exports = {
  AppError,
  globalErrorHandler,
  notFoundHandler,
  catchAsync,
  createError,
};
