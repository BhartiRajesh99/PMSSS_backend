import express from "express";
import {
  getStudentDocuments,
  uploadDocument,
  deleteDocument,
  getAllDocuments,
  updateDocumentStatus,
} from "../controllers/documentController.js";
import { protect, authorize } from "../middleware/auth.js";
import { upload } from "../config/multer.js";

const router = express.Router();

// Student routes
router.get("/student", protect, authorize("student"), getStudentDocuments);
router.post(
  "/upload",
  protect,
  authorize("student"),
  upload.single("document"),
  uploadDocument
);
router.delete("/:id", protect, authorize("student"), deleteDocument);

// Admin/Bureau routes
router.get("/", protect, authorize("admin", "bureau"), getAllDocuments);
router.put(
  "/:id/status",
  protect,
  authorize("admin", "bureau"),
  updateDocumentStatus
);

export default router;
