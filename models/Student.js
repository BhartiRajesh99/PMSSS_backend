import mongoose from "mongoose";
import baseAuthSchema from "./BaseAuth.js";
import bcrypt from "bcryptjs";

const studentSchema = new mongoose.Schema(
  {
    ...baseAuthSchema.obj,
    registrationNumber: {
      type: String,
      required: [true, "Please add registration number"],
      unique: true,
    },
    course: {
      type: String,
      required: [true, "Please add course"],
    },
    institution: {
      type: String,
      required: [true, "Please add institution"],
    },
    yearOfStudy: {
      type: Number,
      required: [true, "Please add year of study"],
    },
    personalDetails: {
      firstName: String,
      lastName: String,
      dob: Date,
      gender: {
        type: String,
        enum: ["male", "female", "other"],
      },
      aadharNumber: String,
      phone: String,
      address: {
        street: String,
        city: String,
        state: String,
        pincode: String,
      },
      category: String,
      domicile: String,
    },
    academicDetails: {
      currentCourse: String,
      currentYear: Number,
      previousCourse: String,
      previousMarks: Number,
      boardOrUniversity: String,
      admissionYear: Number,
      college: {
        name: String,
        code: String,
        address: String,
      },
      rollNumber: String,
      branch: String,
      semester: Number,
    },
    bankDetails: {
      accountHolderName: String,
      accountNumber: String,
      ifscCode: String,
      bankName: String,
      branch: String,
    },
    application: {
      status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
      },
      submittedAt: Date,
      reviewedAt: Date,
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SAG",
      },
      comments: String,
    },
    documents: [String],
  },
  {
    timestamps: true,
  }
);

// Add base auth methods
Object.assign(studentSchema.methods, baseAuthSchema.methods);

// Add password hashing middleware
studentSchema.pre("save", async function (next) {
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

const Student = mongoose.model("Student", studentSchema);

export default Student;
