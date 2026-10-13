const express = require("express");
require('./config/db');
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const path = require('path');

const app = express();

// Built-in middleware
app.use(helmet());
// app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());
app.use(morgan("combined"));
app.use(express.urlencoded({ extended: true }));

/* ─── Rate Limiting ─── */
app.use("/api", rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  handler: (req, res) => {
    const retryAfterMinutes = Math.ceil(
      (req.rateLimit.resetTime - Date.now()) / (60 * 1000)
    );
    return res.status(429).json({
      status: 0,
      message: `Too many requests. Please try again after ${retryAfterMinutes} minute(s).`,
    });
  }
}));

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Routes
app.get("/api/test", (req, res) => {
  res.send("API is running");
});
app.use('/api/v1/public', require('./routes/v1/LocationRoutes'));
app.use('/api/v1/user', require('./routes/v1/userRoutes'));
app.use('/api/v1/auth', require('./routes/v1/LoginRoutes'));
app.use('/api/v1/land', require('./routes/v1/landRoutes'));
app.use('/api/v1/simulation', require('./routes/v1/simulationRoutes'));
app.use('/api/v1/dashboard', require('./routes/v1/dashboardRoutes'));

/* ─── Error Handler ─── */
app.use((err, req, res, next) => {
  console.error(err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    status: 0,
    message: err.message || "Internal Server Error"
  });
});

module.exports = app;
