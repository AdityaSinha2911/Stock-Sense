const express = require("express");

const {
    getCategories,
    getCategory,
    createNewCategory
} = require("../controllers/categoryController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getCategories);
router.get("/:id", protect, getCategory);
router.post("/", protect, createNewCategory);

module.exports = router;