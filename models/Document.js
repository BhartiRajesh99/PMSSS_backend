import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    type: {
      type: String,
      required: [true, "Please specify document type"],
      enum: ["fee_receipt", "attendance_certificate", "marksheet", "other"],
    },
    fileUrl: {
      type: String,
      required: [true, "Please provide file URL"],
    },
    fileName: {
      type: String,
      required: [true, "Please provide file name"],
    },
    cloudinaryId: {
      type: String,
      required: [true, "Please provide Cloudinary ID"],
    },
    status: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
    remarks: {
      type: String,
      default: "",
    },
    verificationDetails: {
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SAG",
      },
      verifiedAt: Date,
      remarks: String,
    },
    paymentDetails: {
      processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Finance",
      },
      processedAt: Date,
      remarks: String
    },
    paymentStatus: String,
  },
  {
    timestamps: true,
  }
);

const Document = mongoose.model("Document", documentSchema);

export default Document;
