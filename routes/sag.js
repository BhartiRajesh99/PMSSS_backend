import express from "express";
import { protect, authorize, upload } from "../middleware/index.js";
import {
  getSAGProfile,
  updateSAGProfile,
  getStudentApplications,
  reviewStudentApplication,
  getScholarshipStatistics,
  uploadVerificationDocuments,
  getVerificationDocuments,
} from "../controllers/sagController.js";

const router = express.Router();

// All routes are protected and require SAG role
router.use(protect);
router.use(authorize("sag"));

// Profile management
router.get("/profile", getSAGProfile);
router.put("/profile", updateSAGProfile);

// Student application management
router.get("/applications", getStudentApplications);
router.put("/applications/:id/review", reviewStudentApplication);

// Document verification
router.post(
  "/verification",
  upload.array("documents", 5),
  uploadVerificationDocuments
);
router.get("/verification", getVerificationDocuments);

// Statistics and reporting
router.get("/statistics", getScholarshipStatistics);

export default router;
