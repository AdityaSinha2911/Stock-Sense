/**
 * ============================================================================
 * StockSense IMS - Authentication & Authorization Middleware
 * ============================================================================
 * Secures REST API routes using JSON Web Tokens (JWT) and enforces
 * Role-Based Access Control (RBAC).
 * ============================================================================
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware: protect
 * Verifies the incoming Bearer token from the `Authorization` HTTP header.
 * Attaches the authenticated User document to `req.user` if valid.
 */
const protect = async (req, res, next) => {
  let token;

  // Extract Bearer token from headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Reject request if token is absent
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authorization token provided.'
    });
  }

  try {
    // Verify token validity against secret
    const secret = process.env.JWT_SECRET || 'stocksense_dev_secret_key_2026';
    const decoded = jwt.verify(token, secret);

    // Fetch user record from database (excluding password hash)
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.'
      });
    }

    next(); // Proceed to route handler
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.'
    });
  }
};

/**
 * Middleware: authorize
 * Restricts access to routes based on allowed user roles.
 * 
 * @param  {...string} roles - Permitted user roles (e.g., 'admin', 'manager')
 * @returns {Function} Express middleware function
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user ? req.user.role : 'guest'}' is not authorized to access this route.`
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
