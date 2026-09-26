const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Set EJS as templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'front-end', 'views'));

// Core Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Static Assets
app.use(express.static(path.join(__dirname, 'front-end', 'public')));
app.use('/static', express.static(path.join(__dirname, 'front-end')));

// ==========================================
// IN-MEMORY DATABASE & STATE STORE
// ==========================================

const users = [
  { id: 1, name: 'Alex Smith', email: 'admin@stocksense.io', password: 'admin123', role: 'Inventory Lead' }
];

let products = [
  { id: 1, name: 'Stainless Steel Hex Bolt M8', sku: 'BOLT-SS-08', barcode: '78912345001', category: 'Hardware', cost: 0.45, price: 1.20, onHand: 14, uom: 'pcs', forecasted: 264, status: 'low_stock', minAlert: 50, location: 'WH-01 / Zone A' },
  { id: 2, name: 'Lithium Iron Battery 48V 100Ah', sku: 'BAT-LFP-48100', barcode: '78912345002', category: 'Electronics', cost: 420.00, price: 680.00, onHand: 42, uom: 'units', forecasted: 28, status: 'in_stock', minAlert: 15, location: 'WH-01 / Zone C' },
  { id: 3, name: 'Thermal Silicone Paste 50g', sku: 'THM-SIL-50', barcode: '78912345003', category: 'Chemical', cost: 4.80, price: 9.50, onHand: 6, uom: 'tubes', forecasted: 56, status: 'low_stock', minAlert: 25, location: 'WH-01 / Zone B' },
  { id: 4, name: 'Aluminum Heatsink 120mm', sku: 'HSK-ALU-120', barcode: '78912345004', category: 'Finished Goods', cost: 12.50, price: 24.00, onHand: 180, uom: 'units', forecasted: 155, status: 'in_stock', minAlert: 30, location: 'WH-01 / Zone B' },
  { id: 5, name: 'Corrugated Shipping Box XL', sku: 'BOX-CRD-12', barcode: '78912345005', category: 'Packaging', cost: 1.15, price: 2.50, onHand: 15, uom: 'units', forecasted: 500, status: 'low_stock', minAlert: 100, location: 'WH-03 / Packaging' },
  { id: 6, name: 'Microcontroller ATmega328P', sku: 'MCU-ATM-328', barcode: '78912345006', category: 'Electronics', cost: 2.10, price: 4.50, onHand: 28, uom: 'units', forecasted: 28, status: 'low_stock', minAlert: 100, location: 'WH-01 / Rack 04' },
  { id: 7, name: 'Copper Wiring Reel 100m', sku: 'WIR-CPR-100', barcode: '78912345007', category: 'Raw Materials', cost: 35.00, price: 62.00, onHand: 65, uom: 'reels', forecasted: 65, status: 'in_stock', minAlert: 20, location: 'WH-02 / Wire-Bay' },
  { id: 8, name: 'Industrial Safety Goggles', sku: 'PPE-GGL-01', barcode: '78912345008', category: 'Hardware', cost: 5.20, price: 11.00, onHand: 112, uom: 'pairs', forecasted: 112, status: 'in_stock', minAlert: 30, location: 'WH-01 / Safety' }
];

let receipts = [
  { ref: 'WH/IN/00104', vendor: 'Acme Industrial Corp', po: 'PO-2026-891', destination: 'WH-01 / Receiving Bay 2', date: '2026-10-14 09:30', items: '250 pcs (BOLT-SS-08)', productSku: 'BOLT-SS-08', qty: 250, status: 'ready' },
  { ref: 'WH/IN/00103', vendor: 'Apex Precision Metals', po: 'PO-2026-884', destination: 'WH-01 / Zone A', date: '2026-10-14 11:00', items: '120 units (HSK-ALU-120)', productSku: 'HSK-ALU-120', qty: 120, status: 'ready' },
  { ref: 'WH/IN/00102', vendor: 'Global Electronics Ltd', po: 'PO-2026-879', destination: 'WH-01 / Electronics', date: '2026-10-15 14:00', items: '100 units (MCU-ATM-328)', productSku: 'MCU-ATM-328', qty: 100, status: 'waiting' },
  { ref: 'WH/IN/00101', vendor: 'EcoPack Solutions', po: 'PO-2026-860', destination: 'WH-03 / Packaging', date: '2026-10-16 08:30', items: '500 boxes (BOX-CRD-12)', productSku: 'BOX-CRD-12', qty: 500, status: 'waiting' },
  { ref: 'WH/IN/00100', vendor: 'ChemTech Specialties', po: 'PO-2026-855', destination: 'WH-01 / Hazmat', date: '2026-10-11 16:00', items: '50 tubes (THM-SIL-50)', productSku: 'THM-SIL-50', qty: 50, status: 'done' }
];

let deliveries = [
  { ref: 'WH/OUT/00248', customer: 'Quantum Dynamics Corp', so: 'SO-2026-442', carrier: 'FedEx Express (TRK-9812)', date: '2026-10-14 14:00', items: '12 units (BAT-LFP-48100)', productSku: 'BAT-LFP-48100', qty: 12, status: 'ready' },
  { ref: 'WH/OUT/00247', customer: 'Tesla Energy Hub', so: 'SO-2026-440', carrier: 'Freight Direct (TRK-5521)', date: '2026-10-14 16:30', items: '25 units (HSK-ALU-120)', productSku: 'HSK-ALU-120', qty: 25, status: 'ready' },
  { ref: 'WH/OUT/00246', customer: 'Nexus Electronics', so: 'SO-2026-438', carrier: 'UPS Ground (TRK-7714)', date: '2026-10-15 10:00', items: '400 pcs (BOLT-SS-08)', productSku: 'BOLT-SS-08', qty: 400, status: 'waiting' },
  { ref: 'WH/OUT/00245', customer: 'BlueRiver Manufacturing', so: 'SO-2026-435', carrier: 'DHL Express (TRK-1002)', date: '2026-10-15 11:30', items: '10 reels (WIR-CPR-100)', productSku: 'WIR-CPR-100', qty: 10, status: 'waiting' },
  { ref: 'WH/OUT/00244', customer: 'Vortex Aerospace', so: 'SO-2026-429', carrier: 'FedEx Priority (TRK-8819)', date: '2026-10-13 17:00', items: '5 units (BAT-LFP-48100)', productSku: 'BAT-LFP-48100', qty: 5, status: 'in_transit' },
  { ref: 'WH/OUT/00243', customer: 'Omni Retailers Group', so: 'SO-2026-418', carrier: 'Local Courier Fleet', date: '2026-10-12 13:00', items: '5 reels (WIR-CPR-100)', productSku: 'WIR-CPR-100', qty: 5, status: 'done' }
];

let transfers = [
  { ref: 'WH/INT/00085', product: 'Aluminum Heatsink 120mm', sku: 'HSK-ALU-120', from: 'WH-01 / Zone A / Rack-02', to: 'WH-01 / Zone C / Bin-14', qty: '50 units', date: '2026-10-14 11:30', operator: 'Marcus Vance', status: 'in_transit' },
  { ref: 'WH/INT/00084', product: 'Stainless Steel Hex Bolt M8', sku: 'BOLT-SS-08', from: 'WH-01 / Receiving Bay 2', to: 'WH-01 / Zone A / Rack-01', qty: '250 pcs', date: '2026-10-14 12:45', operator: 'Dave Chen', status: 'in_transit' },
  { ref: 'WH/INT/00083', product: 'Lithium Iron Battery 48V', sku: 'BAT-LFP-48100', from: 'WH-01 / Bulk Storage', to: 'WH-01 / Pack Station 3', qty: '12 units', date: '2026-10-14 15:00', operator: 'Sarah Jenkins', status: 'scheduled' },
  { ref: 'WH/INT/00082', product: 'Copper Wiring Reel 100m', sku: 'WIR-CPR-100', from: 'WH-02 / Receiving', to: 'WH-02 / Wire-Bay', qty: '30 reels', date: '2026-10-14 16:30', operator: 'Elena Rostova', status: 'scheduled' },
  { ref: 'WH/INT/00081', product: 'Corrugated Shipping Box XL', sku: 'BOX-CRD-12', from: 'WH-03 / Packaging', to: 'WH-01 / Outbound Dock', qty: '200 units', date: '2026-10-13 14:10', operator: 'Marcus Vance', status: 'done' }
];

let adjustments = [
  { ref: 'INV/ADJ/00031', product: 'Stainless Steel Hex Bolt M8', sku: 'BOLT-SS-08', location: 'WH-01 / Zone A', system: 10, counted: 14, diff: '+4', valDiff: '+$4.80', reason: 'Cycle Count', auditor: 'Dave Chen', status: 'applied', date: '2026-10-14' },
  { ref: 'INV/ADJ/00030', product: 'Thermal Silicone Paste 50g', sku: 'THM-SIL-50', location: 'WH-01 / Zone B', system: 8, counted: 6, diff: '-2', valDiff: '-$19.00', reason: 'Damaged Packaging', auditor: 'Sarah Jenkins', status: 'pending', date: '2026-10-14' },
  { ref: 'INV/ADJ/00029', product: 'Copper Wiring Reel 100m', sku: 'WIR-CPR-100', location: 'WH-02 / Wire-Bay', system: 64, counted: 65, diff: '+1', valDiff: '+$62.00', reason: 'Unrecorded Return', auditor: 'Marcus Vance', status: 'pending', date: '2026-10-13' },
  { ref: 'INV/ADJ/00028', product: 'Microcontroller ATmega328P', sku: 'MCU-ATM-328', location: 'WH-01 / Rack 04', system: 30, counted: 28, diff: '-2', valDiff: '-$9.00', reason: 'ESD Test Samples', auditor: 'Dave Chen', status: 'pending', date: '2026-10-13' },
  { ref: 'INV/ADJ/00027', product: 'Corrugated Shipping Box XL', sku: 'BOX-CRD-12', location: 'WH-03 / Packaging', system: 30, counted: 15, diff: '-15', valDiff: '-$37.50', reason: 'Water Damage', auditor: 'Elena Rostova', status: 'applied', date: '2026-10-11' }
];

let ledger = [
  { time: '2026-10-14 11:30', type: 'transfer', ref: 'WH/INT/00085', product: 'Aluminum Heatsink 120mm', sku: 'HSK-ALU-120', from: 'Zone A', to: 'Zone C', qtyChange: '50', unitCost: 12.50, valImpact: '$0.00', balance: 180, user: 'Marcus Vance' },
  { time: '2026-10-14 09:30', type: 'receipt', ref: 'WH/IN/00104', product: 'Stainless Steel Hex Bolt M8', sku: 'BOLT-SS-08', from: 'Acme Corp', to: 'Receiving Bay 2', qtyChange: '+250', unitCost: 0.45, valImpact: '+$112.50', balance: 264, user: 'Alex Smith' },
  { time: '2026-10-14 08:15', type: 'adjustment', ref: 'INV/ADJ/00031', product: 'Stainless Steel Hex Bolt M8', sku: 'BOLT-SS-08', from: 'Physical Count', to: 'Zone A', qtyChange: '+4', unitCost: 0.45, valImpact: '+$1.80', balance: 14, user: 'Dave Chen' },
  { time: '2026-10-13 16:45', type: 'delivery', ref: 'WH/OUT/00248', product: 'Lithium Iron Battery 48V', sku: 'BAT-LFP-48100', from: 'Zone C', to: 'Quantum Dynamics', qtyChange: '-12', unitCost: 420.00, valImpact: '-$5,040.00', balance: 42, user: 'Sarah Jenkins' },
  { time: '2026-10-13 14:00', type: 'receipt', ref: 'WH/IN/00100', product: 'Thermal Silicone Paste 50g', sku: 'THM-SIL-50', from: 'ChemTech', to: 'Hazmat Bay', qtyChange: '+50', unitCost: 4.80, valImpact: '+$240.00', balance: 56, user: 'Elena Rostova' }
];

// Helper: Format current timestamp
function getTimestamp() {
  const now = new Date();
  return now.toISOString().replace('T', ' ').substring(0, 16);
}

// Session authentication middleware
function requireAuth(req, res, next) {
  const userCookie = req.cookies.stocksense_user;
  if (!userCookie) {
    return res.redirect('/login');
  }
  try {
    req.user = JSON.parse(userCookie);
    res.locals.currentUser = req.user;
    next();
  } catch (err) {
    res.clearCookie('stocksense_user');
    return res.redirect('/login');
  }
}

// Global user session helper
app.use((req, res, next) => {
  if (req.cookies.stocksense_user) {
    try {
      res.locals.currentUser = JSON.parse(req.cookies.stocksense_user);
    } catch (e) {
      res.locals.currentUser = null;
    }
  } else {
    res.locals.currentUser = null;
  }
  next();
});

// ==========================================
// ROUTES
// ==========================================

// Entry point: checks login status
app.get('/', (req, res) => {
  if (req.cookies.stocksense_user) {
    return res.redirect('/dashboard');
  }
  res.redirect('/login');
});

// Authentication Routes
app.get('/login', (req, res) => {
  if (req.cookies.stocksense_user) {
    return res.redirect('/dashboard');
  }
  const error = req.query.error || null;
  const success = req.query.logout ? 'You have been successfully logged out.' : null;
  res.render('login', { error, success });
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  // Find matching user or allow demo credentials
  const found = users.find(u => u.email.toLowerCase() === (email || '').toLowerCase() && u.password === password);
  
  if (found || (email && email.toLowerCase() === 'admin@stocksense.io' && password === 'admin123')) {
    const sessionUser = found || { name: 'Alex Smith', email: 'admin@stocksense.io', role: 'Inventory Lead' };
    res.cookie('stocksense_user', JSON.stringify(sessionUser), { maxAge: 24 * 60 * 60 * 1000, httpOnly: true });
    return res.redirect('/dashboard');
  }

  // Any non-empty email/password also logs in gracefully for testing
  if (email && password && password.length >= 4) {
    const newUser = { name: email.split('@')[0], email, role: 'Warehouse Operator' };
    res.cookie('stocksense_user', JSON.stringify(newUser), { maxAge: 24 * 60 * 60 * 1000, httpOnly: true });
    return res.redirect('/dashboard');
  }

  res.render('login', { 
    error: 'Invalid credentials. Use demo: admin@stocksense.io / admin123',
    success: null 
  });
});

app.get('/logout', (req, res) => {
  res.clearCookie('stocksense_user');
  res.redirect('/login?logout=1');
});

// ------------------------------------------
// Dashboard
// ------------------------------------------
app.get('/dashboard', requireAuth, (req, res) => {
  // Compute dynamic KPIs
  const totalValuation = products.reduce((acc, p) => acc + (p.cost * p.onHand), 0);
  const activeSKUs = products.length;
  const lowStockCount = products.filter(p => p.onHand <= p.minAlert).length;
  const pendingReceipts = receipts.filter(r => r.status === 'ready' || r.status === 'waiting').length;
  const pendingDeliveries = deliveries.filter(d => d.status === 'ready' || d.status === 'waiting').length;

  res.render('dashboard', {
    totalValuation: totalValuation.toFixed(2),
    activeSKUs,
    lowStockCount,
    pendingReceipts,
    pendingDeliveries,
    products,
    receipts,
    deliveries,
    transfers,
    adjustments,
    ledger: ledger.slice(0, 5)
  });
});

// ------------------------------------------
// Products Catalog
// ------------------------------------------
app.get('/products', requireAuth, (req, res) => {
  res.render('products', { products });
});

app.post('/products', requireAuth, (req, res) => {
  const { name, category, sku, barcode, uom, cost, price, initialStock, minAlert, location } = req.body;
  const parsedStock = parseInt(initialStock) || 0;
  const parsedCost = parseFloat(cost) || 0;
  const parsedMin = parseInt(minAlert) || 10;

  const newProduct = {
    id: products.length + 1,
    name: name || 'New Inventory Item',
    sku: (sku || `SKU-${Date.now()}`).toUpperCase(),
    barcode: barcode || `789${Math.floor(10000000 + Math.random() * 90000000)}`,
    category: category || 'General',
    cost: parsedCost,
    price: parseFloat(price) || 0,
    onHand: parsedStock,
    uom: uom || 'pcs',
    forecasted: parsedStock,
    status: parsedStock > parsedMin ? 'in_stock' : (parsedStock > 0 ? 'low_stock' : 'out_of_stock'),
    minAlert: parsedMin,
    location: location || 'Central WH (WH-01)'
  };

  products.unshift(newProduct);

  // If initial stock was provided, create initial audit record
  if (parsedStock > 0) {
    ledger.unshift({
      time: getTimestamp(),
      type: 'adjustment',
      ref: `INIT/${newProduct.sku}`,
      product: newProduct.name,
      sku: newProduct.sku,
      from: 'Initial Stock Count',
      to: newProduct.location,
      qtyChange: `+${parsedStock}`,
      unitCost: parsedCost,
      valImpact: `+$${(parsedStock * parsedCost).toFixed(2)}`,
      balance: parsedStock,
      user: req.user ? req.user.name : 'Alex Smith'
    });
  }

  res.redirect('/products');
});

// ------------------------------------------
// Inbound Receipts
// ------------------------------------------
app.get('/receipts', requireAuth, (req, res) => {
  res.render('receipts', { receipts, products });
});

app.post('/receipts', requireAuth, (req, res) => {
  const { vendor, po, destination, scheduledDate, product, qty, cost } = req.body;
  const refNum = 105 + receipts.length;
  const newReceipt = {
    ref: `WH/IN/00${refNum}`,
    vendor: vendor || 'Premier Supplies Inc',
    po: po || `PO-2026-${Math.floor(100 + Math.random() * 900)}`,
    destination: destination || 'WH-01 / Receiving Bay 2',
    date: scheduledDate ? scheduledDate.replace('T', ' ') : getTimestamp(),
    items: `${qty || 100} units (${product || 'Inventory Item'})`,
    productSku: 'BOLT-SS-08',
    qty: parseInt(qty) || 100,
    status: 'ready'
  };

  receipts.unshift(newReceipt);
  res.redirect('/receipts');
});

// Validate & Receive Inbound Goods (increments product stock)
app.get('/receipts/:ref/receive', requireAuth, (req, res) => {
  const receipt = receipts.find(r => r.ref === req.params.ref);
  if (receipt && receipt.status !== 'done') {
    receipt.status = 'done';
    
    // Find matching product and increment stock
    let targetProduct = products.find(p => p.sku === receipt.productSku) || products[0];
    if (targetProduct) {
      targetProduct.onHand += receipt.qty;
      targetProduct.forecasted = targetProduct.onHand;
      if (targetProduct.onHand > targetProduct.minAlert) {
        targetProduct.status = 'in_stock';
      }

      // Add to Ledger
      ledger.unshift({
        time: getTimestamp(),
        type: 'receipt',
        ref: receipt.ref,
        product: targetProduct.name,
        sku: targetProduct.sku,
        from: receipt.vendor,
        to: receipt.destination,
        qtyChange: `+${receipt.qty}`,
        unitCost: targetProduct.cost,
        valImpact: `+$${(receipt.qty * targetProduct.cost).toFixed(2)}`,
        balance: targetProduct.onHand,
        user: req.user ? req.user.name : 'Alex Smith'
      });
    }
  }
  res.redirect('/receipts');
});

// ------------------------------------------
// Outbound Deliveries
// ------------------------------------------
app.get('/deliveries', requireAuth, (req, res) => {
  res.render('deliveries', { deliveries, products });
});

app.post('/deliveries', requireAuth, (req, res) => {
  const { customer, so, carrier, scheduledDate, product, qty } = req.body;
  const refNum = 249 + deliveries.length;
  const newDelivery = {
    ref: `WH/OUT/00${refNum}`,
    customer: customer || 'Enterprise Client LLC',
    so: so || `SO-2026-${Math.floor(100 + Math.random() * 900)}`,
    carrier: carrier || 'FedEx Express Ground',
    date: scheduledDate ? scheduledDate.replace('T', ' ') : getTimestamp(),
    items: `${qty || 10} units`,
    productSku: 'BAT-LFP-48100',
    qty: parseInt(qty) || 10,
    status: 'ready'
  };

  deliveries.unshift(newDelivery);
  res.redirect('/deliveries');
});

// Validate & Ship Outbound Delivery (deducts product stock)
app.get('/deliveries/:ref/ship', requireAuth, (req, res) => {
  const delivery = deliveries.find(d => d.ref === req.params.ref);
  if (delivery && delivery.status !== 'done') {
    delivery.status = 'done';

    // Deduct stock from product
    let targetProduct = products.find(p => p.sku === delivery.productSku) || products[1];
    if (targetProduct) {
      targetProduct.onHand = Math.max(0, targetProduct.onHand - delivery.qty);
      targetProduct.forecasted = targetProduct.onHand;
      if (targetProduct.onHand === 0) {
        targetProduct.status = 'out_of_stock';
      } else if (targetProduct.onHand <= targetProduct.minAlert) {
        targetProduct.status = 'low_stock';
      }

      // Add to Ledger
      ledger.unshift({
        time: getTimestamp(),
        type: 'delivery',
        ref: delivery.ref,
        product: targetProduct.name,
        sku: targetProduct.sku,
        from: 'Zone C',
        to: delivery.customer,
        qtyChange: `-${delivery.qty}`,
        unitCost: targetProduct.cost,
        valImpact: `-$${(delivery.qty * targetProduct.cost).toFixed(2)}`,
        balance: targetProduct.onHand,
        user: req.user ? req.user.name : 'Alex Smith'
      });
    }
  }
  res.redirect('/deliveries');
});

// ------------------------------------------
// Internal Transfers
// ------------------------------------------
app.get('/transfers', requireAuth, (req, res) => {
  res.render('transfers', { transfers, products });
});

app.post('/transfers', requireAuth, (req, res) => {
  const { product, fromLocation, toLocation, qty, operator, scheduledDate } = req.body;
  const refNum = 86 + transfers.length;
  const newTransfer = {
    ref: `WH/INT/000${refNum}`,
    product: (product || 'Aluminum Heatsink 120mm').split('(')[0].trim(),
    sku: 'HSK-ALU-120',
    from: fromLocation || 'WH-01 / Zone A / Rack-02',
    to: toLocation || 'WH-01 / Zone C / Bin-14',
    qty: `${qty || 25} units`,
    date: scheduledDate ? scheduledDate.replace('T', ' ') : getTimestamp(),
    operator: operator || 'Marcus Vance',
    status: 'in_transit'
  };

  transfers.unshift(newTransfer);
  res.redirect('/transfers');
});

app.get('/transfers/:ref/complete', requireAuth, (req, res) => {
  const transfer = transfers.find(t => t.ref === req.params.ref);
  if (transfer) {
    transfer.status = 'done';
    ledger.unshift({
      time: getTimestamp(),
      type: 'transfer',
      ref: transfer.ref,
      product: transfer.product,
      sku: transfer.sku,
      from: transfer.from,
      to: transfer.to,
      qtyChange: transfer.qty.replace(/[^0-9]/g, ''),
      unitCost: 12.50,
      valImpact: '$0.00',
      balance: 180,
      user: transfer.operator
    });
  }
  res.redirect('/transfers');
});

// ------------------------------------------
// Stock Adjustments
// ------------------------------------------
app.get('/adjustments', requireAuth, (req, res) => {
  res.render('adjustments', { adjustments, products });
});

app.post('/adjustments', requireAuth, (req, res) => {
  const { product, countedStock, reason, auditor } = req.body;
  const counted = parseInt(countedStock) || 0;
  
  // Find product
  let targetProduct = products[0];
  const prodMatch = products.find(p => (product || '').includes(p.sku) || (product || '').includes(p.name));
  if (prodMatch) targetProduct = prodMatch;

  const diff = counted - targetProduct.onHand;
  const valImpact = diff * targetProduct.cost;
  const refNum = 32 + adjustments.length;

  const newAdj = {
    ref: `INV/ADJ/000${refNum}`,
    product: targetProduct.name,
    sku: targetProduct.sku,
    location: targetProduct.location,
    system: targetProduct.onHand,
    counted: counted,
    diff: (diff >= 0 ? `+${diff}` : `${diff}`),
    valDiff: (valImpact >= 0 ? `+$${valImpact.toFixed(2)}` : `-$${Math.abs(valImpact).toFixed(2)}`),
    reason: reason || 'Physical Cycle Count',
    auditor: auditor || 'Alex Smith',
    status: 'applied',
    date: getTimestamp().split(' ')[0]
  };

  // Reconcile product stock
  targetProduct.onHand = counted;
  targetProduct.forecasted = counted;
  if (counted <= 0) targetProduct.status = 'out_of_stock';
  else if (counted <= targetProduct.minAlert) targetProduct.status = 'low_stock';
  else targetProduct.status = 'in_stock';

  adjustments.unshift(newAdj);

  // Log in Ledger
  ledger.unshift({
    time: getTimestamp(),
    type: 'adjustment',
    ref: newAdj.ref,
    product: targetProduct.name,
    sku: targetProduct.sku,
    from: 'Physical Audit',
    to: targetProduct.location,
    qtyChange: newAdj.diff,
    unitCost: targetProduct.cost,
    valImpact: newAdj.valDiff,
    balance: targetProduct.onHand,
    user: newAdj.auditor
  });

  res.redirect('/adjustments');
});

// ------------------------------------------
// Stock Ledger
// ------------------------------------------
app.get('/ledger', requireAuth, (req, res) => {
  res.render('ledger', { ledger });
});

// Fallback 404
app.use((req, res) => {
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
