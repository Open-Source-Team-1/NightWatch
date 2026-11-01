import { Request, Response } from "express";
import mongoose from "mongoose";
import Alert from "../models/Alert";

// GET: Retrieve all alerts with pagination and filters
export const getAllAlerts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number(req.query.limit) || 20)
    );

    const filter: Record<string, any> = {};

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
      Alert.find(filter)
        .sort({ timestamp: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      Alert.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: alerts.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: alerts,
    });
  } catch (error) {
    console.error("Get alerts error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve alerts",
    });
  }
};

// GET: Retrieve one alert by ID
export const getAlertById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      res.status(400).json({
        success: false,
        message: "Invalid alert ID",
      });
      return;
    }

    const alert = await Alert.findById(req.params.id);

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
  } catch (error) {
    console.error("Get alert error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve alert",
    });
  }
};

// GET: Filter alerts by severity
export const getAlertsBySeverity = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const severity = Number(req.params.level);

    if (!Number.isInteger(severity) || severity < 1 || severity > 4) {
      res.status(400).json({
        success: false,
        message: "Severity must be between 1 and 4",
      });
      return;
    }

    const alerts = await Alert.find({ severity })
      .sort({ timestamp: -1 })
      .limit(100)
      .lean();

    res.status(200).json({
      success: true,
      count: alerts.length,
      data: alerts,
    });
  } catch (error) {
    console.error("Severity filter error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to filter alerts",
    });
  }
};

// DELETE: Delete an alert by ID
export const deleteAlert = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      res.status(400).json({
        success: false,
        message: "Invalid alert ID",
      });
      return;
    }

    const alert = await Alert.findByIdAndDelete(req.params.id);

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
  } catch (error) {
    console.error("Delete alert error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete alert",
    });
  }
};


export const getAlertStatistics = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const statistics = await Alert.aggregate([
      {
        $group: {
          _id: "$severity",
          count: { $sum: 1 },
        },
      },
    ]);

    const severityCounts: Record<number, number> = {
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

    const totalAlerts = await Alert.countDocuments();

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
  } catch (error) {
    console.error("Alert statistics error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve alert statistics",
    });
  }
};
