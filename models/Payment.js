import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    finance: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Finance",
      required: true,
    },
    amount: {
      type: Number,
      required: [true, "Please add payment amount"],
      min: [0, "Amount cannot be negative"],
    },
    paymentType: {
      type: String,
      required: [true, "Please specify payment type"],
      enum: ["tuition_fee", "maintenance_allowance", "other"],
    },
    paymentMethod: {
      type: String,
      required: [true, "Please specify payment method"],
      enum: ["bank_transfer", "cheque", "demand_draft"],
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "processing", "completed", "failed", "cancelled"],
      default: "pending",
    },
    transactionDetails: {
      referenceNumber: String,
      bankName: String,
      accountNumber: String,
      ifscCode: String,
      transactionDate: Date,
      remarks: String,
    },
    documents: [
      {
        type: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    paymentPeriod: {
      startDate: {
        type: Date,
        required: true,
      },
      endDate: {
        type: Date,
        required: true,
      },
    },
    verification: {
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      verifiedAt: Date,
      remarks: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for payment duration in months
PaymentSchema.virtual("durationInMonths").get(function () {
  const start = new Date(this.paymentPeriod.startDate);
  const end = new Date(this.paymentPeriod.endDate);
  return (
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth())
  );
});

// Method to check if payment is overdue
PaymentSchema.methods.isOverdue = function () {
  return this.status === "pending" && new Date() > this.paymentPeriod.endDate;
};

// Method to update payment status
PaymentSchema.methods.updateStatus = async function (status, remarks = "") {
  this.status = status;
  if (remarks) {
    this.transactionDetails.remarks = remarks;
  }
  await this.save();
};

// Pre-save middleware to validate payment period
PaymentSchema.pre("save", function (next) {
  if (this.paymentPeriod.startDate > this.paymentPeriod.endDate) {
    next(new Error("Start date cannot be after end date"));
  }
  next();
});

// Index for efficient querying
PaymentSchema.index({ student: 1, status: 1 });
PaymentSchema.index({ finance: 1, status: 1 });
PaymentSchema.index({
  "paymentPeriod.startDate": 1,
  "paymentPeriod.endDate": 1,
});

export default mongoose.model("Payment", PaymentSchema);
