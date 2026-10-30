"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const alert_routes_1 = __importDefault(require("./routes/alert.routes"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: "http://localhost:3000"
}));
app.use(express_1.default.json({ limit: "1mb" }));
app.use(express_1.default.urlencoded({ extended: true }));
// Welcome API
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Welcome to Night Watch Backend API"
    });
});
// Health check
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Night Watch backend is running"
    });
});
// Alert API routes
app.use("/api/alerts", alert_routes_1.default);
exports.default = app;
//# sourceMappingURL=app.js.map