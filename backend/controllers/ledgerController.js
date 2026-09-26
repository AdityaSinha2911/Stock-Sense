const {
    getAllLedgerEntries,
    getLedgerEntryById
} = require("../models/stockLedgerModel");

const isValidId = (id) => Number.isInteger(Number(id)) && Number(id) > 0;

const getLedger = (req, res) => {
    try {
        const entries = getAllLedgerEntries({
            productId: req.query.productId,
            locationId: req.query.locationId,
            movementType: req.query.movementType,
            operationId: req.query.operationId,
            dateFrom: req.query.dateFrom,
            dateTo: req.query.dateTo
        });
        return res.status(200).json({ success: true, count: entries.length, entries });
    } catch (error) {
        console.error("Get ledger error:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

const getLedgerEntry = (req, res) => {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid ledger entry ID" });
        }
        const entry = getLedgerEntryById(req.params.id);
        if (!entry) return res.status(404).json({ success: false, message: "Ledger entry not found" });
        return res.status(200).json({ success: true, entry });
    } catch (error) {
        console.error("Get ledger entry error:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

module.exports = { getLedger, getLedgerEntry };