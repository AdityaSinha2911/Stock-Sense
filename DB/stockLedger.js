const db = require('./database');
require('./users');
require('./locations');
require('./products');

/**
 * Creates the 'stock_ledger' table if it doesn't already exist.
 */
function createStockLedgerTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS stock_ledger (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('RECEIPT', 'DELIVERY', 'TRANSFER', 'ADJUSTMENT')),
      quantity_change INTEGER NOT NULL,
      from_location_id INTEGER,
      to_location_id INTEGER,
      previous_stock INTEGER NOT NULL,
      new_stock INTEGER NOT NULL,
      reference_id INTEGER,
      note TEXT,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (from_location_id) REFERENCES locations(id),
      FOREIGN KEY (to_location_id) REFERENCES locations(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );
  `;
  db.exec(sql);
}

// Ensure the table exists upon loading the module
createStockLedgerTable();

/**
 * Records a new stock ledger movement entry.
 * @param {object} data - Ledger entry details
 * @returns {object} Info object containing lastInsertRowid and changes
 */
function createLedgerEntry(data) {
  const sql = `
    INSERT INTO stock_ledger (
      product_id,
      type,
      quantity_change,
      from_location_id,
      to_location_id,
      previous_stock,
      new_stock,
      reference_id,
      note,
      created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const productId = data.product_id ?? data.productId;
  const type = data.type;
  const quantityChange = data.quantity_change ?? data.quantityChange;
  const fromLocationId = data.from_location_id ?? data.fromLocationId ?? null;
  const toLocationId = data.to_location_id ?? data.toLocationId ?? null;
  const previousStock = data.previous_stock ?? data.previousStock;
  const newStock = data.new_stock ?? data.newStock;
  const referenceId = data.reference_id ?? data.referenceId ?? null;
  const note = data.note ?? null;
  const createdBy = data.created_by ?? data.createdBy ?? null;

  return db.prepare(sql).run(
    productId,
    type,
    quantityChange,
    fromLocationId,
    toLocationId,
    previousStock,
    newStock,
    referenceId,
    note,
    createdBy
  );
}

/**
 * Retrieves all ledger entries joined with product, user, and location names.
 * @returns {Array} Array of ledger entry objects
 */
function getAllLedgerEntries() {
  const sql = `
    SELECT 
      stock_ledger.*,
      products.name AS product_name,
      products.sku AS product_sku,
      users.name AS created_by_name,
      from_loc.name AS from_location_name,
      to_loc.name AS to_location_name
    FROM stock_ledger
    LEFT JOIN products ON stock_ledger.product_id = products.id
    LEFT JOIN users ON stock_ledger.created_by = users.id
    LEFT JOIN locations AS from_loc ON stock_ledger.from_location_id = from_loc.id
    LEFT JOIN locations AS to_loc ON stock_ledger.to_location_id = to_loc.id
    ORDER BY stock_ledger.created_at DESC
  `;
  return db.prepare(sql).all();
}

/**
 * Retrieves all ledger entries for a specific product by ID.
 * @param {number|string} productId - Product ID
 * @returns {Array} Array of ledger entry objects for that product
 */
function getLedgerByProduct(productId) {
  const sql = `
    SELECT 
      stock_ledger.*,
      products.name AS product_name,
      products.sku AS product_sku,
      users.name AS created_by_name,
      from_loc.name AS from_location_name,
      to_loc.name AS to_location_name
    FROM stock_ledger
    LEFT JOIN products ON stock_ledger.product_id = products.id
    LEFT JOIN users ON stock_ledger.created_by = users.id
    LEFT JOIN locations AS from_loc ON stock_ledger.from_location_id = from_loc.id
    LEFT JOIN locations AS to_loc ON stock_ledger.to_location_id = to_loc.id
    WHERE stock_ledger.product_id = ?
    ORDER BY stock_ledger.created_at DESC
  `;
  return db.prepare(sql).all(productId);
}

module.exports = {
  createStockLedgerTable,
  createLedgerEntry,
  getAllLedgerEntries,
  getLedgerByProduct
};
