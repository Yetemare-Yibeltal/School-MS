// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// CORS CONFIGURATION
// ============================================

'use strict';

// ─── Allowed Origins ──────────────────────────
// List of URLs allowed to access the API
const ALLOWED_ORIGINS = [
  // Development
  'http://localhost:5173', // Vite dev server
  'http://localhost:5174', // Vite dev server (alternate port)
  'http://localhost:3000', // Create React App (if used)
  'http://127.0.0.1:5173', // Vite dev server (IP)
  'http://127.0.0.1:3000', // CRA (IP)

  // Production — add your deployed frontend URL here
  process.env.CLIENT_URL,

  // Staging
  process.env.STAGING_URL,
].filter(Boolean); // Remove undefined/null values

// ─── CORS Options ─────────────────────────────
const corsOptions = {
  // ─── Origin Check Function ─────────────────
  // Dynamically check if the request origin is allowed
  origin: (origin, callback) => {
    // Allow requests with no origin
    // (mobile apps, Postman, curl, server-to-server)
    if (!origin) {
      return callback(null, true);
    }

    // Check if origin is in the allowed list
    if (ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }

    // In development — allow all localhost origins
    if (
      process.env.NODE_ENV === 'development' &&
      (origin.includes('localhost') || origin.includes('127.0.0.1'))
    ) {
      return callback(null, true);
    }

    // Origin not allowed
    console.warn(`⚠️  CORS blocked request from origin: ${origin}`);
    return callback(new Error(`CORS policy: Origin ${origin} is not allowed`), false);
  },

  // ─── Allowed HTTP Methods ───────────────────
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],

  // ─── Allowed Request Headers ────────────────
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma',
    'X-Access-Token',
    'X-Refresh-Token',
    'X-API-Key',
  ],

  // ─── Exposed Response Headers ───────────────
  // Headers the browser can access in the response
  exposedHeaders: [
    'Content-Length',
    'Content-Type',
    'X-Total-Count',
    'X-Page-Count',
    'X-Current-Page',
    'X-Per-Page',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
  ],

  // ─── Allow Credentials ──────────────────────
  // Required for cookies and HTTP authentication
  // Must be true to send/receive cookies cross-origin
  credentials: true,

  // ─── Preflight Cache ─────────────────────────
  // How long (in seconds) the preflight request
  // result can be cached by the browser
  maxAge: 86400, // 24 hours

  // ─── Success Status ──────────────────────────
  // Some browsers (IE11) choke on 204 for preflight
  optionsSuccessStatus: 200,

  // ─── Preflight Continue ──────────────────────
  // Pass the CORS preflight response to the next handler
  preflightContinue: false,
};

// ─── Development CORS (permissive) ───────────
// Used in development — allows all origins
const devCorsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['*'],
  credentials: false, // Cannot use wildcard origin with credentials
  optionsSuccessStatus: 200,
};

// ─── Export based on environment ─────────────
module.exports = process.env.NODE_ENV === 'production' ? corsOptions : corsOptions;

// Export both for flexibility
module.exports.corsOptions = corsOptions;
module.exports.devCorsOptions = devCorsOptions;
module.exports.ALLOWED_ORIGINS = ALLOWED_ORIGINS;
