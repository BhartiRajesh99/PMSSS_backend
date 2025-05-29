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

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/sag", sagRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/verify", verifyRoutes);
app.use("/api/payments", paymentRoutes);

// Serve static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

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
const uploadsDir = path.join(__dirname, "uploads");
fs.access(uploadsDir)
  .catch(() => fs.mkdir(uploadsDir))
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
          console.log(`JWT Secret configured: ${!!process.env.JWT_SECRET}`);
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
