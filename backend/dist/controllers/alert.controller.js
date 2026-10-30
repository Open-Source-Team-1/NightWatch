"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAlertStatistics = exports.deleteAlert = exports.getAlertsBySeverity = exports.getAlertById = exports.getAllAlerts = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Alert_1 = __importDefault(require("../models/Alert"));
// GET: Retrieve all alerts with pagination and filters
const getAllAlerts = async (req, res) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
        const filter = {};
        if (req.query.severity !== undefined) {
            const severity = Number(req.query.severity);
            if (!Number.isInteger(severity) || severity < 1 || severity > 4) {
                res.status(400).json({
                    success: false,
                    message: "Severity must be between 1 and 4",
                });
                return;
            }
            filter.severity = severity;
        }
        if (req.query.sourceIp) {
            filter.sourceIp = String(req.query.sourceIp);
        }
        if (req.query.destinationIp) {
            filter.destinationIp = String(req.query.destinationIp);
        }
        if (req.query.category) {
            filter.category = String(req.query.category);
        }
        const [alerts, total] = await Promise.all([
            Alert_1.default.find(filter)
                .sort({ timestamp: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            Alert_1.default.countDocuments(filter),
        ]);
        res.status(200).json({
            success: true,
            count: alerts.length,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            data: alerts,
        });
    }
    catch (error) {
        console.error("Get alerts error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve alerts",
        });
    }
};
exports.getAllAlerts = getAllAlerts;
// GET: Retrieve one alert by ID
const getAlertById = async (req, res) => {
    try {
        if (!mongoose_1.default.isValidObjectId(req.params.id)) {
            res.status(400).json({
                success: false,
                message: "Invalid alert ID",
            });
            return;
        }
        const alert = await Alert_1.default.findById(req.params.id);
        if (!alert) {
            res.status(404).json({
                success: false,
                message: "Alert not found",
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: alert,
        });
    }
    catch (error) {
        console.error("Get alert error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve alert",
        });
    }
};
exports.getAlertById = getAlertById;
// GET: Filter alerts by severity
const getAlertsBySeverity = async (req, res) => {
    try {
        const severity = Number(req.params.level);
        if (!Number.isInteger(severity) || severity < 1 || severity > 4) {
            res.status(400).json({
                success: false,
                message: "Severity must be between 1 and 4",
            });
            return;
        }
        const alerts = await Alert_1.default.find({ severity })
            .sort({ timestamp: -1 })
            .limit(100)
            .lean();
        res.status(200).json({
            success: true,
            count: alerts.length,
            data: alerts,
        });
    }
    catch (error) {
        console.error("Severity filter error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to filter alerts",
        });
    }
};
exports.getAlertsBySeverity = getAlertsBySeverity;
// DELETE: Delete an alert by ID
const deleteAlert = async (req, res) => {
    try {
        if (!mongoose_1.default.isValidObjectId(req.params.id)) {
            res.status(400).json({
                success: false,
                message: "Invalid alert ID",
            });
            return;
        }
        const alert = await Alert_1.default.findByIdAndDelete(req.params.id);
        if (!alert) {
            res.status(404).json({
                success: false,
                message: "Alert not found",
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: "Alert deleted successfully",
        });
    }
    catch (error) {
        console.error("Delete alert error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete alert",
        });
    }
};
exports.deleteAlert = deleteAlert;
const getAlertStatistics = async (req, res) => {
    try {
        const statistics = await Alert_1.default.aggregate([
            {
                $group: {
                    _id: "$severity",
                    count: { $sum: 1 },
                },
            },
        ]);
        const severityCounts = {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
        };
        statistics.forEach((item) => {
            if (item._id >= 1 && item._id <= 4) {
                severityCounts[item._id] = item.count;
            }
        });
        const totalAlerts = await Alert_1.default.countDocuments();
        res.status(200).json({
            success: true,
            data: {
                totalAlerts,
                critical: severityCounts[1],
                high: severityCounts[2],
                medium: severityCounts[3],
                low: severityCounts[4],
            },
        });
    }
    catch (error) {
        console.error("Alert statistics error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve alert statistics",
        });
    }
};
exports.getAlertStatistics = getAlertStatistics;
//# sourceMappingURL=alert.controller.js.map