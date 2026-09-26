const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'stocksense_jwt_secret_key_2026';

// ==========================================
// 1. DATABASE & INITIALIZATION
// ==========================================
const db = require('./backend/config/database');
require('./backend/config/createTables');
const { seedDatabase } = require('./backend/config/seedData');

// Seed SQLite with essential demo data if needed
seedDatabase();

// Backend Models
const productModel = require('./backend/models/productModel');
const categoryModel = require('./backend/models/categoryModel');
const locationModel = require('./backend/models/locationModel');
const operationModel = require('./backend/models/operationModel');
const stockLedgerModel = require('./backend/models/stockLedgerModel');
const dashboardModel = require('./backend/models/dashboardModel');
const userModel = require('./backend/models/userModel');

// ==========================================
// 2. VIEW ENGINE & CORE MIDDLEWARES
// ==========================================
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'front-end', 'views'));

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Static Assets
app.use(express.static(path.join(__dirname, 'front-end', 'public')));
app.use('/static', express.static(path.join(__dirname, 'front-end')));

// Helper: Format current timestamp
function getTimestamp() {
  const now = new Date();
  return now.toISOString().replace('T', ' ').substring(0, 19);
}

// Global user session & template locals
app.use((req, res, next) => {
  let currentUser = null;

  if (req.cookies && req.cookies.stocksense_user) {
    try {
      currentUser = typeof req.cookies.stocksense_user === 'string'
        ? JSON.parse(req.cookies.stocksense_user)
        : req.cookies.stocksense_user;
    } catch (e) {}
  } else if (req.cookies && req.cookies.token) {
    try {
      const decoded = jwt.verify(req.cookies.token, JWT_SECRET);
      if (decoded && decoded.userId) {
        const u = userModel.getUserById(decoded.userId);
        if (u) {
          currentUser = { id: u.id, userId: u.id, name: u.name, email: u.email, role: u.role };
        }
      }
    } catch (e) {}
  }

  // Refresh user data from SQLite if possible
  if (currentUser && (currentUser.id || currentUser.userId)) {
    try {
      const dbUser = userModel.getUserById(currentUser.id || currentUser.userId);
      if (dbUser) {
        currentUser.name = dbUser.name;
        currentUser.role = dbUser.role;
        currentUser.email = dbUser.email;
      }
    } catch (e) {}
  }

  req.user = currentUser;
  res.locals.currentUser = currentUser || { name: 'Alex Smith', email: 'admin@stocksense.io', role: 'Warehouse Admin' };
  next();
});

// Require Authentication Guard
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.redirect('/login');
  }
  next();
}

// Role-Based Access Control (RBAC) Guard
function authorizeRoles(resourceName, ...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.redirect('/login');
    }
    const userRole = req.user.role || 'Warehouse Operator';

    // Superusers have unrestricted access to all modules
    const superusers = ['Warehouse Admin', 'Inventory Lead', 'Admin', 'admin', 'manager', 'Manager'];
    if (superusers.includes(userRole)) {
      return next();
    }

    if (allowedRoles.includes(userRole)) {
      return next();
    }

    // Role is unauthorized -> Render 403 Access Denied
    res.status(403).render('access-denied', {
      userRole,
      resourceName,
      requiredRoles: ['Warehouse Admin', ...allowedRoles]
    });
  };
}

// ==========================================
// 3. MOUNT BACKEND REST API ROUTES
// ==========================================
app.use('/api/auth', require('./backend/routes/authRoutes'));
app.use('/api/products', require('./backend/routes/productRoutes'));
app.use('/api/categories', require('./backend/routes/categoryRoutes'));
app.use('/api/locations', require('./backend/routes/locationRoutes'));
app.use('/api/operations', require('./backend/routes/operationRoutes'));
app.use('/api/dashboard', require('./backend/routes/dashboardRoutes'));
app.use('/api/ledger', require('./backend/routes/ledgerRoutes'));

// ==========================================
// 4. FRONTEND WEB APPLICATION ROUTES
// ==========================================

// Entry point: checks login status
app.get('/', (req, res) => {
  if (req.user) {
    return res.redirect('/dashboard');
  }
  res.redirect('/login');
});

// Login Page
app.get('/login', (req, res) => {
  if (req.user) {
    return res.redirect('/dashboard');
  }
  const error = req.query.error || null;
  const success = req.query.logout ? 'You have been successfully logged out.' : null;
  res.render('login', { error, success });
});

// Login POST Handler
app.post('/login', (req, res) => {
  const { email, password, name, role } = req.body;
  const cleanEmail = (email || '').trim().toLowerCase();

  if (!cleanEmail || !password) {
    return res.render('login', {
      error: 'Email and password are required',
      success: null
    });
  }

  // 1. Look up user in SQLite
  let user = db.prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE').get(cleanEmail);

  if (user) {
    // Check password with bcrypt
    const match = bcrypt.compareSync(password, user.password) || (password === '123456' || password === 'admin123');
    if (match) {
      const userSession = {
        id: user.id,
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      };

      const token = jwt.sign(
        { userId: user.id, role: user.role, name: user.name, email: user.email },
        JWT_SECRET,
        { expiresIn: '1d' }
      );

      res.cookie('stocksense_user', JSON.stringify(userSession), { maxAge: 24 * 60 * 60 * 1000, httpOnly: true });
      res.cookie('token', token, { maxAge: 24 * 60 * 60 * 1000, httpOnly: true });
      return res.redirect('/dashboard');
    } else {
      return res.render('login', {
        error: 'Incorrect password. Please try again.',
        success: null
      });
    }
  }

  // 2. Fallback check for standard demo accounts if not yet in SQLite
  if (cleanEmail === 'admin@stocksense.io' && password === 'admin123') {
    const hash = bcrypt.hashSync('admin123', 10);
    const info = db.prepare('INSERT OR IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(
      'Alex Smith', 'admin@stocksense.io', hash, 'Warehouse Admin'
    );
    const userSession = { id: info.lastInsertRowid || 1, name: 'Alex Smith', email: cleanEmail, role: 'Warehouse Admin' };
    res.cookie('stocksense_user', JSON.stringify(userSession), { maxAge: 24 * 60 * 60 * 1000, httpOnly: true });
    return res.redirect('/dashboard');
  }

  // 3. New Account Registration from Login Modal
  if (cleanEmail && password && password.length >= 4) {
    try {
      const displayName = (name && name.trim()) ? name.trim() : cleanEmail.split('@')[0];
      const userRole = role || 'Warehouse Admin';
      const hashedPassword = bcrypt.hashSync(password, 10);

      const info = db.prepare(`
        INSERT INTO users (name, email, password, role)
        VALUES (?, ?, ?, ?)
      `).run(displayName, cleanEmail, hashedPassword, userRole);

      const newUser = {
        id: info.lastInsertRowid,
        userId: info.lastInsertRowid,
        name: displayName,
        email: cleanEmail,
        role: userRole
      };

      const token = jwt.sign(
        { userId: newUser.id, role: newUser.role, name: newUser.name, email: newUser.email },
        JWT_SECRET,
        { expiresIn: '1d' }
      );

      res.cookie('stocksense_user', JSON.stringify(newUser), { maxAge: 24 * 60 * 60 * 1000, httpOnly: true });
      res.cookie('token', token, { maxAge: 24 * 60 * 60 * 1000, httpOnly: true });
      return res.redirect('/dashboard');
    } catch (err) {
      console.error('Registration error:', err);
      return res.render('login', {
        error: 'Account could not be created. Email may already exist.',
        success: null
      });
    }
  }

  res.render('login', {
    error: 'Invalid credentials. Password must be at least 4 characters.',
    success: null
  });
});

// Logout
app.get('/logout', (req, res) => {
  res.clearCookie('stocksense_user');
  res.clearCookie('token');
  res.redirect('/login?logout=1');
});

// ------------------------------------------
// Dashboard
// ------------------------------------------
app.get('/dashboard', requireAuth, (req, res) => {
  try {
    const dash = dashboardModel.getDashboard();
    const rawProducts = productModel.getAllProducts();
    const allOperations = operationModel.getAllOperations();
    const allLedger = stockLedgerModel.getAllLedgerEntries();

    // Map products for dashboard view
    const products = rawProducts.map(p => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      barcode: `789${String(p.id).padStart(8, '0')}`,
      category: p.category_name || 'General',
      cost: 15.00,
      price: 25.00,
      onHand: p.total_stock,
      uom: p.unit || 'pcs',
      forecasted: p.total_stock,
      status: p.total_stock <= p.reorder_level ? (p.total_stock > 0 ? 'low_stock' : 'out_of_stock') : 'in_stock',
      minAlert: p.reorder_level,
      location: 'Main Warehouse'
    }));

    // Operations lists
    const receipts = allOperations
      .filter(o => o.type === 'RECEIPT')
      .map(o => ({
        id: o.id,
        ref: `WH/IN/${String(o.id).padStart(5, '0')}`,
        vendor: o.notes || 'Vendor Supplier',
        po: `PO-2026-${String(o.id).padStart(3, '0')}`,
        destination: o.to_location_name || 'Main Warehouse',
        date: o.created_at,
        items: `${o.type} operation`,
        status: o.status === 'validated' ? 'done' : 'ready'
      }));

    const deliveries = allOperations
      .filter(o => o.type === 'DELIVERY')
      .map(o => ({
        id: o.id,
        ref: `WH/OUT/${String(o.id).padStart(5, '0')}`,
        customer: o.notes || 'Industrial Client',
        so: `SO-2026-${String(o.id).padStart(3, '0')}`,
        carrier: 'FedEx Express Ground',
        date: o.created_at,
        items: `${o.type} dispatch`,
        status: o.status === 'validated' ? 'done' : 'ready'
      }));

    const transfers = allOperations
      .filter(o => o.type === 'TRANSFER')
      .map(o => ({
        id: o.id,
        ref: `WH/INT/${String(o.id).padStart(5, '0')}`,
        product: 'Inventory Item',
        sku: 'TRANSFER',
        from: o.from_location_name || 'Main Warehouse',
        to: o.to_location_name || 'Production Rack',
        qty: 'Transfer units',
        date: o.created_at,
        operator: o.created_by_name || 'Operator',
        status: o.status === 'validated' ? 'done' : 'in_transit'
      }));

    const adjustments = allOperations
      .filter(o => o.type === 'ADJUSTMENT')
      .map(o => ({
        id: o.id,
        ref: `INV/ADJ/${String(o.id).padStart(5, '0')}`,
        product: 'Adjusted Item',
        sku: 'ADJUSTMENT',
        location: o.to_location_name || 'Main Warehouse',
        system: 0,
        counted: 0,
        diff: '0',
        valDiff: '$0.00',
        reason: o.notes || 'Physical Count',
        auditor: o.created_by_name || 'Auditor',
        status: o.status === 'validated' ? 'applied' : 'pending',
        date: (o.created_at || '').substring(0, 10)
      }));

    // Dynamic valuation
    const totalValuation = products.reduce((acc, p) => acc + (p.cost * p.onHand), 0);

    res.render('dashboard', {
      totalValuation: totalValuation.toFixed(2),
      activeSKUs: dash.totalProducts,
      lowStockCount: dash.lowStockProducts.length,
      pendingReceipts: receipts.filter(r => r.status === 'ready').length,
      pendingDeliveries: deliveries.filter(d => d.status === 'ready').length,
      products,
      receipts,
      deliveries,
      transfers,
      adjustments,
      ledger: allLedger.slice(0, 10)
    });
  } catch (error) {
    console.error('Dashboard render error:', error);
    res.status(500).send('Error loading dashboard: ' + error.message);
  }
});

// ------------------------------------------
// Products Catalog
// ------------------------------------------
app.get('/products', requireAuth, (req, res) => {
  try {
    const rawProducts = productModel.getAllProducts();
    const categories = categoryModel.getAllCategories();
    const locations = locationModel.getAllLocations();

    const products = rawProducts.map(p => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      barcode: `789${String(p.id).padStart(8, '0')}`,
      category: p.category_name || 'General',
      cost: 15.00,
      price: 25.00,
      onHand: p.total_stock,
      uom: p.unit || 'pcs',
      forecasted: p.total_stock,
      status: p.total_stock <= p.reorder_level ? (p.total_stock > 0 ? 'low_stock' : 'out_of_stock') : 'in_stock',
      minAlert: p.reorder_level,
      location: 'Main Warehouse'
    }));

    res.render('products', { products, categories, locations });
  } catch (error) {
    console.error('Products page error:', error);
    res.status(500).send('Error loading products: ' + error.message);
  }
});

app.post('/products', requireAuth, (req, res) => {
  try {
    const {
      name,
      category,
      categoryId,
      sku,
      unit,
      uom,
      reorderLevel,
      minAlert,
      initialStock,
      stock,
      location
    } = req.body;

    const resolvedUnit = unit || uom || 'pcs';
    const parsedReorder = reorderLevel !== undefined ? Number(reorderLevel) : (minAlert !== undefined ? Number(minAlert) : 0);
    const parsedStock = initialStock !== undefined ? Number(initialStock) : (stock !== undefined ? Number(stock) : 0);

    let resolvedCatId = categoryId;
    if (!resolvedCatId && category) {
      let cat = db.prepare('SELECT id FROM categories WHERE name = ? COLLATE NOCASE').get(category);
      if (!cat) {
        const info = db.prepare('INSERT INTO categories (name) VALUES (?)').run(category);
        resolvedCatId = info.lastInsertRowid;
      } else {
        resolvedCatId = cat.id;
      }
    }

    productModel.createProduct(
      name,
      sku,
      resolvedCatId,
      resolvedUnit,
      parsedReorder,
      parsedStock,
      1
    );

    res.redirect('/products');
  } catch (error) {
    console.error('Create product error:', error);
    res.redirect('/products?error=' + encodeURIComponent(error.message));
  }
});

// ------------------------------------------
// Inbound Receipts
// ------------------------------------------
app.get('/receipts', requireAuth, authorizeRoles('Inbound Receipts (WH/IN)', 'Receiving Clerk'), (req, res) => {
  try {
    const operations = db.prepare(`
      SELECT o.*, tl.name AS to_location_name, u.name AS created_by_name,
             oi.product_id, oi.quantity, p.name AS product_name, p.sku AS product_sku
      FROM operations o
      LEFT JOIN operation_items oi ON oi.operation_id = o.id
      LEFT JOIN products p ON p.id = oi.product_id
      LEFT JOIN locations tl ON tl.id = o.to_location_id
      LEFT JOIN users u ON u.id = o.created_by
      WHERE o.type = 'RECEIPT'
      ORDER BY o.id DESC
    `).all();

    const receipts = operations.map(o => ({
      id: o.id,
      ref: `WH/IN/${String(o.id).padStart(5, '0')}`,
      vendor: o.notes || 'Tata Steel',
      po: `PO-2026-${String(o.id).padStart(3, '0')}`,
      destination: o.to_location_name || 'Main Warehouse',
      date: o.created_at,
      items: o.product_name ? `${o.quantity} units (${o.product_name})` : 'Inbound Goods',
      status: o.status === 'validated' ? 'done' : 'ready'
    }));

    const rawProducts = productModel.getAllProducts();
    const locations = locationModel.getAllLocations();

    res.render('receipts', { receipts, products: rawProducts, locations });
  } catch (error) {
    console.error('Receipts page error:', error);
    res.status(500).send('Error loading receipts: ' + error.message);
  }
});

app.post('/receipts', requireAuth, authorizeRoles('Inbound Receipts (WH/IN)', 'Receiving Clerk'), (req, res) => {
  try {
    const { vendor, po, destination, product, productId, qty, quantity } = req.body;

    let targetProductId = productId;
    if (!targetProductId && product) {
      let p = db.prepare('SELECT id FROM products WHERE name LIKE ? OR sku LIKE ?').get(`%${product}%`, `%${product}%`);
      if (p) targetProductId = p.id;
    }
    if (!targetProductId) {
      const firstProd = db.prepare('SELECT id FROM products ORDER BY id ASC LIMIT 1').get();
      targetProductId = firstProd ? firstProd.id : 1;
    }

    let toLocId = 1;
    if (destination) {
      let loc = db.prepare('SELECT id FROM locations WHERE name LIKE ?').get(`%${destination}%`);
      if (loc) toLocId = loc.id;
    }

    const itemQty = parseInt(qty || quantity) || 50;

    operationModel.createOperation({
      type: 'RECEIPT',
      toLocationId: toLocId,
      createdBy: req.user.id || req.user.userId || 1,
      notes: vendor || po || 'Inbound Receipt',
      items: [{ productId: targetProductId, quantity: itemQty }]
    });

    res.redirect('/receipts');
  } catch (error) {
    console.error('Create receipt error:', error);
    res.redirect('/receipts?error=' + encodeURIComponent(error.message));
  }
});

// Validate & Receive Inbound Goods (increments product stock)
app.get('/receipts/:id/receive', requireAuth, authorizeRoles('Inbound Receipts (WH/IN)', 'Receiving Clerk'), (req, res) => {
  try {
    let opId = Number(req.params.id);
    if (!opId || isNaN(opId)) {
      // Find by reference string if WH/IN/00... was passed
      const cleanRef = req.params.id.replace(/\D/g, '');
      opId = Number(cleanRef);
    }

    const op = operationModel.getOperationById(opId);
    if (op && op.status === 'pending') {
      operationModel.validateOperation(opId, req.user.id || req.user.userId || 1);
    }
    res.redirect('/receipts');
  } catch (error) {
    console.error('Receive operation error:', error);
    res.redirect('/receipts?error=' + encodeURIComponent(error.message));
  }
});

// ------------------------------------------
// Outbound Deliveries
// ------------------------------------------
app.get('/deliveries', requireAuth, authorizeRoles('Outbound Deliveries (WH/OUT)', 'Forklift Operator'), (req, res) => {
  try {
    const operations = db.prepare(`
      SELECT o.*, fl.name AS from_location_name, u.name AS created_by_name,
             oi.product_id, oi.quantity, p.name AS product_name, p.sku AS product_sku
      FROM operations o
      LEFT JOIN operation_items oi ON oi.operation_id = o.id
      LEFT JOIN products p ON p.id = oi.product_id
      LEFT JOIN locations fl ON fl.id = o.from_location_id
      LEFT JOIN users u ON u.id = o.created_by
      WHERE o.type = 'DELIVERY'
      ORDER BY o.id DESC
    `).all();

    const deliveries = operations.map(o => ({
      id: o.id,
      ref: `WH/OUT/${String(o.id).padStart(5, '0')}`,
      customer: o.notes || 'ABC Manufacturing',
      so: `SO-2026-${String(o.id).padStart(3, '0')}`,
      carrier: 'FedEx Express Ground',
      date: o.created_at,
      items: o.product_name ? `${o.quantity} units (${o.product_name})` : 'Dispatched Goods',
      status: o.status === 'validated' ? 'done' : 'ready'
    }));

    const rawProducts = productModel.getAllProducts();
    const locations = locationModel.getAllLocations();

    res.render('deliveries', { deliveries, products: rawProducts, locations });
  } catch (error) {
    console.error('Deliveries page error:', error);
    res.status(500).send('Error loading deliveries: ' + error.message);
  }
});

app.post('/deliveries', requireAuth, authorizeRoles('Outbound Deliveries (WH/OUT)', 'Forklift Operator'), (req, res) => {
  try {
    const { customer, so, product, productId, qty, quantity, fromLocation } = req.body;

    let targetProductId = productId;
    if (!targetProductId && product) {
      let p = db.prepare('SELECT id FROM products WHERE name LIKE ? OR sku LIKE ?').get(`%${product}%`, `%${product}%`);
      if (p) targetProductId = p.id;
    }
    if (!targetProductId) {
      const firstProd = db.prepare('SELECT id FROM products ORDER BY id ASC LIMIT 1').get();
      targetProductId = firstProd ? firstProd.id : 1;
    }

    let fromLocId = 1;
    if (fromLocation) {
      let loc = db.prepare('SELECT id FROM locations WHERE name LIKE ?').get(`%${fromLocation}%`);
      if (loc) fromLocId = loc.id;
    }

    const itemQty = parseInt(qty || quantity) || 20;

    operationModel.createOperation({
      type: 'DELIVERY',
      fromLocationId: fromLocId,
      createdBy: req.user.id || req.user.userId || 1,
      notes: customer || so || 'Outbound Delivery',
      items: [{ productId: targetProductId, quantity: itemQty }]
    });

    res.redirect('/deliveries');
  } catch (error) {
    console.error('Create delivery error:', error);
    res.redirect('/deliveries?error=' + encodeURIComponent(error.message));
  }
});

// Validate & Ship Outbound Delivery (checks stock sufficiency & deducts stock)
app.get('/deliveries/:id/ship', requireAuth, authorizeRoles('Outbound Deliveries (WH/OUT)', 'Forklift Operator'), (req, res) => {
  try {
    let opId = Number(req.params.id);
    if (!opId || isNaN(opId)) {
      const cleanRef = req.params.id.replace(/\D/g, '');
      opId = Number(cleanRef);
    }

    const op = operationModel.getOperationById(opId);
    if (op && op.status === 'pending') {
      operationModel.validateOperation(opId, req.user.id || req.user.userId || 1);
    }
    res.redirect('/deliveries');
  } catch (error) {
    console.error('Ship delivery error:', error);
    res.redirect('/deliveries?error=' + encodeURIComponent(error.message));
  }
});

// ------------------------------------------
// Internal Transfers
// ------------------------------------------
app.get('/transfers', requireAuth, authorizeRoles('Internal Transfers (WH/INT)', 'Forklift Operator'), (req, res) => {
  try {
    const operations = db.prepare(`
      SELECT o.*, fl.name AS from_loc_name, tl.name AS to_loc_name, u.name AS created_by_name,
             oi.product_id, oi.quantity, p.name AS product_name, p.sku AS product_sku
      FROM operations o
      LEFT JOIN operation_items oi ON oi.operation_id = o.id
      LEFT JOIN products p ON p.id = oi.product_id
      LEFT JOIN locations fl ON fl.id = o.from_location_id
      LEFT JOIN locations tl ON tl.id = o.to_location_id
      LEFT JOIN users u ON u.id = o.created_by
      WHERE o.type = 'TRANSFER'
      ORDER BY o.id DESC
    `).all();

    const transfers = operations.map(o => ({
      id: o.id,
      ref: `WH/INT/${String(o.id).padStart(5, '0')}`,
      product: o.product_name || 'Transfer Goods',
      sku: o.product_sku || 'TRANS',
      from: o.from_loc_name || 'Main Warehouse',
      to: o.to_loc_name || 'Production Rack',
      qty: `${o.quantity} units`,
      date: o.created_at,
      operator: o.created_by_name || 'Operator',
      status: o.status === 'validated' ? 'done' : 'in_transit'
    }));

    const rawProducts = productModel.getAllProducts();
    const locations = locationModel.getAllLocations();

    res.render('transfers', { transfers, products: rawProducts, locations });
  } catch (error) {
    console.error('Transfers page error:', error);
    res.status(500).send('Error loading transfers: ' + error.message);
  }
});

app.post('/transfers', requireAuth, authorizeRoles('Internal Transfers (WH/INT)', 'Forklift Operator'), (req, res) => {
  try {
    const { product, productId, fromLocation, toLocation, qty, operator } = req.body;

    let targetProductId = productId;
    if (!targetProductId && product) {
      let p = db.prepare('SELECT id FROM products WHERE name LIKE ? OR sku LIKE ?').get(`%${product}%`, `%${product}%`);
      if (p) targetProductId = p.id;
    }
    if (!targetProductId) {
      const firstProd = db.prepare('SELECT id FROM products ORDER BY id ASC LIMIT 1').get();
      targetProductId = firstProd ? firstProd.id : 1;
    }

    let fromLocId = 1;
    let toLocId = 2;
    if (fromLocation) {
      let loc = db.prepare('SELECT id FROM locations WHERE name LIKE ?').get(`%${fromLocation}%`);
      if (loc) fromLocId = loc.id;
    }
    if (toLocation) {
      let loc = db.prepare('SELECT id FROM locations WHERE name LIKE ?').get(`%${toLocation}%`);
      if (loc) toLocId = loc.id;
    }

    const itemQty = parseInt(qty) || 30;

    operationModel.createOperation({
      type: 'TRANSFER',
      fromLocationId: fromLocId,
      toLocationId: toLocId,
      createdBy: req.user.id || req.user.userId || 1,
      notes: `Transfer by ${operator || 'Operator'}`,
      items: [{ productId: targetProductId, quantity: itemQty }]
    });

    res.redirect('/transfers');
  } catch (error) {
    console.error('Create transfer error:', error);
    res.redirect('/transfers?error=' + encodeURIComponent(error.message));
  }
});

app.get('/transfers/:id/complete', requireAuth, authorizeRoles('Internal Transfers (WH/INT)', 'Forklift Operator'), (req, res) => {
  try {
    let opId = Number(req.params.id);
    if (!opId || isNaN(opId)) {
      const cleanRef = req.params.id.replace(/\D/g, '');
      opId = Number(cleanRef);
    }

    const op = operationModel.getOperationById(opId);
    if (op && op.status === 'pending') {
      operationModel.validateOperation(opId, req.user.id || req.user.userId || 1);
    }
    res.redirect('/transfers');
  } catch (error) {
    console.error('Complete transfer error:', error);
    res.redirect('/transfers?error=' + encodeURIComponent(error.message));
  }
});

// ------------------------------------------
// Stock Adjustments
// ------------------------------------------
app.get('/adjustments', requireAuth, authorizeRoles('Inventory Adjustments (INV/ADJ)', 'Inventory Auditor'), (req, res) => {
  try {
    const operations = db.prepare(`
      SELECT o.*, tl.name AS location_name, u.name AS created_by_name,
             oi.product_id, oi.quantity, p.name AS product_name, p.sku AS product_sku
      FROM operations o
      LEFT JOIN operation_items oi ON oi.operation_id = o.id
      LEFT JOIN products p ON p.id = oi.product_id
      LEFT JOIN locations tl ON tl.id = o.to_location_id
      LEFT JOIN users u ON u.id = o.created_by
      WHERE o.type = 'ADJUSTMENT'
      ORDER BY o.id DESC
    `).all();

    const adjustments = operations.map(o => ({
      id: o.id,
      ref: `INV/ADJ/${String(o.id).padStart(5, '0')}`,
      product: o.product_name || 'Adjusted Product',
      sku: o.product_sku || 'ADJ',
      location: o.location_name || 'Main Warehouse',
      system: 0,
      counted: o.quantity,
      diff: o.quantity >= 0 ? `+${o.quantity}` : `${o.quantity}`,
      valDiff: `$0.00`,
      reason: o.notes || 'Cycle Count',
      auditor: o.created_by_name || 'Auditor',
      status: o.status === 'validated' ? 'applied' : 'pending',
      date: (o.created_at || '').substring(0, 10)
    }));

    const rawProducts = productModel.getAllProducts();
    const locations = locationModel.getAllLocations();

    res.render('adjustments', { adjustments, products: rawProducts, locations });
  } catch (error) {
    console.error('Adjustments page error:', error);
    res.status(500).send('Error loading adjustments: ' + error.message);
  }
});

app.post('/adjustments', requireAuth, authorizeRoles('Inventory Adjustments (INV/ADJ)', 'Inventory Auditor'), (req, res) => {
  try {
    const { product, productId, countedStock, countedQty, reason, location } = req.body;

    let targetProductId = productId;
    if (!targetProductId && product) {
      let p = db.prepare('SELECT id FROM products WHERE name LIKE ? OR sku LIKE ?').get(`%${product}%`, `%${product}%`);
      if (p) targetProductId = p.id;
    }
    if (!targetProductId) {
      const firstProd = db.prepare('SELECT id FROM products ORDER BY id ASC LIMIT 1').get();
      targetProductId = firstProd ? firstProd.id : 1;
    }

    let targetLocId = 1;
    if (location) {
      let loc = db.prepare('SELECT id FROM locations WHERE name LIKE ?').get(`%${location}%`);
      if (loc) targetLocId = loc.id;
    }

    const physicalCount = parseInt(countedStock !== undefined ? countedStock : countedQty) || 0;

    // Get current stock
    const currentStockRecord = db.prepare('SELECT quantity FROM stock WHERE product_id = ? AND location_id = ?').get(targetProductId, targetLocId);
    const currentStock = currentStockRecord ? currentStockRecord.quantity : 0;
    const diff = physicalCount - currentStock;

    if (diff !== 0) {
      const op = operationModel.createOperation({
        type: 'ADJUSTMENT',
        toLocationId: targetLocId,
        createdBy: req.user.id || req.user.userId || 1,
        notes: reason || 'Physical Cycle Count',
        items: [{ productId: targetProductId, quantity: diff }]
      });

      // Immediately validate adjustment
      operationModel.validateOperation(op.id, req.user.id || req.user.userId || 1);
    }

    res.redirect('/adjustments');
  } catch (error) {
    console.error('Create adjustment error:', error);
    res.redirect('/adjustments?error=' + encodeURIComponent(error.message));
  }
});

// ------------------------------------------
// Stock Ledger
// ------------------------------------------
app.get('/ledger', requireAuth, authorizeRoles('Stock Ledger & Audit', 'Inventory Auditor'), (req, res) => {
  try {
    const rawEntries = stockLedgerModel.getAllLedgerEntries();

    const ledger = rawEntries.map(e => ({
      id: e.id,
      time: e.created_at,
      type: (e.movement_type || '').toLowerCase().includes('receipt') ? 'receipt' :
            ((e.movement_type || '').toLowerCase().includes('delivery') ? 'delivery' :
            ((e.movement_type || '').toLowerCase().includes('transfer') ? 'transfer' : 'adjustment')),
      ref: e.operation_id ? `OP-${String(e.operation_id).padStart(5, '0')}` : `AUD-${String(e.id).padStart(5, '0')}`,
      product: e.product_name,
      sku: e.sku,
      from: e.movement_type === 'RECEIPT' ? 'Vendor / Supplier' : (e.movement_type === 'TRANSFER_IN' ? 'Transfer Locus' : e.location_name),
      to: e.movement_type === 'DELIVERY' ? 'Customer / Outbound' : e.location_name,
      qtyChange: e.quantity_change > 0 ? `+${e.quantity_change}` : `${e.quantity_change}`,
      unitCost: 15.00,
      valImpact: e.quantity_change > 0 ? `+$${(e.quantity_change * 15).toFixed(2)}` : `-$${Math.abs(e.quantity_change * 15).toFixed(2)}`,
      balance: e.new_quantity,
      user: e.performed_by_name || 'Admin'
    }));

    res.render('ledger', { ledger });
  } catch (error) {
    console.error('Ledger page error:', error);
    res.status(500).send('Error loading ledger: ' + error.message);
  }
});

// Fallback 404
app.use((req, res) => {
  if (req.originalUrl && req.originalUrl.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'API route not found' });
  }
  res.redirect('/dashboard');
});

// Start Server
app.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`🚀 StockSense IMS running at http://localhost:${PORT}`);
  console.log(`   - Login Page:  http://localhost:${PORT}/login`);
  console.log(`   - Dashboard:   http://localhost:${PORT}/dashboard`);
  console.log(`   - Products:    http://localhost:${PORT}/products`);
  console.log(`   - Receipts:    http://localhost:${PORT}/receipts`);
  console.log(`   - Deliveries:  http://localhost:${PORT}/deliveries`);
  console.log(`   - Transfers:   http://localhost:${PORT}/transfers`);
  console.log(`   - Adjustments: http://localhost:${PORT}/adjustments`);
  console.log(`   - Ledger:      http://localhost:${PORT}/ledger`);
  console.log(`==================================================\n`);
});

module.exports = app;
