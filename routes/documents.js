import express from "express";
import { auth, authorize } from "../middlewares/auth";
import upload from "../middlewares/upload";
import Document from "../models/Document";
import { body, validationResult } from "express-validator";

const router = express.Router();
// Upload document (Student only)
router.post(
  "/upload",
  auth,
  authorize("student"),
  upload.single("document"),
  [
    body("documentType")
      .isIn([
        "admission_letter",
        "fee_structure",
        "bank_details",
        "identity_proof",
        "other",
      ])
      .withMessage("Invalid document type"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const document = new Document({
        student: req.user._id,
        documentType: req.body.documentType,
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      });

      await document.save();

      res.status(201).json({
        message: "Document uploaded successfully",
        document,
      });
    } catch (error) {
      res.status(500).json({ message: "Error uploading document" });
    }
  }
);

// Get student's documents
router.get("/my-documents", auth, authorize("student"), async (req, res) => {
  try {
    const documents = await Document.find({ student: req.user._id }).sort({
      createdAt: -1,
    });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: "Error fetching documents" });
  }
});

// Get all documents (SAG Bureau only)
router.get(
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

// Get document by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id).populate(
      "student",
      "name email studentDetails"
    );

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Check if user has permission to view document
    if (
      req.user.role === "student" &&
      document.student._id.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this document" });
    }

    res.json(document);
  } catch (error) {
    res.status(500).json({ message: "Error fetching document" });
  }
});

// Delete document (Student only)
router.delete("/:id", auth, authorize("student"), async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      student: req.user._id,
      status: "pending",
    });

    if (!document) {
      return res
        .status(404)
        .json({ message: "Document not found or cannot be deleted" });
    }

    await document.remove();
    res.status(200).json({ message: "Document deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting document" });
  }
});

export default router;
