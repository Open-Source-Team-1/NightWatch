"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const alert_controller_1 = require("../controllers/alert.controller");
const router = (0, express_1.Router)();
// Get all alerts
router.get("/", alert_controller_1.getAllAlerts);
// Get alert statistics
router.get("/statistics", alert_controller_1.getAlertStatistics);
// Get alerts by severity
router.get("/severity/:level", alert_controller_1.getAlertsBySeverity);
// Get one alert
router.get("/:id", alert_controller_1.getAlertById);
// Delete one alert
router.delete("/:id", alert_controller_1.deleteAlert);
exports.default = router;
//# sourceMappingURL=alert.routes.js.map