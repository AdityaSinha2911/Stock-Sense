/**
 * ============================================================================
 * StockSense IMS - Dashboard Analytics & KPI Routes
 * ============================================================================
 * Endpoints:
 * - GET /api/dashboard/stats : Aggregate inventory metrics, financial valuation,
 *                             low-stock alerts, and recent transaction log
 * ============================================================================
 */

const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const Category = require('../models/Category');

/**
 * ----------------------------------------------------------------------------
 * @route   GET /api/dashboard/stats
 * @desc    Computes business KPIs: catalog size, inventory valuation, stock warnings
 * @access  Public
 * ----------------------------------------------------------------------------
 */
router.get('/stats', async (req, res) => {
  try {
    // 1. Execute parallel queries across multiple MongoDB collections
    const [
      totalProducts,
      totalCategories,
      products,
      recentMovements
    ] = await Promise.all([
      // Count total distinct product SKUs
      Product.countDocuments(),
      // Count active product categories
      Category.countDocuments(),
      // Fetch projection of all products for aggregation calculations
      Product.find().select('quantityInStock costPrice sellingPrice minReorderLevel status'),
      // Fetch 6 most recent stock movements with populated relations
      StockMovement.find()
        .populate('product', 'name sku')
        .populate('performedBy', 'name')
        .sort({ createdAt: -1 })
        .limit(6)
    ]);

    // 2. Perform in-memory aggregation of stock totals and valuation
    let totalStockUnits = 0;
    let totalValuation = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const p of products) {
      totalStockUnits += p.quantityInStock;
      // Valuation formula: on-hand units * acquisition cost price
      totalValuation += p.quantityInStock * p.costPrice;

      if (p.quantityInStock === 0) {
        outOfStockCount++;
      } else if (p.quantityInStock <= p.minReorderLevel) {
        lowStockCount++;
      }
    }

    // 3. Return compiled analytics payload
    res.json({
      success: true,
      data: {
        totalProducts,
        totalCategories,
        totalStockUnits,
        totalValuation: Math.round(totalValuation * 100) / 100,
        lowStockCount,
        outOfStockCount,
        recentMovements
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
