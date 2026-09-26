const db = require('./database');

/**
 * Creates the 'locations' table if it doesn't already exist.
 */
function createLocationsTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      warehouse TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;
  db.exec(sql);
}

// Ensure the table exists upon loading the module
createLocationsTable();

/**
 * Adds a new storage location to the locations table.
 * Example locations: 'Rack A', 'Production Floor', etc.
 * @param {string} name - Name/identifier of the location within the warehouse
 * @param {string} warehouse - Warehouse name (e.g. 'Main Warehouse', 'Warehouse 2')
 * @returns {object} Info object containing lastInsertRowid and changes
 */
function createLocation(name, warehouse) {
  const sql = `
    INSERT INTO locations (name, warehouse)
    VALUES (?, ?)
  `;
  return db.prepare(sql).run(name, warehouse);
}

/**
 * Retrieves all locations from the locations table.
 * @returns {Array} Array of location objects
 */
function getAllLocations() {
  const sql = `SELECT * FROM locations ORDER BY warehouse ASC, name ASC`;
  return db.prepare(sql).all();
}

/**
 * Retrieves a single location by its ID.
 * @param {number|string} id - Location ID
 * @returns {object|undefined} The location object or undefined if not found
 */
function getLocationById(id) {
  const sql = `SELECT * FROM locations WHERE id = ?`;
  return db.prepare(sql).get(id);
}

module.exports = {
  createLocationsTable,
  createLocation,
  getAllLocations,
  getLocationById
};
