const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Set EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'front-end', 'views'));

// Middleware for parsing requests
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static assets from front-end/public and front-end
app.use(express.static(path.join(__dirname, 'front-end', 'public')));
app.use('/static', express.static(path.join(__dirname, 'front-end')));

// Home redirects to dashboard
app.get('/', (req, res) => {
  res.redirect('/dashboard');
});

// Authentication Routes
app.get('/login', (req, res) => {
  res.render('login', { error: null, success: null });
});

app.post('/login', (req, res) => {
  // Mock login: redirects to dashboard
  res.redirect('/dashboard');
});

// Inventory Dashboard
app.get('/dashboard', (req, res) => {
  res.render('dashboard');
});

// Products Catalog
app.get('/products', (req, res) => {
  res.render('products');
});

app.post('/products', (req, res) => {
  console.log('New product submitted:', req.body);
  res.redirect('/products');
});

// Inbound Receipts
app.get('/receipts', (req, res) => {
  res.render('receipts');
});

app.post('/receipts', (req, res) => {
  console.log('New receipt submitted:', req.body);
  res.redirect('/receipts');
});

// Outbound Deliveries
app.get('/deliveries', (req, res) => {
  res.render('deliveries');
});

app.post('/deliveries', (req, res) => {
  console.log('New delivery submitted:', req.body);
  res.redirect('/deliveries');
});

// Internal Transfers
app.get('/transfers', (req, res) => {
  res.render('transfers');
});

app.post('/transfers', (req, res) => {
  console.log('New transfer submitted:', req.body);
  res.redirect('/transfers');
});

// Stock Adjustments
app.get('/adjustments', (req, res) => {
  res.render('adjustments');
});

app.post('/adjustments', (req, res) => {
  console.log('New adjustment submitted:', req.body);
  res.redirect('/adjustments');
});

// Stock Ledger & Audit Trail
app.get('/ledger', (req, res) => {
  res.render('ledger');
});

// Fallback for 404
app.use((req, res) => {
  res.status(404).redirect('/dashboard');
});

// Start Server
app.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`🚀 StockSense IMS running at http://localhost:${PORT}`);
  console.log(`   - Dashboard:   http://localhost:${PORT}/dashboard`);
  console.log(`   - Products:    http://localhost:${PORT}/products`);
  console.log(`   - Receipts:    http://localhost:${PORT}/receipts`);
  console.log(`   - Deliveries:  http://localhost:${PORT}/deliveries`);
  console.log(`   - Transfers:   http://localhost:${PORT}/transfers`);
  console.log(`   - Adjustments: http://localhost:${PORT}/adjustments`);
  console.log(`   - Ledger:      http://localhost:${PORT}/ledger`);
  console.log(`   - Login:       http://localhost:${PORT}/login`);
  console.log(`==================================================\n`);
});
