const db = require('./database');

/**
 * Creates the 'users' table if it doesn't already exist.
 */
function createUsersTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('manager', 'staff')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;
  db.exec(sql);
}

// Ensure the table exists upon loading the module
createUsersTable();

/**
 * Adds a new user to the users table.
 * @param {string} name - User's full name
 * @param {string} email - Unique email address
 * @param {string} password - User password
 * @param {string} [role='staff'] - User role ('manager' or 'staff')
 * @returns {object} Info object containing lastInsertRowid and changes
 */
function createUser(name, email, password, role = 'staff') {
  const sql = `
    INSERT INTO users (name, email, password, role)
    VALUES (?, ?, ?, ?)
  `;
  return db.prepare(sql).run(name, email, password, role);
}

/**
 * Retrieves a single user by their email address.
 * @param {string} email - User email address
 * @returns {object|undefined} The user object or undefined if not found
 */
function getUserByEmail(email) {
  const sql = `SELECT * FROM users WHERE email = ?`;
  return db.prepare(sql).get(email);
}

/**
 * Retrieves all users from the users table.
 * @returns {Array} Array of user objects
 */
function getAllUsers() {
  const sql = `SELECT * FROM users ORDER BY created_at DESC`;
  return db.prepare(sql).all();
}

module.exports = {
  createUsersTable,
  createUser,
  getUserByEmail,
  getAllUsers
};
