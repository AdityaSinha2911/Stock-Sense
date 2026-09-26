const express = require("express");

const {
    getLocations,
    getLocation,
    createNewLocation
} = require("../controllers/locationController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getLocations);
router.get("/:id", protect, getLocation);
router.post("/", protect, createNewLocation);

module.exports = router;