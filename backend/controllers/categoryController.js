const {
    getAllCategories,
    getCategoryById,
    createCategory
} = require("../models/categoryModel");

const isValidId = (id) => Number.isInteger(Number(id)) && Number(id) > 0;

const getCategories = (req, res) => {
    try {
        const categories = getAllCategories();

        res.status(200).json({
            success: true,
            count: categories.length,
            categories
        });
    } catch (error) {
        console.error("Get categories error:", error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

const getCategory = (req, res) => {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid category ID" });
        }
        const category = getCategoryById(req.params.id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        res.status(200).json({
            success: true,
            category
        });
    } catch (error) {
        console.error("Get category error:", error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

const createNewCategory = (req, res) => {
    try {
        const name = typeof req.body.name === "string" ? req.body.name.trim() : "";

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Category name is required"
            });
        }

        const existing = getAllCategories().find(
            category =>
                category.name.toLowerCase() === name.toLowerCase()
        );

        if (existing) {
            return res.status(409).json({
                success: false,
                message: "Category already exists"
            });
        }

        const category = createCategory(name);

        res.status(201).json({
            success: true,
            message: "Category created successfully",
            category
        });
    } catch (error) {
        console.error("Create category error:", error);

        if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
            return res.status(409).json({ success: false, message: "Category already exists" });
        }

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

module.exports = {
    getCategories,
    getCategory,
    createNewCategory
};