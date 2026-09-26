const db = require('./database');

/**
 * Creates the 'categories' table if it doesn't already exist.
 */
function createCategoriesTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;
  db.exec(sql);
}

// Ensure the table exists upon loading the module
createCategoriesTable();

/**
 * Adds a new category to the categories table.
 * @param {string} name - Unique category name
 * @param {string} [description=null] - Category description
 * @returns {object} Info object containing lastInsertRowid and changes
 */
function createCategory(name, description = null) {
  const sql = `
    INSERT INTO categories (name, description)
    VALUES (?, ?)
  `;
  return db.prepare(sql).run(name, description);
}

/**
 * Retrieves all categories from the categories table.
 * @returns {Array} Array of category objects
 */
function getAllCategories() {
  const sql = `SELECT * FROM categories ORDER BY name ASC`;
  return db.prepare(sql).all();
}

/**
 * Retrieves a single category by its ID.
 * @param {number|string} id - Category ID
 * @returns {object|undefined} The category object or undefined if not found
 */
function getCategoryById(id) {
  const sql = `SELECT * FROM categories WHERE id = ?`;
  return db.prepare(sql).get(id);
}

module.exports = {
  createCategoriesTable,
  createCategory,
  getAllCategories,
  getCategoryById
};
