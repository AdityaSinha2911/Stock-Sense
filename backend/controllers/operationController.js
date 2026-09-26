const {
    createOperation,
    getAllOperations,
    getOperationById,
    validateOperation
} = require("../models/operationModel");
const db = require("../config/database");

const isValidId = (id) => Number.isInteger(Number(id)) && Number(id) > 0;


// ========================================
// CREATE OPERATION
// ========================================
const createNewOperation = (req, res) => {
    try {

        const {
            type,
            fromLocationId,
            toLocationId,
            notes,
            items
        } = req.body;
        const adjustmentLocationId = toLocationId || req.body.locationId;

        const allowedTypes = [
            "RECEIPT",
            "DELIVERY",
            "TRANSFER",
            "ADJUSTMENT"
        ];

        if (!type || !allowedTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                message:
                    "Valid operation type is required"
            });
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one item is required"
            });
        }

        if (type === "RECEIPT" && !toLocationId) {
            return res.status(400).json({ success: false, message: "Receipt requires destination location" });
        }
        if (type === "DELIVERY" && !fromLocationId) {
            return res.status(400).json({ success: false, message: "Delivery requires source location" });
        }
        if (type === "TRANSFER" && (!fromLocationId || !toLocationId || Number(fromLocationId) === Number(toLocationId))) {
            return res.status(400).json({ success: false, message: "Transfer requires different source and destination locations" });
        }
        if (type === "ADJUSTMENT" && !adjustmentLocationId) {
            return res.status(400).json({ success: false, message: "Adjustment requires a location" });
        }

        const locationIds = [fromLocationId, toLocationId, adjustmentLocationId].filter(Boolean);
        if (locationIds.some((id) => !Number.isInteger(Number(id)) || !db.prepare("SELECT id FROM locations WHERE id = ?").get(id))) {
            return res.status(404).json({ success: false, message: "One or more locations were not found" });
        }

        for (const item of items) {

            if (
                !item.productId ||
                !Number.isInteger(item.quantity) ||
                (type === "ADJUSTMENT" ? item.quantity === 0 : item.quantity <= 0)
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        type === "ADJUSTMENT"
                            ? "Each adjustment item must have a valid productId and non-zero quantity"
                            : "Each item must have a valid productId and positive quantity"
                });
            }
            if (!db.prepare("SELECT id FROM products WHERE id = ?").get(item.productId)) {
                return res.status(404).json({ success: false, message: `Product ${item.productId} not found` });
            }
        }

        const operation = createOperation({
            type,
            fromLocationId,
            toLocationId: adjustmentLocationId,
            createdBy: req.user.userId,
            notes,
            items
        });

        res.status(201).json({
            success: true,
            message: "Operation created successfully",
            operation
        });

    } catch (error) {

        console.error(
            "Create operation error:",
            error
        );

        const message = error.message || "";
        const notFound = /not found/i.test(message);
        const validationError = /invalid|requires|positive|non-zero|different|at least/i.test(message);
        return res.status(notFound ? 404 : validationError ? 400 : 500).json({
            success: false,
            message: validationError || notFound ? message : "Server error"
        });
    }
};


// ========================================
// GET ALL OPERATIONS
// ========================================
const getOperations = (req, res) => {
    try {

        const operations = getAllOperations();

        res.status(200).json({
            success: true,
            count: operations.length,
            operations
        });

    } catch (error) {

        console.error(
            "Get operations error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


// ========================================
// GET SINGLE OPERATION
// ========================================
const getOperation = (req, res) => {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid operation ID" });
        }

        const operation =
            getOperationById(req.params.id);

        if (!operation) {
            return res.status(404).json({
                success: false,
                message: "Operation not found"
            });
        }

        res.status(200).json({
            success: true,
            operation
        });

    } catch (error) {

        console.error(
            "Get operation error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


// ========================================
// VALIDATE OPERATION
// ========================================
const validateExistingOperation = (req, res) => {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid operation ID" });
        }

        // Only manager can validate
        if (req.user.role !== "manager") {
            return res.status(403).json({
                success: false,
                message:
                    "Only managers can validate operations"
            });
        }

        const operation =
            validateOperation(
                req.params.id,
                req.user.userId
            );

        res.status(200).json({
            success: true,
            message:
                "Operation validated and stock updated",
            operation
        });

    } catch (error) {

        console.error(
            "Validate operation error:",
            error
        );

        const status = /not found/i.test(error.message || "") ? 404 : 400;
        return res.status(status).json({
            success: false,
            message: error.message
        });
    }
};


module.exports = {
    createNewOperation,
    getOperations,
    getOperation,
    validateExistingOperation
};