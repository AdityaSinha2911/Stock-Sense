const {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
} = require("../models/productModel");
const db = require("../config/database");

const isValidId = (id) => Number.isInteger(Number(id)) && Number(id) > 0;

const validateProductInput = ({ categoryId, reorderLevel }) => {
    if (categoryId !== undefined && categoryId !== null && categoryId !== "") {
        if (!isValidId(categoryId) || !db.prepare("SELECT id FROM categories WHERE id = ?").get(categoryId)) {
            return "Category not found";
        }
    }
    if (reorderLevel !== undefined && (!Number.isInteger(reorderLevel) || reorderLevel < 0)) {
        return "Reorder level must be a non-negative integer";
    }
    return null;
};


// ================================
// GET ALL PRODUCTS
// ================================
const getProducts = (req, res) => {
    try {
        const products = getAllProducts();

        res.status(200).json({
            success: true,
            count: products.length,
            products
        });

    } catch (error) {
        console.error("Get products error:", error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


// ================================
// GET SINGLE PRODUCT
// ================================
const getProduct = (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            return res.status(400).json({ success: false, message: "Invalid product ID" });
        }

        const product = getProductById(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        res.status(200).json({
            success: true,
            product
        });

    } catch (error) {
        console.error("Get product error:", error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


// ================================
// CREATE PRODUCT
// ================================
const createNewProduct = (req, res) => {
    try {
        const {
            name,
            sku,
            categoryId,
            unit,
            reorderLevel
        } = req.body;

        if (!name || !sku || !unit) {
            return res.status(400).json({
                success: false,
                message: "Name, SKU and unit are required"
            });
        }

        const validationError = validateProductInput({ categoryId, reorderLevel });
        if (validationError) {
            return res.status(validationError === "Category not found" ? 404 : 400)
                .json({ success: false, message: validationError });
        }

        const existingProduct = getAllProducts()
            .find(
                product =>
                    product.sku.toLowerCase() === sku.toLowerCase()
            );

        if (existingProduct) {
            return res.status(409).json({
                success: false,
                message: "SKU already exists"
            });
        }

        const product = createProduct(
            name,
            sku,
            categoryId,
            unit,
            reorderLevel
        );

        res.status(201).json({
            success: true,
            message: "Product created successfully",
            product
        });

    } catch (error) {
        console.error("Create product error:", error);

        if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
            return res.status(409).json({ success: false, message: "SKU already exists" });
        }

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


// ================================
// UPDATE PRODUCT
// ================================
const updateExistingProduct = (req, res) => {
    try {
        const { id } = req.params;

        const {
            name,
            sku,
            categoryId,
            unit,
            reorderLevel
        } = req.body;

        if (!name || !sku || !unit) {
            return res.status(400).json({
                success: false,
                message: "Name, SKU and unit are required"
            });
        }

        if (!isValidId(id)) {
            return res.status(400).json({ success: false, message: "Invalid product ID" });
        }

        const validationError = validateProductInput({ categoryId, reorderLevel });
        if (validationError) {
            return res.status(validationError === "Category not found" ? 404 : 400)
                .json({ success: false, message: validationError });
        }

        const duplicateSku = getAllProducts().find(
            (existingProduct) => existingProduct.id !== Number(id)
                && existingProduct.sku.toLowerCase() === sku.toLowerCase()
        );
        if (duplicateSku) {
            return res.status(409).json({ success: false, message: "SKU already exists" });
        }

        const product = updateProduct(
            id,
            name,
            sku,
            categoryId,
            unit,
            reorderLevel
        );

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Product updated successfully",
            product
        });

    } catch (error) {
        console.error("Update product error:", error);

        if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
            return res.status(409).json({ success: false, message: "SKU already exists" });
        }

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


// ================================
// DELETE PRODUCT
// ================================
const removeProduct = (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            return res.status(400).json({ success: false, message: "Invalid product ID" });
        }

        const result = deleteProduct(id);

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Product deleted successfully"
        });

    } catch (error) {
        console.error("Delete product error:", error);

        if (error.code === "SQLITE_CONSTRAINT_FOREIGNKEY" || error.code === "PRODUCT_REFERENCED") {
            return res.status(409).json({ success: false, message: "Product cannot be deleted because it has stock or operation history" });
        }

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


module.exports = {
    getProducts,
    getProduct,
    createNewProduct,
    updateExistingProduct,
    removeProduct
};