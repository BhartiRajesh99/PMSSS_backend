import express from "express";
const router = express.Router();
import { protect, authorize } from "../middleware/auth.js";
import Document from "../models/Document.js";
import { body, validationResult } from "express-validator";

// Process payment (Finance Bureau only)
router.post(
  "/:id",
  protect,
  authorize("finance_bureau"),
  [
    body("status").isIn(["processing", "paid"]).withMessage("Invalid status"),
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

      if (document.status !== "verified") {
        return res.status(400).json({
          message: "Document must be verified before processing payment",
        });
      }

      document.paymentStatus = req.body.status;
      document.paymentDetails = {
        processedBy: req.user._id,
        processedAt: Date.now(),
        remarks: req.body.remarks,
      };

      await document.save();

      res.json({
        message: `Payment ${req.body.status} successfully`,
        document,
      });
    } catch (error) {
      res.status(500).json({ message: "Error processing payment" });
    }
  }
);

// Get payment status (Student only)
router.get("/status", protect, authorize("student"), async (req, res) => {
  try {
    const documents = await Document.find({ student: req.user._id })
      .select("documentType status paymentStatus paymentDetails")
      .sort({ createdAt: -1 });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: "Error fetching payment status" });
  }
});

// Get all payments (Finance Bureau only)
router.get("/all", protect, authorize("finance_bureau"), async (req, res) => {
  try {
    const documents = await Document.find({ status: "verified" })
      .populate("student", "name email studentDetails")
      .populate("verificationDetails.verifiedBy", "name")
      .populate("paymentDetails.processedBy", "name")
      .sort({ "paymentDetails.processedAt": -1 });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: "Error fetching payments" });
  }
});

export default router;
