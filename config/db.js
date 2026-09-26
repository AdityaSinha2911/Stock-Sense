/**
 * ============================================================================
 * StockSense IMS - Database Connection Module
 * ============================================================================
 * Handles the connection lifecycle between the Express backend application
 * and the MongoDB database instance using the Mongoose ODM (Object Data Modeling).
 * 
 * Supports:
 * - Local MongoDB instances (e.g., mongodb://127.0.0.1:27017/stocksense)
 * - Cloud MongoDB Atlas clusters (e.g., mongodb+srv://...)
 * - Automatic reconnection listeners and connection error diagnostics
 * ============================================================================
 */

const mongoose = require('mongoose');

/**
 * Establishes a singleton connection to MongoDB.
 * Reads the connection URI from the environment variable `MONGODB_URI`.
 * Falls back to the default local MongoDB URI if undefined.
 * 
 * @async
 * @function connectDB
 * @returns {Promise<typeof mongoose>} Mongoose instance
 */
const connectDB = async () => {
  try {
    // 1. Retrieve connection string from environment or use local fallback
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/stocksense';
    
    // 2. Initiate connection with Mongoose
    const conn = await mongoose.connect(mongoURI, {
      // In Mongoose 6+, options like useNewUrlParser, useUnifiedTopology,
      // and useCreateIndex are true by default and deprecated if passed manually.
    });

    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}, database: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    // Log fatal connection error and terminate process with failure code
    console.error(`[MongoDB] Fatal connection error: ${error.message}`);
    process.exit(1);
  }
};

/**
 * Event Listener: Disconnection
 * Emitted when Mongoose loses connection to the MongoDB replica set or server.
 */
mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB] Connection lost. Attempting auto-reconnection...');
});

/**
 * Event Listener: Reconnected
 * Emitted when Mongoose successfully reconnects after a disconnect.
 */
mongoose.connection.on('reconnected', () => {
  console.log('[MongoDB] Successfully reconnected to database.');
});

/**
 * Event Listener: Error
 * Emitted when an error occurs on the active database connection.
 */
mongoose.connection.on('error', (err) => {
  console.error(`[MongoDB] Runtime connection error: ${err.message}`);
});

module.exports = connectDB;
