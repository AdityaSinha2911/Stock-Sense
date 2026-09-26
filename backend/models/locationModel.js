const db = require("../config/database");

// Get all locations
const getAllLocations = () => {
    return db.prepare(`
        SELECT *
        FROM locations
        ORDER BY id DESC
    `).all();
};

// Get location by ID
const getLocationById = (id) => {
    return db.prepare(`
        SELECT *
        FROM locations
        WHERE id = ?
    `).get(id);
};

// Create location
const createLocation = (name, description) => {
    const result = db.prepare(`
        INSERT INTO locations (name, description)
        VALUES (?, ?)
    `).run(
        name,
        description || null
    );

    return getLocationById(result.lastInsertRowid);
};

module.exports = {
    getAllLocations,
    getLocationById,
    createLocation
};