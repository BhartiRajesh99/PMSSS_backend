import express from "express";
import { protect, authorize } from "../middleware/auth.js";
import multer from "multer";
import path from "path";
import {
  registerStudent,
  getStudentProfile,
  updateStudentProfile,
  uploadDocuments,
  getStudentDocuments,
  getStudentScholarshipStatus,
  updateStudentApplication,
} from "../controllers/studentController.js";

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|pdf/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only .png, .jpg, .jpeg and .pdf files are allowed!"));
  },
});

// Student registration route
router.post("/register", registerStudent);

// Protected routes - require authentication
router.use(protect);

// Document upload and retrieval
router.post("/documents", upload.array("documents", 5), uploadDocuments);
router.get("/documents", getStudentDocuments);

// Profile routes
router.get("/profile", getStudentProfile);
router.put("/profile", updateStudentProfile);

// Scholarship status
router.get("/scholarship-status", getStudentScholarshipStatus);

// Application routes
router.put("/application", updateStudentApplication);

export default router;
