// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// MONGODB DATABASE CONNECTION
// ============================================

'use strict';

const mongoose = require('mongoose');

// ─── Connection Options ───────────────────────
const mongooseOptions = {
  // Use new URL parser
  useNewUrlParser: true,
  useUnifiedTopology: true,

  // Auto-create indexes in background
  autoIndex: true,

  // Keep connection alive
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,

  // Connection pool
  maxPoolSize: 10,
  minPoolSize: 2,

  // Heartbeat
  heartbeatFrequencyMS: 10000,

  // Retry writes on failure
  retryWrites: true,

  // Write concern
  w: 'majority',
};

// ─── Mongoose Global Settings ─────────────────
// Throw error when querying with undefined field
mongoose.set('strictQuery', true);

// ─── Connection State Tracker ─────────────────
let isConnected = false;

// ─── Connect to MongoDB ───────────────────────
const connectDB = async () => {
  // Return early if already connected
  if (isConnected) {
    console.info('✅ MongoDB already connected');
    return;
  }

  try {
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    console.info('🔄 Connecting to MongoDB Atlas...');

    const conn = await mongoose.connect(mongoURI, mongooseOptions);

    isConnected = true;

    console.info('');
    console.info('✅ MongoDB Connected Successfully');
    console.info(`   Host     : ${conn.connection.host}`);
    console.info(`   Database : ${conn.connection.name}`);
    console.info(`   Port     : ${conn.connection.port}`);
    console.info('');
  } catch (error) {
    console.error('❌ MongoDB Connection Failed');
    console.error(`   Error: ${error.message}`);

    // Exit process with failure
    process.exit(1);
  }
};

// ─── Connection Event Listeners ───────────────

// Successfully connected
mongoose.connection.on('connected', () => {
  isConnected = true;
  console.info('📦 Mongoose connected to MongoDB Atlas');
});

// Connection error
mongoose.connection.on('error', (error) => {
  isConnected = false;
  console.error('❌ Mongoose connection error:', error.message);
});

// Disconnected
mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.warn('⚠️  Mongoose disconnected from MongoDB');

  // Auto-reconnect after 5 seconds
  if (process.env.NODE_ENV !== 'test') {
    console.info('🔄 Attempting to reconnect in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
});

// Reconnected
mongoose.connection.on('reconnected', () => {
  isConnected = true;
  console.info('✅ Mongoose reconnected to MongoDB Atlas');
});

// Connection open
mongoose.connection.on('open', () => {
  console.info('📂 MongoDB connection is open and ready');
});

// ─── Graceful Shutdown ────────────────────────
// Close connection when Node process ends
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.info('✅ MongoDB connection closed through app termination');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error closing MongoDB connection:', error.message);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  try {
    await mongoose.connection.close();
    console.info('✅ MongoDB connection closed through SIGTERM');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error closing MongoDB connection:', error.message);
    process.exit(1);
  }
});

// ─── Helper Functions ─────────────────────────

// Check if currently connected
const isDBConnected = () => isConnected;

// Get current connection state
const getConnectionState = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
    99: 'uninitialized',
  };
  return states[mongoose.connection.readyState] || 'unknown';
};

// Drop database — only for testing
const dropDatabase = async () => {
  if (process.env.NODE_ENV === 'test') {
    await mongoose.connection.dropDatabase();
    console.info('🗑️  Test database dropped');
  }
};

// Disconnect — used in tests
const disconnectDB = async () => {
  await mongoose.connection.close();
  isConnected = false;
  console.info('📦 MongoDB disconnected');
};

module.exports = connectDB;
module.exports.isDBConnected = isDBConnected;
module.exports.getConnectionState = getConnectionState;
module.exports.dropDatabase = dropDatabase;
module.exports.disconnectDB = disconnectDB;
