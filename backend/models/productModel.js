const db = require("../config/database");

// ========================================
// GET ALL PRODUCTS
// ========================================
const getAllProducts = () => {
    return db.prepare(`
        SELECT
            p.id,
            p.name,
            p.sku,
            p.category_id,
            c.name AS category_name,
            p.unit,
            p.reorder_level,
            COALESCE((SELECT SUM(quantity) FROM stock WHERE product_id = p.id), 0) AS total_stock,
            p.created_at,
            p.updated_at
        FROM products p
        LEFT JOIN categories c
            ON p.category_id = c.id
        ORDER BY p.id DESC
    `).all();
};


// ========================================
// GET PRODUCT BY ID
// ========================================
const getProductById = (id) => {
    return db.prepare(`
        SELECT
            p.id,
            p.name,
            p.sku,
            p.category_id,
            c.name AS category_name,
            p.unit,
            p.reorder_level,
            COALESCE((SELECT SUM(quantity) FROM stock WHERE product_id = p.id), 0) AS total_stock,
            p.created_at,
            p.updated_at
        FROM products p
        LEFT JOIN categories c
            ON p.category_id = c.id
        WHERE p.id = ?
    `).get(id);
};


// ========================================
// CREATE PRODUCT
// ========================================
const createProduct = (
    name,
    sku,
    categoryId,
    unit,
    reorderLevel,
    initialStock = 0,
    locationId = 1
) => {

    const result = db.prepare(`
        INSERT INTO products (
            name,
            sku,
            category_id,
            unit,
            reorder_level
        )
        VALUES (?, ?, ?, ?, ?)
    `).run(
        name,
        sku,
        categoryId || null,
        unit,
        reorderLevel || 0
    );

    const newProdId = result.lastInsertRowid;
    if (initialStock && Number(initialStock) > 0) {
        db.prepare(`
            INSERT INTO stock (product_id, location_id, quantity)
            VALUES (?, ?, ?)
        `).run(newProdId, locationId || 1, Number(initialStock));

        db.prepare(`
            INSERT INTO stock_ledger (
                product_id, location_id, movement_type, quantity_change,
                previous_quantity, new_quantity, performed_by
            ) VALUES (?, ?, 'INITIAL_STOCK', ?, 0, ?, 1)
        `).run(newProdId, locationId || 1, Number(initialStock), Number(initialStock));
    }

    return getProductById(newProdId);
};


// ========================================
// UPDATE PRODUCT
// ========================================
const updateProduct = (
    id,
    name,
    sku,
    categoryId,
    unit,
    reorderLevel
) => {

    const result = db.prepare(`
        UPDATE products
        SET
            name = ?,
            sku = ?,
            category_id = ?,
            unit = ?,
            reorder_level = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `).run(
        name,
        sku,
        categoryId || null,
        unit,
        reorderLevel || 0,
        id
    );

    if (result.changes === 0) {
        return null;
    }

    return getProductById(id);
};


// ========================================
// DELETE PRODUCT
// ========================================
const deleteProduct = (id) => {
    const references = db.prepare(`
        SELECT
            (SELECT COUNT(*) FROM stock WHERE product_id = ?) AS stock_count,
            (SELECT COUNT(*) FROM operation_items WHERE product_id = ?) AS item_count,
            (SELECT COUNT(*) FROM stock_ledger WHERE product_id = ?) AS ledger_count
    `).get(id, id, id);

    if (references.stock_count || references.item_count || references.ledger_count) {
        const error = new Error("Product cannot be deleted because it has stock or operation history");
        error.code = "PRODUCT_REFERENCED";
        throw error;
    }

    return db.prepare(`
        DELETE FROM products
        WHERE id = ?
    `).run(id);
};


// ========================================
// EXPORTS
// ========================================
module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
};