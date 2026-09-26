const db = require('./database');
require('./categories');

/**
 * Creates the 'products' table if it doesn't already exist.
 */
function createProductsTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      sku TEXT NOT NULL UNIQUE,
      category_id INTEGER NOT NULL,
      unit TEXT NOT NULL,
      reorder_level INTEGER DEFAULT 0,
      total_stock INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );
  `;
  db.exec(sql);
}

// Ensure the table exists upon loading the module
createProductsTable();

/**
 * Adds a new product to the products table.
 * @param {string} name - Product name
 * @param {string} sku - Unique Stock Keeping Unit
 * @param {number} categoryId - Foreign key referencing categories(id)
 * @param {string} unit - Measurement unit (e.g. 'pcs', 'kg', 'box')
 * @param {number} [reorderLevel=0] - Minimum stock level threshold
 * @param {number} [totalStock=0] - Initial stock quantity
 * @returns {object} Info object containing lastInsertRowid and changes
 */
function createProduct(name, sku, categoryId, unit, reorderLevel = 0, totalStock = 0) {
  const sql = `
    INSERT INTO products (name, sku, category_id, unit, reorder_level, total_stock)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  return db.prepare(sql).run(name, sku, categoryId, unit, reorderLevel, totalStock);
}

/**
 * Retrieves all products with their associated category name.
 * @returns {Array} Array of product objects with category_name
 */
function getAllProducts() {
  const sql = `
    SELECT 
      products.*,
      categories.name AS category_name
    FROM products
    LEFT JOIN categories ON products.category_id = categories.id
    ORDER BY products.created_at DESC
  `;
  return db.prepare(sql).all();
}

/**
 * Retrieves a single product by its ID with its associated category name.
 * @param {number|string} id - Product ID
 * @returns {object|undefined} Product object with category_name or undefined if not found
 */
function getProductById(id) {
  const sql = `
    SELECT 
      products.*,
      categories.name AS category_name
    FROM products
    LEFT JOIN categories ON products.category_id = categories.id
    WHERE products.id = ?
  `;
  return db.prepare(sql).get(id);
}

/**
 * Updates the total stock quantity of a product and refreshes updated_at timestamp.
 * @param {number|string} id - Product ID
 * @param {number} totalStock - Updated total stock quantity
 * @returns {object} Info object containing changes
 */
function updateProductStock(id, totalStock) {
  const sql = `
    UPDATE products
    SET total_stock = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  return db.prepare(sql).run(totalStock, id);
}

module.exports = {
  createProductsTable,
  createProduct,
  getAllProducts,
  getProductById,
  updateProductStock
};
