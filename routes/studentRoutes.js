import express from "express";
const router = express.Router();
import Student from "../models/Student";
import multer from "multer";
import path from "path";

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// Register a new student
router.post("/register", async (req, res) => {
  try {
    const student = new Student(req.body);
    await student.save();
    res.status(201).json({ message: "Registration successful", student });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Registration failed", error: error.message });
  }
});

// Upload document
router.post("/upload", upload.single("document"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const documentUrl = `/uploads/${req.file.filename}`;
    res.status(200).json({ url: documentUrl });
  } catch (error) {
    res.status(400).json({ message: "Upload failed", error: error.message });
  }
});

export default router;
