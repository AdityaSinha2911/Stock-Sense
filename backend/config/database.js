const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

// Create database folder if it doesn't exist
const dbFolder = path.join(__dirname, "../database");

if (!fs.existsSync(dbFolder)) {
    fs.mkdirSync(dbFolder, { recursive: true });
}

// Create/connect to SQLite database
const dbPath = path.join(dbFolder, "stocksense.db");

const db = new Database(dbPath);

// Enable foreign keys
db.pragma("foreign_keys = ON");

console.log("✅ SQLite database connected");

module.exports = db;