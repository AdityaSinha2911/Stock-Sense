const db = require("../config/database");

const getDashboard = () => ({
    totalProducts: db.prepare("SELECT COUNT(*) AS count FROM products").get().count,
    totalStock: db.prepare("SELECT COALESCE(SUM(quantity), 0) AS quantity FROM stock").get().quantity,
    totalLocations: db.prepare("SELECT COUNT(*) AS count FROM locations").get().count,
    lowStockProducts: db.prepare(`
        SELECT p.id, p.name, p.sku, p.reorder_level,
               COALESCE(SUM(s.quantity), 0) AS total_quantity
        FROM products p
        LEFT JOIN stock s ON s.product_id = p.id
        GROUP BY p.id
        HAVING total_quantity <= p.reorder_level
        ORDER BY total_quantity ASC, p.name ASC
    `).all(),
    pendingOperations: db.prepare(`
        SELECT COUNT(*) AS count FROM operations WHERE status = 'pending'
    `).get().count,
    recentOperations: db.prepare(`
        SELECT o.id, o.type, o.status, o.created_at, o.validated_at,
               u.name AS created_by_name
        FROM operations o JOIN users u ON u.id = o.created_by
        ORDER BY o.id DESC LIMIT 10
    `).all(),
    stockByLocation: db.prepare(`
        SELECT l.id, l.name, COALESCE(SUM(s.quantity), 0) AS total_quantity
        FROM locations l LEFT JOIN stock s ON s.location_id = l.id
        GROUP BY l.id ORDER BY l.name ASC
    `).all()
});

module.exports = { getDashboard };