import express from "express";
import cors from "cors";
import alertRoutes from "./routes/alert.routes";

const app = express();

app.use(cors({
  origin: "http://localhost:3000"
}));

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

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
app.use("/api/alerts", alertRoutes);

export default app;