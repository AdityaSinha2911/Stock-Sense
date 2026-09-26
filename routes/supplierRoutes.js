/**
 * ============================================================================
 * StockSense IMS - Supplier / Vendor API Routes
 * ============================================================================
 * Endpoints:
 * - GET    /api/suppliers     : Retrieve list of suppliers
 * - POST   /api/suppliers     : Create new supplier
 * - PUT    /api/suppliers/:id : Update supplier details
 * - DELETE /api/suppliers/:id : Remove supplier (Admin only)
 * ============================================================================
 */

const express = require('express');
const router = express.Router();
const Supplier = require('../models/Supplier');
const { protect, authorize } = require('../middleware/auth');

/**
 * ----------------------------------------------------------------------------
 * @route   GET /api/suppliers
 * @desc    Retrieves all suppliers from MongoDB sorted by company name
 * @access  Public
 * ----------------------------------------------------------------------------
 */
router.get('/', async (req, res) => {
  try {
    // Query MongoDB: Fetch suppliers
    const suppliers = await Supplier.find().sort({ name: 1 });
    res.json({ success: true, count: suppliers.length, data: suppliers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * ----------------------------------------------------------------------------
 * @route   POST /api/suppliers
 * @desc    Registers a new supplier in MongoDB
 * @access  Private (Staff/Admin)
 * ----------------------------------------------------------------------------
 */
router.post('/', protect, async (req, res) => {
  try {
    // Database Write: Create supplier document
    const supplier = await Supplier.create(req.body);
    res.status(201).json({ success: true, data: supplier });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * ----------------------------------------------------------------------------
 * @route   PUT /api/suppliers/:id
 * @desc    Updates supplier details in MongoDB
 * @access  Private (Staff/Admin)
 * ----------------------------------------------------------------------------
 */
router.put('/:id', protect, async (req, res) => {
  try {
    // Database Write: Update supplier by ID with validators
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }
    res.json({ success: true, data: supplier });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * ----------------------------------------------------------------------------
 * @route   DELETE /api/suppliers/:id
 * @desc    Deletes a supplier from MongoDB
 * @access  Private (Admin only)
 * ----------------------------------------------------------------------------
 */
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    // Database Write: Delete supplier document
    const supplier = await Supplier.findByIdAndDelete(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }
    res.json({ success: true, message: 'Supplier deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
