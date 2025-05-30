// Load environment variables first
import dotenv from "dotenv";
dotenv.config({
  path: "./.env",
});

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import fs from "fs/promises";
import connectDB from "../config/db.js";
import authRoutes from "../routes/auth.js";
import studentRoutes from "../routes/student.js";
import sagRoutes from "../routes/sag.js";
import financeRoutes from "../routes/finance.js";
import documentRoutes from "../routes/documentRoutes.js";
import verifyRoutes from "../routes/verify.js";
import paymentRoutes from "../routes/payments.js";

// Create Express app
const app = express();

// Get current file path and directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to PMSSS API",
    status: "Server is running",
    environment: process.env.NODE_ENV || "development",
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/sag", sagRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/verify", verifyRoutes);
app.use("/api/payments", paymentRoutes);

// Configure uploads directory based on environment
const uploadsDir =
  process.env.NODE_ENV === "production"
    ? "/tmp/uploads" // Use /tmp in production (serverless)
    : path.join(__dirname, "uploads"); // Use local directory in development

// Serve static files
app.use("/uploads", express.static(uploadsDir));

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || "Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// Create uploads directory if it doesn't exist
fs.access(uploadsDir)
  .catch(() => fs.mkdir(uploadsDir, { recursive: true }))
  .then(() => {
    // Connect to MongoDB and start server
    connectDB()
      .then(() => {
        console.log("Connected to MongoDB");
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
          console.log(
            `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
          );
        });
      })
      .catch((error) => {
        console.error("MongoDB connection error:", error);
        process.exit(1);
      });
  })
  .catch((error) => {
    console.error("Error setting up uploads directory:", error);
    process.exit(1);
  });

// Export the Express app for Vercel
export default app;
