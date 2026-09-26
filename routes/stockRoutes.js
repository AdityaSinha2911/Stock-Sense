/**
 * ============================================================================
 * StockSense IMS - Stock Movement & Inventory Operations Routes
 * ============================================================================
 * Endpoints:
 * - POST /api/stock/movement : Execute stock IN, OUT, ADJUSTMENT, RETURN with audit logging
 * - GET  /api/stock/movements: Retrieve audit logs with product and user population
 * - GET  /api/stock/low-stock: Fetch products that have reached or dropped below reorder level
 * ============================================================================
 */

const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const { protect } = require('../middleware/auth');

/**
 * ----------------------------------------------------------------------------
 * @route   POST /api/stock/movement
 * @desc    Records an inventory transaction, recalculates stock, and creates an audit log
 * @access  Private (Authenticated staff or admin)
 * ----------------------------------------------------------------------------
 */
router.post('/movement', protect, async (req, res) => {
  try {
    const { productId, type, quantity, reason, referenceNumber, notes } = req.body;

    // 1. Validate required payload parameters
    if (!productId || !type || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide productId, movement type, and quantity'
      });
    }

    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive number greater than 0'
      });
    }

    // 2. Query MongoDB: Fetch target product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const previousStock = product.quantityInStock;
    let newStock = previousStock;

    // 3. Compute new stock level based on transaction type
    switch (type) {
      case 'IN':
      case 'RETURN':
        // Stock intake (e.g. supplier delivery or customer return)
        newStock = previousStock + qty;
        break;

      case 'OUT':
        // Outbound stock (e.g. customer sale or dispatch)
        if (previousStock < qty) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock. Current stock is ${previousStock}, cannot deduct ${qty}.`
          });
        }
        newStock = previousStock - qty;
        break;

      case 'ADJUSTMENT':
        // Audit adjustment (qty is the actual counted physical inventory)
        newStock = qty;
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid movement type. Allowed: IN, OUT, ADJUSTMENT, RETURN'
        });
    }

    // 4. Database Write: Update product stock (triggers pre-save hook for status update)
    product.quantityInStock = newStock;
    await product.save();

    // 5. Database Write: Insert immutable audit ledger record
    const movement = await StockMovement.create({
      product: product._id,
      type,
      quantity: type === 'ADJUSTMENT' ? Math.abs(newStock - previousStock) : qty,
      previousStock,
      newStock,
      reason: reason || `Manual stock ${type.toLowerCase()}`,
      referenceNumber,
      notes,
      performedBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: `Stock successfully updated from ${previousStock} to ${newStock}`,
      data: {
        product: {
          id: product._id,
          name: product.name,
          sku: product.sku,
          quantityInStock: product.quantityInStock,
          status: product.status
        },
        movement
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * ----------------------------------------------------------------------------
 * @route   GET /api/stock/movements
 * @desc    Retrieves chronological movement transaction logs from MongoDB
 * @access  Public
 * ----------------------------------------------------------------------------
 */
router.get('/movements', async (req, res) => {
  try {
    const { productId, type, limit = 50, page = 1 } = req.query;

    const query = {};
    if (productId) query.product = productId;
    if (type) query.type = type;

    const skip = (Number(page) - 1) * Number(limit);

    // Query MongoDB: Fetch movements populated with product details and employee details
    const [movements, total] = await Promise.all([
      StockMovement.find(query)
        .populate('product', 'name sku unit')
        .populate('performedBy', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      StockMovement.countDocuments(query)
    ]);

    res.json({
      success: true,
      count: movements.length,
      total,
      data: movements
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * ----------------------------------------------------------------------------
 * @route   GET /api/stock/low-stock
 * @desc    Retrieves all products where current stock is at or below minReorderLevel
 * @access  Public
 * ----------------------------------------------------------------------------
 */
router.get('/low-stock', async (req, res) => {
  try {
    // Query MongoDB: Compare quantityInStock with minReorderLevel using MongoDB expression $expr
    const products = await Product.find({
      $expr: { $lte: ['$quantityInStock', '$minReorderLevel'] }
    })
      .populate('category', 'name')
      .populate('supplier', 'name email phone')
      .sort({ quantityInStock: 1 });

    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
