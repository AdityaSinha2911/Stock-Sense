/**
 * ============================================================================
 * StockSense IMS - Authentication API Routes
 * ============================================================================
 * Endpoints:
 * - POST /api/auth/register : Register new user with password hashing
 * - POST /api/auth/login    : Verify credentials and issue signed JWT
 * - GET  /api/auth/me       : Retrieve currently authenticated user's profile
 * ============================================================================
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

/**
 * Helper: Generate signed JSON Web Token (JWT)
 * @param {string} id - User ObjectId string
 * @returns {string} Signed JWT token
 */
const generateToken = (id) => {
  const secret = process.env.JWT_SECRET || 'stocksense_dev_secret_key_2026';
  return jwt.sign({ id }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

/**
 * ----------------------------------------------------------------------------
 * @route   POST /api/auth/register
 * @desc    Registers a new user in MongoDB and returns an auth token
 * @access  Public
 * ----------------------------------------------------------------------------
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // 1. Validate required payload attributes
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password'
      });
    }

    // 2. Query MongoDB: Check if email is already taken
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists'
      });
    }

    // 3. Database Write: Insert new user document (password hashed by pre-save hook)
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'staff'
    });

    // 4. Generate authentication token for direct login
    const token = generateToken(user._id);

    // 5. Send HTTP 201 Created response
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * ----------------------------------------------------------------------------
 * @route   POST /api/auth/login
 * @desc    Authenticates credentials against MongoDB and returns JWT
 * @access  Public
 * ----------------------------------------------------------------------------
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validate presence of credentials
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email and password'
      });
    }

    // 2. Query MongoDB: Find user by email and explicitly include password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // 3. Verify bcrypt hash match
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // 4. Database Write: Update lastLogin timestamp without re-validating password
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // 5. Generate signed JWT token
    const token = generateToken(user._id);

    // 6. Return response with token and user details
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * ----------------------------------------------------------------------------
 * @route   GET /api/auth/me
 * @desc    Retrieves profile data of the currently authenticated user
 * @access  Private (Requires valid JWT)
 * ----------------------------------------------------------------------------
 */
router.get('/me', protect, async (req, res) => {
  // `req.user` is populated by the `protect` middleware
  res.json({
    success: true,
    user: req.user
  });
});

module.exports = router;
