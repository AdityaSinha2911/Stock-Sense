const db = require("./database");

console.log("Creating StockSense database tables...");

// ============================
// USERS
// ============================
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'warehouse_staff',
        reset_otp TEXT,
        reset_otp_expiry DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

// ============================
// CATEGORIES
// ============================
db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

// ============================
// LOCATIONS
// ============================
db.exec(`
    CREATE TABLE IF NOT EXISTS locations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

// ============================
// PRODUCTS
// ============================
db.exec(`
    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        sku TEXT NOT NULL UNIQUE,
        category_id INTEGER,
        unit TEXT NOT NULL,
        reorder_level INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (category_id)
            REFERENCES categories(id)
            ON DELETE SET NULL
    )
`);

// ============================
// STOCK
// ============================
db.exec(`
    CREATE TABLE IF NOT EXISTS stock (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        location_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 0,

        UNIQUE(product_id, location_id),

        FOREIGN KEY (product_id)
            REFERENCES products(id)
            ON DELETE CASCADE,

        FOREIGN KEY (location_id)
            REFERENCES locations(id)
            ON DELETE CASCADE
    )
`);

// ============================
// OPERATIONS
// ============================
db.exec(`
    CREATE TABLE IF NOT EXISTS operations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',

        from_location_id INTEGER,
        to_location_id INTEGER,

        created_by INTEGER NOT NULL,
        validated_by INTEGER,

        notes TEXT,

        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        validated_at DATETIME,

        FOREIGN KEY (from_location_id)
            REFERENCES locations(id),

        FOREIGN KEY (to_location_id)
            REFERENCES locations(id),

        FOREIGN KEY (created_by)
            REFERENCES users(id),

        FOREIGN KEY (validated_by)
            REFERENCES users(id)
    )
`);

// ============================
// OPERATION ITEMS
// ============================
db.exec(`
    CREATE TABLE IF NOT EXISTS operation_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        operation_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,

        quantity INTEGER NOT NULL,

        FOREIGN KEY (operation_id)
            REFERENCES operations(id)
            ON DELETE CASCADE,

        FOREIGN KEY (product_id)
            REFERENCES products(id)
    )
`);

// ============================
// STOCK LEDGER
// ============================
db.exec(`
    CREATE TABLE IF NOT EXISTS stock_ledger (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        product_id INTEGER NOT NULL,
        location_id INTEGER NOT NULL,

        operation_id INTEGER,

        movement_type TEXT NOT NULL,
        quantity_change INTEGER NOT NULL,

        previous_quantity INTEGER NOT NULL,
        new_quantity INTEGER NOT NULL,

        performed_by INTEGER NOT NULL,

        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (product_id)
            REFERENCES products(id),

        FOREIGN KEY (location_id)
            REFERENCES locations(id),

        FOREIGN KEY (operation_id)
            REFERENCES operations(id),

        FOREIGN KEY (performed_by)
            REFERENCES users(id)
    )
`);

console.log("✅ All StockSense tables created successfully");

if (require.main === module) {
    db.close();
}