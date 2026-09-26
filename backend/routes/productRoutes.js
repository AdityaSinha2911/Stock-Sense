const express = require("express");

const {
    getProducts,
    getProduct,
    createNewProduct,
    updateExistingProduct,
    removeProduct
} = require("../controllers/productController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getProducts);

router.get("/:id", protect, getProduct);

router.post("/", protect, createNewProduct);

router.put("/:id", protect, updateExistingProduct);

router.delete("/:id", protect, removeProduct);

module.exports = router;