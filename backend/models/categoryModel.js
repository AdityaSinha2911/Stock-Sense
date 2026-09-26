const db = require("../config/database");

// Get all categories
const getAllCategories = () => {
    return db.prepare(`
        SELECT *
        FROM categories
        ORDER BY id DESC
    `).all();
};

// Get category by ID
const getCategoryById = (id) => {
    return db.prepare(`
        SELECT *
        FROM categories
        WHERE id = ?
    `).get(id);
};

// Create category
const createCategory = (name) => {
    const result = db.prepare(`
        INSERT INTO categories (name)
        VALUES (?)
    `).run(name);

    return getCategoryById(result.lastInsertRowid);
};

module.exports = {
    getAllCategories,
    getCategoryById,
    createCategory
};