const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

// Database
require("./config/database");
require("./config/createTables");

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/authRoutes"));

app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/categories", require("./routes/categoryRoutes"));
app.use("/api/locations", require("./routes/locationRoutes"));
app.use("/api/operations", require("./routes/operationRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));
app.use("/api/ledger", require("./routes/ledgerRoutes"));

// Test route
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "StockSense API is running"
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 StockSense server running on port ${PORT}`);
});