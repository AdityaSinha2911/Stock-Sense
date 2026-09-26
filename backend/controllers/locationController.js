const {
    getAllLocations,
    getLocationById,
    createLocation
} = require("../models/locationModel");

const isValidId = (id) => Number.isInteger(Number(id)) && Number(id) > 0;

const getLocations = (req, res) => {
    try {
        const locations = getAllLocations();

        res.status(200).json({
            success: true,
            count: locations.length,
            locations
        });
    } catch (error) {
        console.error("Get locations error:", error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

const getLocation = (req, res) => {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid location ID" });
        }
        const location = getLocationById(req.params.id);

        if (!location) {
            return res.status(404).json({
                success: false,
                message: "Location not found"
            });
        }

        res.status(200).json({
            success: true,
            location
        });
    } catch (error) {
        console.error("Get location error:", error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

const createNewLocation = (req, res) => {
    try {
        const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
        const { description } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Location name is required"
            });
        }

        const existing = getAllLocations().find(
            location =>
                location.name.toLowerCase() === name.toLowerCase()
        );

        if (existing) {
            return res.status(409).json({
                success: false,
                message: "Location already exists"
            });
        }

        const location = createLocation(
            name,
            description
        );

        res.status(201).json({
            success: true,
            message: "Location created successfully",
            location
        });
    } catch (error) {
        console.error("Create location error:", error);

        if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
            return res.status(409).json({ success: false, message: "Location already exists" });
        }

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

module.exports = {
    getLocations,
    getLocation,
    createNewLocation
};