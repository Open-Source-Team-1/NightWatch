
import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import connectDB from "./config/db";
import { startSuricataMonitoring } from "./services/suricata.service";
import alertRoutes from "./routes/alert.routes";
import { createServer } from "http";
import { initializeSocket } from "./services/socket.service";



dotenv.config();

const app = express();

const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

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
app.use("/api/alerts", alertRoutes);

// Start server
const startServer = async () => {
  try {
    await connectDB();

    startSuricataMonitoring();

    const httpServer = createServer(app);

// Initialize real-time communication
initializeSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Night Watch API running on port ${PORT}`);
  console.log(`Socket.IO ready on port ${PORT}`);
});
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
};

startServer();

export default app;
