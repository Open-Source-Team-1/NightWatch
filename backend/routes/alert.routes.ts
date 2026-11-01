import { Router } from "express";

import {
  getAllAlerts,
  getAlertById,
  getAlertsBySeverity,
  deleteAlert,
  getAlertStatistics,
} from "../controllers/alert.controller";

const router = Router();

// Get all alerts
router.get("/", getAllAlerts);

// Get alert statistics
router.get("/statistics", getAlertStatistics);

// Get alerts by severity
router.get("/severity/:level", getAlertsBySeverity);

// Get one alert
router.get("/:id", getAlertById);

// Delete one alert
router.delete("/:id", deleteAlert);

export default router;