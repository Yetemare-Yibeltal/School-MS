const rateLimit = require('express-rate-limit');

const createLimiter = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max,
    message: { status: 'error', message },
    standardHeaders: true,
    legacyHeaders: false,
  });

exports.authLimiter = createLimiter(
  15 * 60 * 1000,
  20,
  'Too many requests from this IP, please try again after 15 minutes.'
);

exports.apiLimiter = createLimiter(
  60 * 1000,
  200,
  'Too many requests from this IP, please try again after 1 minute.'
);

exports.aiLimiter = createLimiter(
  60 * 1000,
  10,
  'AI request limit reached. Please wait before sending more requests.'
);
