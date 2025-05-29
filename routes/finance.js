import express from "express";
import { protect, authorize, upload } from "../middleware/index.js";
import {
  getFinanceProfile,
  updateFinanceProfile,
  getApprovedApplications,
  processScholarshipPayment,
  getPaymentHistory,
  generatePaymentReport,
  uploadPaymentDocuments,
  getPaymentDocuments,
} from "../controllers/financeController.js";

const router = express.Router();

// All routes are protected and require finance role
router.use(protect);
router.use(authorize("finance"));

// Profile management
router.get("/profile", getFinanceProfile);
router.put("/profile", updateFinanceProfile);

// Scholarship payment management
router.get("/applications", getApprovedApplications);
router.post("/payments/:studentId", processScholarshipPayment);
router.get("/payments", getPaymentHistory);
router.get("/payments/report", generatePaymentReport);

// Document management
router.post("/documents", upload.array("documents", 5), uploadPaymentDocuments);
router.get("/documents", getPaymentDocuments);

export default router;
