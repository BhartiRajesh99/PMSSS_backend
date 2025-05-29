import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a name"],
    },
    email: {
      type: String,
      required: [true, "Please add an email"],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please add a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Please add a password"],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ["student", "sag_bureau", "finance_bureau"],
      default: "student",
    },
    studentDetails: {
      registrationNumber: String,
      course: String,
      institution: String,
      yearOfStudy: Number,
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
      bankDetails: {
        accountHolderName: String,
        accountNumber: String,
        ifscCode: String,
        bankName: String,
        branch: String,
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
    },
    financeDetails: {
      departmentName: String,
      departmentCode: String,
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
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Encrypt password using bcrypt
userSchema.pre("save", async function (next) {
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

// Sign JWT and return
userSchema.methods.getSignedJwtToken = function () {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }

    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || "30d",
    });
  } catch (error) {
    console.error("JWT signing error:", error);
    throw new Error("Error generating authentication token");
  }
};

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  try {
    if (!this.password) {
      throw new Error("Password not available for comparison");
    }
    return await bcrypt.compare(enteredPassword, this.password);
  } catch (error) {
    console.error("Password comparison error:", error);
    throw new Error("Error comparing passwords");
  }
};

const User = mongoose.model("User", userSchema);

export default User;
