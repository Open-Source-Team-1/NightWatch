"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const db_1 = __importDefault(require("./config/db"));
const suricata_service_1 = require("./services/suricata.service");
const alert_routes_1 = __importDefault(require("./routes/alert.routes"));
const http_1 = require("http");
const socket_service_1 = require("./services/socket.service");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Welcome route
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Welcome to Night Watch Backend API",
    });
});
// Health check
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Night Watch backend is running",
    });
});
// Alert routes
app.use("/api/alerts", alert_routes_1.default);
// Start server
const startServer = async () => {
    try {
        await (0, db_1.default)();
        (0, suricata_service_1.startSuricataMonitoring)();
        const httpServer = (0, http_1.createServer)(app);
        // Initialize real-time communication
        (0, socket_service_1.initializeSocket)(httpServer);
        httpServer.listen(PORT, () => {
            console.log(`Night Watch API running on port ${PORT}`);
            console.log(`Socket.IO ready on port ${PORT}`);
        });
    }
    catch (error) {
        console.error("Server startup failed:", error);
        process.exit(1);
    }
};
startServer();
exports.default = app;
//# sourceMappingURL=server.js.map