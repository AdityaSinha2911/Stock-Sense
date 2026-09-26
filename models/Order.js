/**
 * ============================================================================
 * StockSense IMS - Order Model (Purchase Orders & Sales Orders)
 * ============================================================================
 * Defines the MongoDB schema for tracking inbound restock orders from suppliers
 * (PURCHASE) and outbound fulfillment orders to customers (SALE).
 * ============================================================================
 */

const mongoose = require('mongoose');

// Embedded subdocument schema representing line items in an order
const orderItemSchema = new mongoose.Schema(
  {
    // Referenced Product ObjectId
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    // Historical product name snapshot at time of order creation
    name: {
      type: String,
      required: true
    },
    // Historical SKU snapshot
    sku: {
      type: String,
      required: true
    },
    // Quantity ordered
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1']
    },
    // Negotiated unit price
    unitPrice: {
      type: Number,
      required: true,
      min: [0, 'Unit price cannot be negative']
    },
    // Line item subtotal (quantity * unitPrice)
    totalPrice: {
      type: Number,
      required: true
    }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    // Unique system order tracking code (e.g. PO-2026-0001, SO-2026-0001)
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true
    },

    // Order classification: Restocking vs Fulfillment
    orderType: {
      type: String,
      enum: ['PURCHASE', 'SALE'],
      required: true,
      index: true
    },

    // Contact details of the external party (vendor or customer)
    partyDetails: {
      name: { type: String, required: true, trim: true },
      email: { type: String, trim: true },
      phone: { type: String, trim: true },
      address: { type: String, trim: true }
    },

    // Ordered catalog items
    items: [orderItemSchema],

    // Financial totals
    subtotal: {
      type: Number,
      required: true,
      default: 0
    },
    tax: {
      type: Number,
      default: 0
    },
    discount: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      required: true,
      default: 0
    },

    // Fulfillment workflow status
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'cancelled'],
      default: 'pending',
      index: true
    },

    // Accounting settlement status
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'partial', 'paid', 'refunded'],
      default: 'unpaid'
    },

    // Employee who created or authorized the order
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    notes: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Order', orderSchema);
