/**
 * ============================================================================
 * StockSense IMS - Supplier / Vendor Model
 * ============================================================================
 * Defines the MongoDB schema for tracking suppliers, distributors, and vendors.
 * 
 * Key Features:
 * - Vendor identification, point-of-contact, and communications.
 * - Embedded address subdocument for shipping and invoicing.
 * - Commercial credit payment terms (e.g. Net 30, Net 15, COD).
 * ============================================================================
 */

const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema(
  {
    // Company or business trade name of the vendor
    name: {
      type: String,
      required: [true, 'Supplier name is required'],
      trim: true,
      maxlength: [100, 'Supplier name cannot exceed 100 characters']
    },

    // Name of the primary sales representative or account manager
    contactPerson: {
      type: String,
      trim: true
    },

    // Commercial email for placing Purchase Orders (POs)
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address'
      ]
    },

    // Contact telephone number
    phone: {
      type: String,
      trim: true
    },

    // Embedded address structure for vendor physical location
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      postalCode: { type: String, trim: true },
      country: { type: String, trim: true, default: 'India' }
    },

    // Standard business credit terms agreed with vendor
    paymentTerms: {
      type: String,
      default: 'Net 30'
    },

    // Vendor status flag (active for new orders, inactive if relationship paused)
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    },

    // Internal supplier notes and compliance reminders
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters']
    }
  },
  {
    timestamps: true // Tracks `createdAt` and `updatedAt`
  }
);

module.exports = mongoose.model('Supplier', supplierSchema);
