/**
 * ============================================================================
 * StockSense IMS - Category Model
 * ============================================================================
 * Defines the catalog categorization schema.
 * 
 * Key Features:
 * - Unique category name constraint.
 * - Self-referencing `parentCategory` foreign key for hierarchical nesting
 *   (e.g., Electronics -> Computer Peripherals -> Keyboards).
 * - Mongoose virtual populate for accessing child subcategories.
 * ============================================================================
 */

const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    // Name of the category (e.g. "Storage & Memory", "Networking")
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
      maxlength: [50, 'Category name cannot exceed 50 characters']
    },

    // Optional detailed description for inventory staff guidance
    description: {
      type: String,
      trim: true,
      maxlength: [300, 'Description cannot exceed 300 characters']
    },

    // Self-referencing ObjectId: enables unlimited parent-child nesting
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null
    },

    // Soft toggle for displaying in active catalog selection
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true // Tracks `createdAt` and `updatedAt`
  }
);

/**
 * Virtual Populate:
 * Allows querying a parent category and retrieving its child categories
 * without needing an embedded array.
 */
categorySchema.virtual('subcategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parentCategory'
});

module.exports = mongoose.model('Category', categorySchema);
