/**
 * ============================================================================
 * StockSense IMS - Product API Routes
 * ============================================================================
 * Endpoints:
 * - GET    /api/products     : Query products with search, filtering, and pagination
 * - GET    /api/products/:id : Fetch single product with populated relations
 * - POST   /api/products     : Create new product and log initial stock transaction
 * - PUT    /api/products/:id : Update product catalog details
 * - DELETE /api/products/:id : Remove product and related stock history (Admin only)
 * ============================================================================
 */

const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const { protect, authorize } = require('../middleware/auth');

/**
 * ----------------------------------------------------------------------------
 * @route   GET /api/products
 * @desc    Get all inventory products with filtering, search, and pagination
 * @access  Public
 * ----------------------------------------------------------------------------
 */
router.get('/', async (req, res) => {
  try {
    const { search, category, status, lowStock, page = 1, limit = 20 } = req.query;

    // 1. Build dynamic MongoDB query criteria
    const query = {};

    // Fuzzy search across Name, SKU, or Barcode
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by specific Category ObjectId
    if (category) {
      query.category = category;
    }

    // Filter by specific Stock Status ('in_stock', 'low_stock', etc.)
    if (status) {
      query.status = status;
    }

    // Filter products requiring replenishment (quantityInStock <= minReorderLevel)
    if (lowStock === 'true') {
      query.$expr = { $lte: ['$quantityInStock', '$minReorderLevel'] };
    }

    const skip = (Number(page) - 1) * Number(limit);

    // 2. Execute parallel MongoDB queries: paginated data + total count
    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('category', 'name')
        .populate('supplier', 'name contactPerson email')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments(query)
    ]);

    // 3. Return structured pagination payload
    res.json({
      success: true,
      count: products.length,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      data: products
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * ----------------------------------------------------------------------------
 * @route   GET /api/products/:id
 * @desc    Get detailed product data by MongoDB ObjectId
 * @access  Public
 * ----------------------------------------------------------------------------
 */
router.get('/:id', async (req, res) => {
  try {
    // Query MongoDB: Find by ID and populate related Category and Supplier details
    const product = await Product.findById(req.params.id)
      .populate('category', 'name description')
      .populate('supplier', 'name contactPerson email phone');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * ----------------------------------------------------------------------------
 * @route   POST /api/products
 * @desc    Creates a new product in MongoDB and logs an initial stock movement
 * @access  Private (Staff/Admin)
 * ----------------------------------------------------------------------------
 */
router.post('/', protect, async (req, res) => {
  try {
    const {
      name,
      sku,
      barcode,
      description,
      category,
      supplier,
      costPrice,
      sellingPrice,
      quantityInStock,
      minReorderLevel,
      maxStockLevel,
      unit,
      warehouseLocation
    } = req.body;

    // 1. Query MongoDB: Ensure SKU uniqueness
    const existingSku = await Product.findOne({ sku: sku.toUpperCase() });
    if (existingSku) {
      return res.status(400).json({
        success: false,
        message: `Product with SKU "${sku}" already exists.`
      });
    }

    // 2. Database Write: Insert new Product document
    const product = await Product.create({
      name,
      sku: sku.toUpperCase(),
      barcode,
      description,
      category,
      supplier,
      costPrice,
      sellingPrice,
      quantityInStock: quantityInStock || 0,
      minReorderLevel: minReorderLevel || 10,
      maxStockLevel: maxStockLevel || 500,
      unit: unit || 'pcs',
      warehouseLocation: warehouseLocation || 'Main Warehouse'
    });

    // 3. Database Write: If product has initial quantity, create initial stock intake ledger
    if (quantityInStock && quantityInStock > 0) {
      await StockMovement.create({
        product: product._id,
        type: 'IN',
        quantity: quantityInStock,
        previousStock: 0,
        newStock: quantityInStock,
        reason: 'Initial stock intake upon product creation',
        performedBy: req.user._id
      });
    }

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * ----------------------------------------------------------------------------
 * @route   PUT /api/products/:id
 * @desc    Updates non-stock attributes of a product in MongoDB
 * @access  Private (Staff/Admin)
 * ----------------------------------------------------------------------------
 */
router.put('/:id', protect, async (req, res) => {
  try {
    // Whitelist allowed fields for modification
    const allowedUpdates = [
      'name',
      'barcode',
      'description',
      'category',
      'supplier',
      'costPrice',
      'sellingPrice',
      'minReorderLevel',
      'maxStockLevel',
      'unit',
      'warehouseLocation',
      'status'
    ];

    const updates = {};
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    // Database Write: Find and update document with schema validation
    const product = await Product.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * ----------------------------------------------------------------------------
 * @route   DELETE /api/products/:id
 * @desc    Deletes product from MongoDB and clears related stock movement logs
 * @access  Private (Admin only)
 * ----------------------------------------------------------------------------
 */
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    // 1. Database Write: Delete product document
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // 2. Database Write: Cascade cleanup of related stock movements
    await StockMovement.deleteMany({ product: req.params.id });

    res.json({
      success: true,
      message: 'Product and related history removed successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
