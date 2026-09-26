/**
 * ============================================================================
 * StockSense IMS - Database Connection Module
 * ============================================================================
 * Handles the connection lifecycle between the Express backend application
 * and the MongoDB database instance using the Mongoose ODM (Object Data Modeling).
 * 
 * Features:
 * - Direct connection to Cloud MongoDB Atlas (via MONGODB_URI)
 * - Direct connection to local MongoDB service (if running on machine)
 * - Automatic embedded MongoDB runner (via mongodb-memory-server) with
 *   disk persistence to ./.data/db if no local MongoDB service is installed.
 * - Graceful shutdown and reconnection listeners.
 * ============================================================================
 */

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

let mongoServer = null;

/**
 * Starts the embedded MongoDB server if local mongod is not installed/running.
 * Persists database files locally to ./.data/db so data remains saved.
 */
const startEmbeddedMongo = async () => {
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const dbPath = path.join(__dirname, '..', '.data', 'db');

    // Ensure data directory exists
    if (!fs.existsSync(dbPath)) {
      fs.mkdirSync(dbPath, { recursive: true });
    }

    console.log('[MongoDB] Starting embedded MongoDB server (persisting to .data/db)...');
    mongoServer = await MongoMemoryServer.create({
      instance: {
        port: 27017,
        dbPath,
        storageEngine: 'wiredTiger'
      }
    });

    const uri = mongoServer.getUri() + 'stocksense';
    console.log(`[MongoDB] Embedded MongoDB ready at: ${uri}`);
    return uri;
  } catch (error) {
    // If port 27017 is already in use by another instance, let MongoMemoryServer choose a free port
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoServer = await MongoMemoryServer.create();
      const fallbackUri = mongoServer.getUri() + 'stocksense';
      console.log(`[MongoDB] Embedded MongoDB ready on dynamic port: ${fallbackUri}`);
      return fallbackUri;
    } catch (err) {
      console.error('[MongoDB] Failed to start embedded server:', err.message);
      throw err;
    }
  }
};

/**
 * Establishes connection to MongoDB.
 * 
 * @async
 * @function connectDB
 * @returns {Promise<typeof mongoose>} Mongoose instance
 */
const connectDB = async () => {
  let mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/stocksense';

  try {
    // 1. First attempt connecting to the configured URI
    console.log(`[MongoDB] Attempting connection to: ${mongoURI}`);
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 3000 // Quick timeout to failover if no local daemon
    });

    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}, database: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    // 2. If connection failed and URI is pointing to localhost, launch embedded MongoDB!
    const isLocalhost = mongoURI.includes('127.0.0.1') || mongoURI.includes('localhost');
    
    if (isLocalhost) {
      console.log('[MongoDB] Local MongoDB daemon not active. Initializing zero-config embedded MongoDB...');
      try {
        mongoURI = await startEmbeddedMongo();
        const conn = await mongoose.connect(mongoURI);
        console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}, database: ${conn.connection.name}`);
        return conn;
      } catch (embeddedError) {
        console.error(`[MongoDB] Fatal error initializing embedded database: ${embeddedError.message}`);
        process.exit(1);
      }
    } else {
      console.error(`[MongoDB] Fatal connection error: ${error.message}`);
      process.exit(1);
    }
  }
};

/**
 * Graceful termination handler
 */
const closeDB = async () => {
  await mongoose.connection.close();
  if (mongoServer) {
    await mongoServer.stop();
  }
};

process.on('SIGINT', async () => {
  await closeDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeDB();
  process.exit(0);
});

mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB] Connection lost. Attempting auto-reconnection...');
});

mongoose.connection.on('reconnected', () => {
  console.log('[MongoDB] Successfully reconnected to database.');
});

module.exports = connectDB;
