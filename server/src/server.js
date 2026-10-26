// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// SERVER ENTRY POINT
// kat-school/server/src/server.js
// ============================================

const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const app = require('./app');

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('FATAL ERROR: MONGODB_URI is not defined in .env file.');
  process.exit(1);
}

// ─── Unhandled Promise Rejections ─────────────
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err.name, err.message);
  server.close(() => process.exit(1));
});

// ─── Uncaught Exceptions ──────────────────────
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err.name, err.message);
  process.exit(1);
});

// ─── Connect to MongoDB ───────────────────────
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}`);
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

// ─── Start Server ─────────────────────────────
const startServer = async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log('');
    console.log('==============================================');
    console.log('  KAT SECONDARY SCHOOL MANAGEMENT SYSTEM');
    console.log('==============================================');
    console.log(`  Server running on port ${PORT}`);
    console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`  API Base URL: http://localhost:${PORT}/api`);
    console.log('==============================================');
    console.log('');
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
      mongoose.connection.close(false, () => {
        console.log('MongoDB connection closed.');
        process.exit(0);
      });
    });
  });

  return server;
};

startServer();
