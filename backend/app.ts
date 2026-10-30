
const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors({
  origin: "http://localhost:3000"
}));

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// Test API
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to Night Watch Backend API"
  });
});

// Health check API
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Night Watch backend is running"
  });
});

export default app;
