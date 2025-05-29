import express from "express";
import {
  getStudentDocuments,
  uploadDocument,
  deleteDocument,
  getAllDocuments,
  updateDocumentStatus,
} from "../controllers/documentController.js";
import { protect, authorize } from "../middleware/auth.js";
import multer from "multer";
import path from "path";

const router = express.Router();

// Configure multer for temporary file storage
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

// Configure multer upload
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

// Student routes
router.get("/student", protect, authorize("student"), getStudentDocuments);
router.post(
  "/upload",
  protect,
  authorize("student"),
  upload.single("file"),
  uploadDocument
);
router.delete("/:id", protect, authorize("student"), deleteDocument);

// Admin/Bureau routes
router.get(
  "/",
  protect,
  authorize("sag_bureau", "finance_bureau"),
  getAllDocuments
);
router.put(
  "/:id/status",
  protect,
  authorize("sag_bureau", "finance_bureau"),
  updateDocumentStatus
);

export default router;
