const express = require("express");
const protect = require("../middleware/authMiddleware");
const { getDashboardSummary } = require("../controllers/dashboardController");

const router = express.Router();
router.get("/", protect, getDashboardSummary);

module.exports = router;
