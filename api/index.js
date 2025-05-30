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

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy" });
});


// Get all documents (SAG Bureau only)
app.get(
  "/all",
  auth,
  authorize("sag_bureau", "finance_bureau"),
  async (req, res) => {
    try {
      const documents = await Document.find()
        .populate("student", "name email studentDetails")
        .sort({ createdAt: -1 });
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Error fetching documents" });
    }
  }
);



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

// Initialize server
const initializeServer = async () => {
  try {
    // Create uploads directory if it doesn't exist
    await fs.mkdir(uploadsDir, { recursive: true });

    // Connect to MongoDB
    await connectDB();
    console.log("Connected to MongoDB");

    // Start server only if not in production (Vercel)
    if (process.env.NODE_ENV !== "production") {
      const PORT = process.env.PORT || 5000;
      app.listen(PORT, () => {
        console.log(
          `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
        );
      });
    }
  } catch (error) {
    console.error("Server initialization error:", error);
    process.exit(1);
  }
};

// Initialize server
initializeServer();

// Export the Express app for Vercel
export default app;
