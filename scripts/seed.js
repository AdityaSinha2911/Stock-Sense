/**
 * ============================================================================
 * StockSense IMS - Database Seeder Script
 * ============================================================================
 * Utility script to initialize MongoDB with realistic development and demo data.
 * 
 * Execution:
 *   npm run seed
 *   or: node scripts/seed.js
 * 
 * Operations:
 * 1. Establishes connection to MongoDB via MONGODB_URI.
 * 2. Purges stale records across Users, Categories, Suppliers, Products, and Movements.
 * 3. Creates default system users (Admin & Staff) with pre-save bcrypt encryption.
 * 4. Inserts standardized product categories.
 * 5. Inserts verified vendor profiles.
 * 6. Populates inventory catalog with realistic electronics hardware items,
 *    deliberately including normal, low-stock, and out-of-stock samples.
 * 7. Records corresponding initial StockMovement ledger entries for auditing.
 * ============================================================================
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from the parent .env file
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const {
  User,
  Category,
  Supplier,
  Product,
  StockMovement
} = require('../models');

const connectDB = require('../config/db');

const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('[Seed] Database connected successfully.');

    // ------------------------------------------------------------------------
    // Step 1: Wipe existing demo data for clean slate
    // ------------------------------------------------------------------------
    console.log('[Seed] Cleaning old database collections...');
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Supplier.deleteMany({}),
      Product.deleteMany({}),
      StockMovement.deleteMany({})
    ]);

    // ------------------------------------------------------------------------
    // Step 2: Seed System Users (Admin and Staff)
    // ------------------------------------------------------------------------
    console.log('[Seed] Creating demo users...');
    const admin = await User.create({
      name: 'Ajay Kumar (Admin)',
      email: 'admin@stocksense.com',
      password: 'admin123', // Automatically hashed by User pre-save hook
      role: 'admin'
    });

    const staff = await User.create({
      name: 'Rohan Sharma (Inventory Associate)',
      email: 'staff@stocksense.com',
      password: 'staff123',
      role: 'staff'
    });

    // ------------------------------------------------------------------------
    // Step 3: Seed Product Categories
    // ------------------------------------------------------------------------
    console.log('[Seed] Creating product categories...');
    const categories = await Category.insertMany([
      { name: 'Computer Accessories', description: 'Keyboards, mice, webcams, and USB peripherals' },
      { name: 'Storage & Memory', description: 'SSDs, NVMe drives, RAM sticks, and external HDDs' },
      { name: 'Networking', description: 'Routers, switches, ethernet cables, and Wi-Fi adapters' },
      { name: 'Display & Monitors', description: 'Monitors, HDMI cables, and display adapters' },
      { name: 'Audio & Headsets', description: 'Noise cancelling headsets, microphones, and speakers' }
    ]);

    // Index categories by name for easy reference mapping
    const catMap = {};
    categories.forEach((cat) => {
      catMap[cat.name] = cat._id;
    });

    // ------------------------------------------------------------------------
    // Step 4: Seed Suppliers / Vendors
    // ------------------------------------------------------------------------
    console.log('[Seed] Creating suppliers...');
    const suppliers = await Supplier.insertMany([
      {
        name: 'Apex Components India Pvt Ltd',
        contactPerson: 'Suresh Verma',
        email: 'sales@apexcomponents.in',
        phone: '+91-9876543210',
        address: {
          street: '42 Electronic City Phase 1',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560100',
          country: 'India'
        },
        paymentTerms: 'Net 30'
      },
      {
        name: 'OmniTech Distribution',
        contactPerson: 'Priya Nair',
        email: 'priya@omnitechdist.com',
        phone: '+91-9123456789',
        address: {
          street: '15 Nehru Place Tech Park',
          city: 'New Delhi',
          state: 'Delhi',
          postalCode: '110019',
          country: 'India'
        },
        paymentTerms: 'Net 15'
      }
    ]);

    // ------------------------------------------------------------------------
    // Step 5: Seed Sample Inventory Products
    // ------------------------------------------------------------------------
    console.log('[Seed] Creating inventory products...');
    const productsData = [
      {
        name: 'Logitech MX Master 3S Wireless Mouse',
        sku: 'LOGI-MXM3S-BLK',
        barcode: '890123450001',
        description: 'Ergonomic wireless performance mouse with 8K DPI sensor and quiet clicks.',
        category: catMap['Computer Accessories'],
        supplier: suppliers[0]._id,
        costPrice: 6500,
        sellingPrice: 8995,
        quantityInStock: 28,
        minReorderLevel: 8,
        maxStockLevel: 60,
        unit: 'pcs',
        warehouseLocation: 'Aisle 2 - Shelf B1'
      },
      {
        name: 'Keychron K2 Mechanical Keyboard (Hot-swappable)',
        sku: 'KEY-K2-RGB-RED',
        barcode: '890123450002',
        description: '75% compact Bluetooth mechanical keyboard with Gateron G Pro Red switches.',
        category: catMap['Computer Accessories'],
        supplier: suppliers[0]._id,
        costPrice: 5800,
        sellingPrice: 7999,
        quantityInStock: 14,
        minReorderLevel: 5,
        maxStockLevel: 40,
        unit: 'pcs',
        warehouseLocation: 'Aisle 2 - Shelf B2'
      },
      {
        name: 'Samsung 980 PRO 1TB PCIe NVMe M.2 SSD',
        sku: 'SAM-980PRO-1TB',
        barcode: '890123450003',
        description: 'PCIe Gen 4.0 x4 M.2 2280 internal gaming and workstation SSD up to 7000 MB/s.',
        category: catMap['Storage & Memory'],
        supplier: suppliers[1]._id,
        costPrice: 7400,
        sellingPrice: 9499,
        quantityInStock: 4, // Intentionally <= minReorderLevel to showcase low-stock alert!
        minReorderLevel: 10,
        maxStockLevel: 50,
        unit: 'pcs',
        warehouseLocation: 'Aisle 1 - Vault A'
      },
      {
        name: 'Crucial RAM 16GB DDR4 3200MHz SODIMM',
        sku: 'CRU-RAM-16G-D4',
        barcode: '890123450004',
        description: 'High performance laptop memory module for multitasking and gaming.',
        category: catMap['Storage & Memory'],
        supplier: suppliers[1]._id,
        costPrice: 2400,
        sellingPrice: 3299,
        quantityInStock: 45,
        minReorderLevel: 15,
        maxStockLevel: 100,
        unit: 'pcs',
        warehouseLocation: 'Aisle 1 - Shelf C2'
      },
      {
        name: 'TP-Link Archer AX73 Dual-Band Wi-Fi 6 Router',
        sku: 'TPL-AX73-WIFI6',
        barcode: '890123450005',
        description: 'AX5400 Gigabit Wi-Fi 6 Router with 6 High-Gain Antennas and OneMesh support.',
        category: catMap['Networking'],
        supplier: suppliers[0]._id,
        costPrice: 6200,
        sellingPrice: 8499,
        quantityInStock: 0, // Intentionally 0 to showcase out-of-stock status!
        minReorderLevel: 5,
        maxStockLevel: 30,
        unit: 'pcs',
        warehouseLocation: 'Aisle 3 - Shelf D1'
      },
      {
        name: 'Cat6 UTP Patch Cable (3 Meters, Snagless)',
        sku: 'CAB-CAT6-3M-BLU',
        barcode: '890123450006',
        description: 'High speed copper patch cord for gigabit networks.',
        category: catMap['Networking'],
        supplier: suppliers[0]._id,
        costPrice: 120,
        sellingPrice: 249,
        quantityInStock: 120,
        minReorderLevel: 30,
        maxStockLevel: 300,
        unit: 'pcs',
        warehouseLocation: 'Aisle 3 - Bin 12'
      }
    ];

    const products = await Product.create(productsData);

    // ------------------------------------------------------------------------
    // Step 6: Create Initial Stock Movement Ledger Logs
    // ------------------------------------------------------------------------
    console.log('[Seed] Creating initial stock movement audit logs...');
    for (const prod of products) {
      if (prod.quantityInStock > 0) {
        await StockMovement.create({
          product: prod._id,
          type: 'IN',
          quantity: prod.quantityInStock,
          previousStock: 0,
          newStock: prod.quantityInStock,
          reason: 'Initial warehouse intake / seed import',
          referenceNumber: 'PO-SEED-2026',
          performedBy: admin._id,
          notes: `Batch intake received at ${prod.warehouseLocation}`
        });
      }
    }

    console.log('\n=========================================');
    console.log('✅ StockSense Database Seed Completed!');
    console.log('=========================================');
    console.log('Demo Credentials:');
    console.log('  Admin User : admin@stocksense.com  | Password: admin123');
    console.log('  Staff User : staff@stocksense.com  | Password: staff123');
    console.log('\nCollections Populated:');
    console.log(`  Users          : 2`);
    console.log(`  Categories     : ${categories.length}`);
    console.log(`  Suppliers      : ${suppliers.length}`);
    console.log(`  Products       : ${products.length} (with normal, low, and out-of-stock items)`);
    console.log(`  StockMovements : Initial audit movements logged`);
    console.log('=========================================\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('[Seed] Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
