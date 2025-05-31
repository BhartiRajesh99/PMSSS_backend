import express from "express";
import { protect, authorize } from "../middleware/auth.js";
import Document from "../models/Document.js";
import { body, validationResult } from "express-validator";

const router = express.Router();
// Verify document (SAG Bureau only)
router.post(
  "/:id",
  protect,
  authorize("sag_bureau"),
  [
    body("status").isIn(["verified", "rejected"]).withMessage("Invalid status"),
    body("remarks")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Remarks cannot be empty"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const document = await Document.findById(req.params.id);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      if (document.status !== "pending") {
        return res
          .status(400)
          .json({ message: "Document has already been processed" });
      }

      document.status = req.body.status;
      document.verificationDetails = {
        verifiedBy: req.user._id,
        verifiedAt: Date.now(),
        remarks: req.body.remarks,
      };

      await document.save();

      res.json({
        message: `Document ${req.body.status} successfully`,
        document,
      });
    } catch (error) {
      res.status(500).json({ message: "Error verifying document" });
    }
  }
);

// Get pending documents (SAG Bureau only)
router.get("/pending", protect, authorize("sag_bureau"), async (req, res) => {
  try {
    const documents = await Document.find()
      .populate("student", "name email personalDetails academicDetails")
      .sort({ createdAt: -1 });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: "Error fetching pending documents" });
  }
});

// Get verified documents (Finance Bureau only)
router.get(
  "/verified",
  protect,
  authorize("finance_bureau"),
  async (req, res) => {
    try {
      const documents = await Document.find({ status: "verified" })
        .populate("student", "name email studentDetails")
        .populate("verificationDetails.verifiedBy", "name")
        .sort({ "verificationDetails.verifiedAt": -1 });
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Error fetching verified documents" });
    }
  }
);

export default router;
