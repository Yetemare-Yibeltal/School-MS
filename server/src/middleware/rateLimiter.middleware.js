'use strict';
const rateLimit = require('express-rate-limit');
const mk = (ms, max, msg) => rateLimit({ windowMs: ms, max, message: { status: 'error', message: msg }, standardHeaders: true, legacyHeaders: false });
exports.authLimiter = mk(15*60*1000, 20, 'Too many auth requests.');
exports.loginLimiter = mk(15*60*1000, 10, 'Too many login attempts.');
exports.passwordResetLimiter = mk(60*60*1000, 5, 'Too many password reset attempts.');
exports.apiLimiter = mk(60*1000, 200, 'Too many requests.');
exports.aiLimiter = mk(60*1000, 10, 'AI limit reached.');
exports.uploadLimiter = mk(60*1000, 30, 'Too many uploads.');