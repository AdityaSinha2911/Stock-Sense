const db = require("./database");
const bcrypt = require("bcryptjs");

/**
 * Seeds initial demo data for StockSense in SQLite.
 * Uses upsert / insert-if-not-exists so existing records are preserved.
 */
function seedDatabase() {
    console.log("🌱 Checking and seeding initial StockSense data...");

    // 1. Categories
    const categories = [
        "Raw Materials",
        "Electrical",
        "Office Furniture",
        "Packaging",
        "Safety Equipment",
        "Hardware",
        "Electronics"
    ];

    const categoryMap = {};
    for (const name of categories) {
        let cat = db.prepare("SELECT id FROM categories WHERE name = ?").get(name);
        if (!cat) {
            const info = db.prepare("INSERT INTO categories (name) VALUES (?)").run(name);
            categoryMap[name] = info.lastInsertRowid;
        } else {
            categoryMap[name] = cat.id;
        }
    }

    // 2. Locations
    const locations = [
        { name: "Main Warehouse", description: "Central warehouse storage" },
        { name: "Production Rack", description: "Production floor rack" },
        { name: "Warehouse 2", description: "Secondary storage facility" },
        { name: "Receiving Bay 2", description: "Inbound receiving dock" }
    ];

    const locationMap = {};
    for (const loc of locations) {
        let l = db.prepare("SELECT id FROM locations WHERE name = ?").get(loc.name);
        if (!l) {
            const info = db.prepare("INSERT INTO locations (name, description) VALUES (?, ?)").run(loc.name, loc.description);
            locationMap[loc.name] = info.lastInsertRowid;
        } else {
            locationMap[loc.name] = l.id;
        }
    }

    // 3. Demo Users
    const passwordHash123456 = bcrypt.hashSync("123456", 10);
    const passwordHashAdmin = bcrypt.hashSync("admin123", 10);

    const demoUsers = [
        {
            name: "Alex Smith",
            email: "admin@stocksense.io",
            password: passwordHashAdmin,
            role: "Warehouse Admin"
        },
        {
            name: "Rahul Sharma",
            email: "manager@stocksense.com",
            password: passwordHash123456,
            role: "manager"
        },
        {
            name: "Dave Chen",
            email: "clerk@stocksense.com",
            password: passwordHash123456,
            role: "Receiving Clerk"
        },
        {
            name: "Marcus Vance",
            email: "operator@stocksense.com",
            password: passwordHash123456,
            role: "Forklift Operator"
        },
        {
            name: "Sarah Jenkins",
            email: "auditor@stocksense.com",
            password: passwordHash123456,
            role: "Inventory Auditor"
        }
    ];

    const userMap = {};
    for (const u of demoUsers) {
        let existing = db.prepare("SELECT id FROM users WHERE email = ? COLLATE NOCASE").get(u.email);
        if (!existing) {
            const info = db.prepare(`
                INSERT INTO users (name, email, password, role)
                VALUES (?, ?, ?, ?)
            `).run(u.name, u.email, u.password, u.role);
            userMap[u.email] = info.lastInsertRowid;
        } else {
            // Update password hash to ensure test credentials always succeed
            db.prepare("UPDATE users SET password = ?, role = ? WHERE id = ?").run(u.password, u.role, existing.id);
            userMap[u.email] = existing.id;
        }
    }

    // 4. Demo Products & Stock
    const demoProducts = [
        {
            name: "Steel Rods",
            sku: "STL-001",
            category: "Raw Materials",
            unit: "kg",
            reorderLevel: 30,
            stockQty: 100,
            location: "Main Warehouse"
        },
        {
            name: "Copper Wire",
            sku: "CPW-501",
            category: "Electrical",
            unit: "rolls",
            reorderLevel: 15,
            stockQty: 8, // Low Stock (8 <= 15)
            location: "Main Warehouse"
        },
        {
            name: "Portland Cement",
            sku: "CEM-002",
            category: "Raw Materials",
            unit: "bags",
            reorderLevel: 50,
            stockQty: 250,
            location: "Main Warehouse"
        },
        {
            name: "Office Chair",
            sku: "CHR-101",
            category: "Office Furniture",
            unit: "pcs",
            reorderLevel: 10,
            stockQty: 45,
            location: "Main Warehouse"
        },
        {
            name: "Aluminum Heatsink 120mm",
            sku: "HSK-ALU-120",
            category: "Hardware",
            unit: "units",
            reorderLevel: 30,
            stockQty: 180,
            location: "Main Warehouse"
        },
        {
            name: "Lithium Iron Battery 48V",
            sku: "BAT-LFP-48100",
            category: "Electronics",
            unit: "units",
            reorderLevel: 15,
            stockQty: 42,
            location: "Main Warehouse"
        }
    ];

    const mainWhId = locationMap["Main Warehouse"] || 1;
    const adminUserId = userMap["admin@stocksense.io"] || 1;

    for (const prod of demoProducts) {
        let p = db.prepare("SELECT id FROM products WHERE sku = ?").get(prod.sku);
        let prodId;
        const catId = categoryMap[prod.category] || null;

        if (!p) {
            const info = db.prepare(`
                INSERT INTO products (name, sku, category_id, unit, reorder_level)
                VALUES (?, ?, ?, ?, ?)
            `).run(prod.name, prod.sku, catId, prod.unit, prod.reorderLevel);
            prodId = info.lastInsertRowid;
        } else {
            prodId = p.id;
            // Update reorder level and name
            db.prepare("UPDATE products SET name = ?, reorder_level = ?, unit = ? WHERE id = ?").run(
                prod.name, prod.reorderLevel, prod.unit, prodId
            );
        }

        // Check stock
        const existingStock = db.prepare("SELECT id, quantity FROM stock WHERE product_id = ? AND location_id = ?").get(prodId, mainWhId);
        if (!existingStock) {
            db.prepare("INSERT INTO stock (product_id, location_id, quantity) VALUES (?, ?, ?)").run(
                prodId, mainWhId, prod.stockQty
            );
            // Record initial ledger entry if no ledger entries exist for product
            const hasLedger = db.prepare("SELECT id FROM stock_ledger WHERE product_id = ?").get(prodId);
            if (!hasLedger) {
                db.prepare(`
                    INSERT INTO stock_ledger (
                        product_id, location_id, movement_type, quantity_change,
                        previous_quantity, new_quantity, performed_by
                    ) VALUES (?, ?, 'INITIAL_STOCK', ?, 0, ?, ?)
                `).run(prodId, mainWhId, prod.stockQty, prod.stockQty, adminUserId);
            }
        }
    }

    console.log("✅ StockSense database verified and seeded successfully");
}

module.exports = { seedDatabase };
