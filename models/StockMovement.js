/**
 * ============================================================================
 * StockSense IMS - Stock Movement / Transaction Ledger Model
 * ============================================================================
 * Immutable audit trail that documents every physical change to stock quantity.
 * 
 * In a professional inventory management system, stock counts are never
 * altered blindly. Every change records:
 * - The product affected.
 * - The type of movement (IN, OUT, ADJUSTMENT, TRANSFER, RETURN).
 * - The previous count and the new count.
 * - The authorized user who performed the transaction.
 * - Supporting reference numbers (e.g. Purchase Order, Invoice, Reason).
 * ============================================================================
 */

const mongoose = require('mongoose');

const stockMovementSchema = new mongoose.Schema(
  {
    // Foreign Key reference to the Product model
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required'],
      index: true
    },

    // Transaction classification
    type: {
      type: String,
      enum: {
        values: ['IN', 'OUT', 'ADJUSTMENT', 'TRANSFER', 'RETURN'],
        message: '{VALUE} is not a supported movement type'
      },
      required: [true, 'Movement type is required (IN, OUT, ADJUSTMENT, TRANSFER, RETURN)']
    },

    // Magnitude of quantity changed
    quantity: {
      type: Number,
      required: [true, 'Quantity changed is required'],
      min: [1, 'Quantity must be at least 1']
    },

    // Snapshot of stock level prior to this transaction
    previousStock: {
      type: Number,
      required: true
    },

    // Snapshot of stock level following this transaction
    newStock: {
      type: Number,
      required: true
    },

    // Operational reason for this movement (e.g., "Supplier intake", "Damaged goods write-off")
    reason: {
      type: String,
      trim: true,
      default: 'Routine stock transaction'
    },

    // External reference number (e.g. PO-2026-001, INV-4491, RETURN-88)
    referenceNumber: {
      type: String,
      trim: true
    },

    // Foreign Key reference to the User who logged this stock update
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false
    },

    // Additional auditor notes or remarks
    notes: {
      type: String,
      trim: true
    }
  },
  {
    // Only `createdAt` is enabled. Records in this collection are immutable logs and cannot be updated.
    timestamps: { createdAt: true, updatedAt: false }
  }
);

/**
 * Compound Indexes:
 * Optimize fast historical timeline queries per product and by movement type.
 */
stockMovementSchema.index({ product: 1, createdAt: -1 });
stockMovementSchema.index({ type: 1, createdAt: -1 });

module.exports = mongoose.model('StockMovement', stockMovementSchema);
