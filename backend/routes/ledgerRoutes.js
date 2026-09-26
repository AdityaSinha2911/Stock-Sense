const express = require("express");
const protect = require("../middleware/authMiddleware");
const { getLedger, getLedgerEntry } = require("../controllers/ledgerController");

const router = express.Router();
router.get("/", protect, getLedger);
router.get("/:id", protect, getLedgerEntry);

module.exports = router;
