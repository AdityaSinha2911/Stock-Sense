/**
 * ============================================================================
 * StockSense IMS - Product / Inventory Item Model
 * ============================================================================
 * Core data model representing physical inventory items managed within the business.
 * 
 * Key Features:
 * - SKU (Stock Keeping Unit): Unique, uppercase identifier.
 * - Barcode: Optional EAN/UPC identifier with sparse uniqueness index.
 * - Category & Supplier references (Foreign Key relationships via ObjectId).
 * - Real-time stock counting (`quantityInStock`).
 * - Minimum and maximum stock thresholds for automated reorder triggers.
 * - Pre-save middleware: Evaluates stock counts and automatically updates
 *   the inventory status ('in_stock', 'low_stock', 'out_of_stock').
 * - Text Indexing: Optimized multi-field search across name, SKU, and description.
 * - Virtual getter: Calculates total stock valuation (`costPrice * quantityInStock`).
 * ============================================================================
 */

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    // Product commercial title
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [150, 'Name cannot exceed 150 characters'],
      index: true
    },

    // Stock Keeping Unit - mandatory unique alphanumeric code (e.g. LOGI-MXM3S-BLK)
    sku: {
      type: String,
      required: [true, 'SKU (Stock Keeping Unit) is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },

    // Scannable Barcode (EAN-13, UPC-A, Code-128)
    barcode: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple documents without barcodes while enforcing uniqueness when present
      trim: true
    },

    // Item specifications and details
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },

    // Foreign Key reference to the Category model
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Product must belong to a category'],
      index: true
    },

    // Foreign Key reference to the Supplier model
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      index: true
    },

    // Acquisition unit price from supplier (used in cost of goods calculation)
    costPrice: {
      type: Number,
      required: [true, 'Cost price is required'],
      min: [0, 'Cost price cannot be negative']
    },

    // Standard selling/retail price
    sellingPrice: {
      type: Number,
      required: [true, 'Selling price is required'],
      min: [0, 'Selling price cannot be negative']
    },

    // Real-time on-hand physical stock quantity
    quantityInStock: {
      type: Number,
      required: [true, 'Initial stock quantity is required'],
      default: 0,
      min: [0, 'Quantity cannot be negative']
    },

    // Warning threshold: If quantityInStock <= minReorderLevel, status becomes 'low_stock'
    minReorderLevel: {
      type: Number,
      default: 10,
      min: [0, 'Min reorder level cannot be negative']
    },

    // Warehouse capacity limit for this specific item
    maxStockLevel: {
      type: Number,
      default: 500,
      min: [0, 'Max stock level cannot be negative']
    },

    // Measurement unit (e.g. 'pcs', 'kg', 'box', 'meters')
    unit: {
      type: String,
      default: 'pcs',
      trim: true
    },

    // Physical storage bin locator in warehouse (e.g., 'Aisle 2 - Shelf B1')
    warehouseLocation: {
      type: String,
      trim: true,
      default: 'Main Warehouse'
    },

    // Current availability status, calculated automatically via pre-save hook
    status: {
      type: String,
      enum: ['in_stock', 'low_stock', 'out_of_stock', 'discontinued'],
      default: 'in_stock',
      index: true
    }
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
    toJSON: { virtuals: true }, // Include virtual properties in JSON output
    toObject: { virtuals: true }
  }
);

/**
 * Text Index:
 * Allows MongoDB full-text search across product name, sku, and description.
 * Query syntax: Product.find({ $text: { $search: 'keyboard' } })
 */
productSchema.index({ name: 'text', sku: 'text', description: 'text' });

/**
 * Pre-Save Middleware Hook:
 * Automatically computes inventory status based on `quantityInStock` and `minReorderLevel`.
 * Preserves 'discontinued' status if intentionally retired by management.
 */
productSchema.pre('save', function (next) {
  if (this.status !== 'discontinued') {
    if (this.quantityInStock === 0) {
      this.status = 'out_of_stock';
    } else if (this.quantityInStock <= this.minReorderLevel) {
      this.status = 'low_stock';
    } else {
      this.status = 'in_stock';
    }
  }
  next();
});

/**
 * Virtual Property: Total Valuation
 * Dynamically computes total financial value of the on-hand inventory for this product.
 */
productSchema.virtual('totalValue').get(function () {
  return (this.quantityInStock * this.costPrice).toFixed(2);
});

module.exports = mongoose.model('Product', productSchema);
