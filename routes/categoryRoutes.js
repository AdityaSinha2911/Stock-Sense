/**
 * ============================================================================
 * StockSense IMS - Category API Routes
 * ============================================================================
 * Endpoints:
 * - GET    /api/categories     : Retrieve all product categories
 * - POST   /api/categories     : Create a new category
 * - DELETE /api/categories/:id : Delete a category (Admin only)
 * ============================================================================
 */

const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { protect, authorize } = require('../middleware/auth');

/**
 * ----------------------------------------------------------------------------
 * @route   GET /api/categories
 * @desc    Retrieves all categories sorted alphabetically
 * @access  Public
 * ----------------------------------------------------------------------------
 */
router.get('/', async (req, res) => {
  try {
    // Query MongoDB: Retrieve all categories sorted by name ascending
    const categories = await Category.find().sort({ name: 1 });
    res.json({ success: true, count: categories.length, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * ----------------------------------------------------------------------------
 * @route   POST /api/categories
 * @desc    Creates a new category in MongoDB
 * @access  Private (Staff/Admin)
 * ----------------------------------------------------------------------------
 */
router.post('/', protect, async (req, res) => {
  try {
    const { name, description, parentCategory } = req.body;

    // Database Write: Insert category document
    const category = await Category.create({ name, description, parentCategory });
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * ----------------------------------------------------------------------------
 * @route   DELETE /api/categories/:id
 * @desc    Deletes a category from MongoDB
 * @access  Private (Admin only)
 * ----------------------------------------------------------------------------
 */
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    // Database Write: Remove category document by ID
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
