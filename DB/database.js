const Database = require('better-sqlite3');
const path = require('path');

// Path to the SQLite database file inside the DB directory
const dbPath = path.join(__dirname, 'stocksense.db');

// Create or open the SQLite database
const db = new Database(dbPath);

// Enable foreign key constraints
db.pragma('foreign_keys = ON');

/**
 * Simple helper to safely execute INSERT, UPDATE, DELETE queries.
 * Uses prepared statements to prevent SQL injection.
 * @param {string} sql - SQL query with ? placeholders
 * @param {Array} [params] - Query parameters
 * @returns {object} Info with lastInsertRowid and changes
 */
function run(sql, params = []) {
  return db.prepare(sql).run(params);
}

/**
 * Simple helper to safely fetch a single row (e.g. by ID).
 * @param {string} sql - SQL query with ? placeholders
 * @param {Array} [params] - Query parameters
 * @returns {object|undefined} The row object or undefined
 */
function queryOne(sql, params = []) {
  return db.prepare(sql).get(params);
}

/**
 * Simple helper to safely fetch all matching rows.
 * @param {string} sql - SQL query with ? placeholders
 * @param {Array} [params] - Query parameters
 * @returns {Array} Array of row objects
 */
function queryAll(sql, params = []) {
  return db.prepare(sql).all(params);
}

// Attach helpers to the database instance for easy access
db.run = run;
db.queryOne = queryOne;
db.queryAll = queryAll;
db.db = db;

// Export the database connection
module.exports = db;
