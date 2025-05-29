import express from "express";
import { protect, authorize } from "../middleware/auth.js";
import { upload } from "../config/multer.js";
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

// Student registration route
router.post("/register", registerStudent);

// Protected routes
router.get("/profile", protect, authorize("student"), getStudentProfile);
router.put("/profile", protect, authorize("student"), updateStudentProfile);
router.post(
  "/documents",
  protect,
  authorize("student"),
  upload.array("documents", 5),
  uploadDocuments
);
router.get("/documents", protect, authorize("student"), getStudentDocuments);
router.get(
  "/scholarship-status",
  protect,
  authorize("student"),
  getStudentScholarshipStatus
);
router.put(
  "/application",
  protect,
  authorize("student"),
  updateStudentApplication
);

export default router;
