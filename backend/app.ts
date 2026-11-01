
import express from "express";
import cors from "cors";
import alertRoutes from "./routes/alert.routes";

const app = express();

app.use(
  cors({
    origin:
      process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to Night Watch Backend API",
  });
});

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Night Watch backend is running",
  });
});

app.use("/api/alerts", alertRoutes);

export default app;
