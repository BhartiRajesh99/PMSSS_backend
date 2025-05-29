import mongoose from "mongoose";
import baseAuthSchema from "./BaseAuth.js";
import bcrypt from "bcryptjs";

const sagSchema = new mongoose.Schema(
  {
    ...baseAuthSchema.obj,
    organizationDetails: {
      name: {
        type: String,
        required: [true, "Please add organization name"],
      },
      type: {
        type: String,
        required: [true, "Please add organization type"],
        enum: ["government", "private", "autonomous"],
      },
      registrationNumber: {
        type: String,
        required: [true, "Please add registration number"],
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
    },
    verificationDocuments: [String],
    statistics: {
      totalApplications: {
        type: Number,
        default: 0,
      },
      pendingApplications: {
        type: Number,
        default: 0,
      },
      approvedApplications: {
        type: Number,
        default: 0,
      },
      rejectedApplications: {
        type: Number,
        default: 0,
      },
      lastUpdated: {
        type: Date,
        default: Date.now,
      },
    },
    settings: {
      maxApplicationsPerDay: {
        type: Number,
        default: 100,
      },
      autoApproveThreshold: {
        type: Number,
        default: 85, // Percentage
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
sagSchema.virtual("fullAddress").get(function () {
  return `${this.organizationDetails.address.street}, ${this.organizationDetails.address.city}, ${this.organizationDetails.address.state} - ${this.organizationDetails.address.pincode}`;
});

// Method to update statistics
sagSchema.methods.updateStatistics = async function () {
  const Student = mongoose.model("Student");

  const stats = await Student.aggregate([
    {
      $match: {
        "personalDetails.address.state": this.state,
      },
    },
    {
      $group: {
        _id: "$application.status",
        count: { $sum: 1 },
      },
    },
  ]);

  this.statistics = {
    totalApplications: stats.reduce((sum, stat) => sum + stat.count, 0),
    pendingApplications: stats.find((s) => s._id === "pending")?.count || 0,
    approvedApplications: stats.find((s) => s._id === "approved")?.count || 0,
    rejectedApplications: stats.find((s) => s._id === "rejected")?.count || 0,
    lastUpdated: Date.now(),
  };

  await this.save();
};

// Pre-save middleware to ensure state matches address state
sagSchema.pre("save", function (next) {
  if (this.organizationDetails.address.state !== this.state) {
    this.organizationDetails.address.state = this.state;
  }
  next();
});

// Add base auth methods
Object.assign(sagSchema.methods, baseAuthSchema.methods);

// Add password hashing middleware
sagSchema.pre("save", async function (next) {
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

const SAG = mongoose.model("SAG", sagSchema);

export default SAG;
