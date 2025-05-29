import mongoose from "mongoose";
import baseAuthSchema from "./BaseAuth.js";
import bcrypt from "bcryptjs";

const financeSchema = new mongoose.Schema(
  {
    ...baseAuthSchema.obj,
    departmentName: {
      type: String,
      required: [true, "Please add department name"],
    },
    departmentCode: {
      type: String,
      required: [true, "Please add department code"],
      unique: true,
    },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
    },
    contactPerson: {
      name: String,
      designation: String,
      phone: String,
      email: String,
    },
    statistics: {
      totalPayments: {
        type: Number,
        default: 0,
      },
      pendingPayments: {
        type: Number,
        default: 0,
      },
      completedPayments: {
        type: Number,
        default: 0,
      },
      failedPayments: {
        type: Number,
        default: 0,
      },
      lastUpdated: {
        type: Date,
        default: Date.now,
      },
    },
    settings: {
      maxPaymentsPerDay: {
        type: Number,
        default: 1000,
      },
      autoPaymentThreshold: {
        type: Number,
        default: 10000, // Amount in rupees
      },
      notificationPreferences: {
        email: {
          type: Boolean,
          default: true,
        },
        sms: {
          type: Boolean,
          default: true,
        },
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for getting full address
financeSchema.virtual("fullAddress").get(function () {
  return `${this.address.street}, ${this.address.city}, ${this.address.state} - ${this.address.pincode}`;
});

// Method to update statistics
financeSchema.methods.updateStatistics = async function () {
  const Payment = mongoose.model("Payment");

  const stats = await Payment.aggregate([
    {
      $match: {
        department: this._id,
      },
    },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        total: { $sum: "$amount" },
      },
    },
  ]);

  this.statistics = {
    totalPayments: stats.reduce((sum, stat) => sum + stat.count, 0),
    pendingPayments: stats.find((s) => s._id === "pending")?.count || 0,
    completedPayments: stats.find((s) => s._id === "completed")?.count || 0,
    failedPayments: stats.find((s) => s._id === "failed")?.count || 0,
    lastUpdated: Date.now(),
  };

  await this.save();
};

// Add base auth methods
Object.assign(financeSchema.methods, baseAuthSchema.methods);

// Add password hashing middleware
financeSchema.pre("save", async function (next) {
  try {
    if (!this.isModified("password")) {
      return next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    console.error("Password hashing error:", error);
    next(error);
  }
});

const Finance = mongoose.model("Finance", financeSchema);

export default Finance;
