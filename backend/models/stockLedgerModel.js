const db = require("../config/database");

const getAllLedgerEntries = (filters = {}) => {
    const conditions = [];
    const values = [];
    const allowed = {
        productId: "sl.product_id",
        locationId: "sl.location_id",
        movementType: "sl.movement_type",
        operationId: "sl.operation_id"
    };

    for (const [key, column] of Object.entries(allowed)) {
        if (filters[key] !== undefined && filters[key] !== "") {
            conditions.push(`${column} = ?`);
            values.push(filters[key]);
        }
    }
    if (filters.dateFrom) {
        conditions.push("sl.created_at >= ?");
        values.push(filters.dateFrom);
    }
    if (filters.dateTo) {
        conditions.push("sl.created_at <= ?");
        values.push(filters.dateTo);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    return db.prepare(`
        SELECT sl.id, sl.product_id, p.name AS product_name, p.sku,
               sl.location_id, COALESCE(l.name, 'General Warehouse') AS location_name, sl.operation_id,
               sl.movement_type, sl.quantity_change, sl.previous_quantity,
               sl.new_quantity, sl.performed_by, COALESCE(u.name, 'System') AS performed_by_name,
               sl.created_at
        FROM stock_ledger sl
        LEFT JOIN products p ON p.id = sl.product_id
        LEFT JOIN locations l ON l.id = sl.location_id
        LEFT JOIN users u ON u.id = sl.performed_by
        ${where}
        ORDER BY sl.id DESC
    `).all(...values);
};

const getLedgerById = (id) => db.prepare(`
    SELECT sl.id, sl.product_id, p.name AS product_name, p.sku,
           sl.location_id, COALESCE(l.name, 'General Warehouse') AS location_name, sl.operation_id,
           sl.movement_type, sl.quantity_change, sl.previous_quantity,
           sl.new_quantity, sl.performed_by, COALESCE(u.name, 'System') AS performed_by_name,
           sl.created_at
    FROM stock_ledger sl
    LEFT JOIN products p ON p.id = sl.product_id
    LEFT JOIN locations l ON l.id = sl.location_id
    LEFT JOIN users u ON u.id = sl.performed_by
    WHERE sl.id = ?
`).get(id);

const getLedgerEntryById = getLedgerById;

module.exports = {
    getAllLedgerEntries,
    getLedgerById,
    getLedgerEntryById
};