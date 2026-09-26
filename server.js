/**
 * ============================================================================
 * StockSense IMS - Express Application Entry Point
 * ============================================================================
 * Central server file that initializes:
 * 1. Environment variables via dotenv.
 * 2. MongoDB connection lifecycle via Mongoose.
 * 3. HTTP parsing, CORS security, and JSON body parsing middleware.
 * 4. Static asset serving for the front-end application (HTML/CSS/JS).
 * 5. REST API route mounting under `/api/*`.
 * 6. Server healthcheck and database connectivity monitoring endpoint.
 * 7. 404 handler and centralized global error handling.
 * ============================================================================
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// 1. Load environment configuration (.env)
dotenv.config();

// 2. Initialize database connection
const connectDB = require('./config/db');
connectDB();

const app = express();

// 3. Security & Body Parsing Middleware
app.use(cors()); // Allow cross-origin requests
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded form data

// 4. Static Frontend Hosting: Serves files from front-end folder
app.use(express.static(path.join(__dirname, 'front-end')));

// 5. REST API Route Handlers
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/stock', require('./routes/stockRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/suppliers', require('./routes/supplierRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));

/**
 * ----------------------------------------------------------------------------
 * Healthcheck Endpoint
 * @route GET /api/health
 * Returns server operational status and real-time MongoDB connection state
 * ----------------------------------------------------------------------------
 */
app.get('/api/health', (req, res) => {
  // readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({
    status: 'online',
    appName: 'StockSense IMS',
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatus,
      host: mongoose.connection.host,
      name: mongoose.connection.name
    }
  });
});

/**
 * Root Route:
 * Serves the login page by default when visiting root URL
 */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'front-end', 'login.html'));
});

/**
 * 404 Handler for undefined API routes
 */
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: 'API route not found' });
});

/**
 * Centralized Global Error Handler
 */
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// 6. Bind to Port and Start HTTP Listener
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 StockSense Server running on port ${PORT}`);
  console.log(`🌐 Local URL: http://localhost:${PORT}`);
  console.log(`📦 Healthcheck: http://localhost:${PORT}/api/health`);
  console.log(`===============================================`);
});

module.exports = app;
