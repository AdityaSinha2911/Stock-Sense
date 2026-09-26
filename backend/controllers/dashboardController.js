const { getDashboard } = require("../models/dashboardModel");

const getDashboardSummary = (req, res) => {
    try {
        return res.status(200).json({ success: true, dashboard: getDashboard() });
    } catch (error) {
        console.error("Get dashboard error:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

module.exports = { getDashboardSummary };