const express = require("express");

const {
    createNewOperation,
    getOperations,
    getOperation,
    validateExistingOperation
} = require("../controllers/operationController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
    "/",
    protect,
    createNewOperation
);

router.get(
    "/",
    protect,
    getOperations
);

router.get(
    "/:id",
    protect,
    getOperation
);

router.post(
    "/:id/validate",
    protect,
    validateExistingOperation
);

module.exports = router;