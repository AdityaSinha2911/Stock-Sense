const db = require("../config/database");

const validateOperationInput = ({ type, fromLocationId, toLocationId, createdBy, items }) => {
    const allowedTypes = ["RECEIPT", "DELIVERY", "TRANSFER", "ADJUSTMENT"];
    if (!allowedTypes.includes(type)) {
        throw new Error("Invalid operation type");
    }
    if (!Number.isInteger(Number(createdBy)) || !db.prepare("SELECT id FROM users WHERE id = ?").get(createdBy)) {
        throw new Error("Invalid creating user");
    }
    if (!Array.isArray(items) || items.length === 0) {
        throw new Error("Operation requires at least one item");
    }

    if (type === "RECEIPT" && !toLocationId) throw new Error("Receipt requires destination location");
    if (type === "DELIVERY" && !fromLocationId) throw new Error("Delivery requires source location");
    if (type === "TRANSFER" && (!fromLocationId || !toLocationId || Number(fromLocationId) === Number(toLocationId))) {
        throw new Error("Transfer requires different source and destination locations");
    }
    if (type === "ADJUSTMENT" && !toLocationId) throw new Error("Adjustment requires a location");

    for (const locationId of [fromLocationId, toLocationId].filter(Boolean)) {
        if (!Number.isInteger(Number(locationId)) || !db.prepare("SELECT id FROM locations WHERE id = ?").get(locationId)) {
            throw new Error(`Location ${locationId} not found`);
        }
    }

    for (const item of items) {
        const validQuantity = Number.isInteger(item.quantity)
            && (type === "ADJUSTMENT" ? item.quantity !== 0 : item.quantity > 0);
        if (!Number.isInteger(Number(item.productId)) || !validQuantity) {
            throw new Error("Each item must have a valid productId and quantity");
        }
        if (!db.prepare("SELECT id FROM products WHERE id = ?").get(item.productId)) {
            throw new Error(`Product ${item.productId} not found`);
        }
    }
};

// ========================================
// CREATE OPERATION
// ========================================
const createOperation = (operationData) => {
    const {
        type,
        fromLocationId,
        toLocationId,
        createdBy,
        notes,
        items
    } = operationData;

    validateOperationInput(operationData);

    const transaction = db.transaction(() => {

        const operationResult = db.prepare(`
            INSERT INTO operations (
                type,
                status,
                from_location_id,
                to_location_id,
                created_by,
                notes
            )
            VALUES (?, 'pending', ?, ?, ?, ?)
        `).run(
            type,
            fromLocationId || null,
            toLocationId || null,
            createdBy,
            notes || null
        );

        const operationId = operationResult.lastInsertRowid;

        const itemStatement = db.prepare(`
            INSERT INTO operation_items (
                operation_id,
                product_id,
                quantity
            )
            VALUES (?, ?, ?)
        `);

        for (const item of items) {
            itemStatement.run(
                operationId,
                item.productId,
                item.quantity
            );
        }

        return operationId;
    });

    const operationId = transaction();

    return getOperationById(operationId);
};


// ========================================
// GET ALL OPERATIONS
// ========================================
const getAllOperations = () => {
    return db.prepare(`
        SELECT
            o.id,
            o.type,
            o.status,
            o.from_location_id,
            fl.name AS from_location_name,
            o.to_location_id,
            tl.name AS to_location_name,
            o.created_by,
            u.name AS created_by_name,
            o.validated_by,
            o.notes,
            o.created_at,
            o.validated_at
        FROM operations o

        LEFT JOIN locations fl
            ON o.from_location_id = fl.id

        LEFT JOIN locations tl
            ON o.to_location_id = tl.id

        LEFT JOIN users u
            ON o.created_by = u.id

        ORDER BY o.id DESC
    `).all();
};


// ========================================
// GET SINGLE OPERATION
// ========================================
const getOperationById = (id) => {

    const operation = db.prepare(`
        SELECT
            o.id,
            o.type,
            o.status,
            o.from_location_id,
            fl.name AS from_location_name,
            o.to_location_id,
            tl.name AS to_location_name,
            o.created_by,
            u.name AS created_by_name,
            o.validated_by,
            o.notes,
            o.created_at,
            o.validated_at
        FROM operations o

        LEFT JOIN locations fl
            ON o.from_location_id = fl.id

        LEFT JOIN locations tl
            ON o.to_location_id = tl.id

        LEFT JOIN users u
            ON o.created_by = u.id

        WHERE o.id = ?
    `).get(id);

    if (!operation) {
        return null;
    }

    const items = db.prepare(`
        SELECT
            oi.id,
            oi.product_id,
            p.name AS product_name,
            p.sku,
            oi.quantity
        FROM operation_items oi
        JOIN products p
            ON oi.product_id = p.id
        WHERE oi.operation_id = ?
    `).all(id);

    return {
        ...operation,
        items
    };
};


// ========================================
// VALIDATE OPERATION
// ========================================
const validateOperation = (operationId, validatedBy) => {

    const transaction = db.transaction(() => {

        const operation = db.prepare(`
            SELECT *
            FROM operations
            WHERE id = ?
        `).get(operationId);

        if (!operation) {
            throw new Error("Operation not found");
        }

        if (operation.status !== "pending") {
            throw new Error(operation.status === "validated" ? "Operation already validated" : "Only pending operations can be validated");
        }

        const items = db.prepare(`
            SELECT *
            FROM operation_items
            WHERE operation_id = ?
        `).all(operationId);

        if (items.length === 0) {
            throw new Error("Operation has no items");
        }

        // ========================================
        // RECEIPT
        // ========================================
        if (operation.type === "RECEIPT") {

            if (!operation.to_location_id) {
                throw new Error(
                    "Receipt requires destination location"
                );
            }

            for (const item of items) {

                updateStock(
                    item.product_id,
                    operation.to_location_id,
                    item.quantity
                );

                createLedgerEntry(
                    item.product_id,
                    operation.to_location_id,
                    operation.id,
                    "RECEIPT",
                    item.quantity,
                    validatedBy
                );
            }
        }

        // ========================================
        // DELIVERY
        // ========================================
        else if (operation.type === "DELIVERY") {

            if (!operation.from_location_id) {
                throw new Error(
                    "Delivery requires source location"
                );
            }

            for (const item of items) {

                updateStock(
                    item.product_id,
                    operation.from_location_id,
                    -item.quantity
                );

                createLedgerEntry(
                    item.product_id,
                    operation.from_location_id,
                    operation.id,
                    "DELIVERY",
                    -item.quantity,
                    validatedBy
                );
            }
        }

        // ========================================
        // TRANSFER
        // ========================================
        else if (operation.type === "TRANSFER") {

            if (
                !operation.from_location_id ||
                !operation.to_location_id
            ) {
                throw new Error(
                    "Transfer requires source and destination locations"
                );
            }

            if (
                operation.from_location_id ===
                operation.to_location_id
            ) {
                throw new Error(
                    "Source and destination cannot be the same"
                );
            }

            for (const item of items) {

                // Remove from source
                updateStock(
                    item.product_id,
                    operation.from_location_id,
                    -item.quantity
                );

                createLedgerEntry(
                    item.product_id,
                    operation.from_location_id,
                    operation.id,
                    "TRANSFER_OUT",
                    -item.quantity,
                    validatedBy
                );

                // Add to destination
                updateStock(
                    item.product_id,
                    operation.to_location_id,
                    item.quantity
                );

                createLedgerEntry(
                    item.product_id,
                    operation.to_location_id,
                    operation.id,
                    "TRANSFER_IN",
                    item.quantity,
                    validatedBy
                );
            }
        }

        // ========================================
        // ADJUSTMENT
        // ========================================
        else if (operation.type === "ADJUSTMENT") {

            if (!operation.to_location_id) {
                throw new Error(
                    "Adjustment requires a location"
                );
            }

            for (const item of items) {

                updateStock(
                    item.product_id,
                    operation.to_location_id,
                    item.quantity
                );

                createLedgerEntry(
                    item.product_id,
                    operation.to_location_id,
                    operation.id,
                    "ADJUSTMENT",
                    item.quantity,
                    validatedBy
                );
            }
        }

        else {
            throw new Error(
                "Invalid operation type"
            );
        }

        // Mark operation validated
        db.prepare(`
            UPDATE operations
            SET
                status = 'validated',
                validated_by = ?,
                validated_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(
            validatedBy,
            operationId
        );
    });

    transaction();

    return getOperationById(operationId);
};


// ========================================
// UPDATE STOCK
// ========================================
const updateStock = (
    productId,
    locationId,
    quantityChange
) => {

    const existingStock = db.prepare(`
        SELECT *
        FROM stock
        WHERE product_id = ?
        AND location_id = ?
    `).get(
        productId,
        locationId
    );

    const currentQuantity = existingStock
        ? existingStock.quantity
        : 0;

    const newQuantity =
        currentQuantity + quantityChange;

    // Prevent negative stock
    if (newQuantity < 0) {
        throw new Error(
            `Insufficient stock for product ${productId}`
        );
    }

    if (existingStock) {

        db.prepare(`
            UPDATE stock
            SET quantity = ?
            WHERE product_id = ?
            AND location_id = ?
        `).run(
            newQuantity,
            productId,
            locationId
        );

    } else {

        db.prepare(`
            INSERT INTO stock (
                product_id,
                location_id,
                quantity
            )
            VALUES (?, ?, ?)
        `).run(
            productId,
            locationId,
            newQuantity
        );
    }

    return {
        previousQuantity: currentQuantity,
        newQuantity
    };
};


// ========================================
// CREATE LEDGER ENTRY
// ========================================
const createLedgerEntry = (
    productId,
    locationId,
    operationId,
    movementType,
    quantityChange,
    performedBy
) => {

    const stock = db.prepare(`
        SELECT quantity
        FROM stock
        WHERE product_id = ?
        AND location_id = ?
    `).get(
        productId,
        locationId
    );

    const newQuantity = stock
        ? stock.quantity
        : 0;

    const previousQuantity =
        newQuantity - quantityChange;

    db.prepare(`
        INSERT INTO stock_ledger (
            product_id,
            location_id,
            operation_id,
            movement_type,
            quantity_change,
            previous_quantity,
            new_quantity,
            performed_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        productId,
        locationId,
        operationId,
        movementType,
        quantityChange,
        previousQuantity,
        newQuantity,
        performedBy
    );
};


module.exports = {
    createOperation,
    getAllOperations,
    getOperationById,
    validateOperation
};