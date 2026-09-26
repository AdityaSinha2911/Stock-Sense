/**
 * ============================================================================
 * StockSense IMS - User & Authentication Model
 * ============================================================================
 * Defines the MongoDB schema for application users.
 * 
 * Key Features:
 * - Email uniqueness constraint and regex validation.
 * - Password hashing using bcryptjs with a 10-round salt in a pre-save hook.
 * - Password exclusion from query projections (`select: false`) for security.
 * - Role-Based Access Control (RBAC) with roles: 'admin', 'manager', 'staff'.
 * - Instance method for password verification (`comparePassword`).
 * ============================================================================
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    // Full name of the employee or admin user
    name: {
      type: String,
      required: [true, 'Please provide a user name'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },

    // Unique email used for system login and notifications
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address'
      ]
    },

    // Bcrypt hashed password (hidden by default in queries for security)
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false // Prevents returning password hash in find/findOne calls
    },

    // Role-Based Access Control (RBAC) flag
    role: {
      type: String,
      enum: {
        values: ['admin', 'manager', 'staff'],
        message: '{VALUE} is not a valid role'
      },
      default: 'staff'
    },

    // User status for account deactivation without deleting audit history
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active'
    },

    // Timestamp tracking the last successful login session
    lastLogin: {
      type: Date
    }
  },
  {
    // Automatically creates and manages `createdAt` and `updatedAt` timestamps
    timestamps: true
  }
);

/**
 * Pre-Save Middleware Hook:
 * Automatically hashes the user's plain-text password before persisting to MongoDB.
 * Only runs if the password field was modified or newly created.
 */
userSchema.pre('save', async function (next) {
  // Skip re-hashing if password was not changed (e.g. updating name or role)
  if (!this.isModified('password')) {
    return next();
  }

  // Generate cryptographically secure salt (10 rounds) and hash
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/**
 * Custom Instance Method:
 * Compares an incoming plain-text candidate password with the stored bcrypt hash.
 * 
 * @param {string} enteredPassword - The plain-text password entered by the user
 * @returns {Promise<boolean>} True if password matches, false otherwise
 */
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
