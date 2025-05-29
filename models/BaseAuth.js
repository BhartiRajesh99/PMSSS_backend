import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const baseAuthSchema = new mongoose.Schema(
  {
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
    name: {
      type: String,
      required: [true, "Please add a name"],
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
baseAuthSchema.pre("save", async function (next) {
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
baseAuthSchema.methods.getSignedJwtToken = function () {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }

    // Map model name to role
    let role;
    switch (this.constructor.modelName.toLowerCase()) {
      case "sag":
        role = "sag_bureau";
        break;
      case "finance":
        role = "finance_bureau";
        break;
      default:
        role = this.constructor.modelName.toLowerCase();
    }

    return jwt.sign({ id: this._id, role: role }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || "30d",
    });
  } catch (error) {
    console.error("JWT signing error:", error);
    throw new Error("Error generating authentication token");
  }
};

// Match user entered password to hashed password in database
baseAuthSchema.methods.matchPassword = async function (enteredPassword) {
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

export default baseAuthSchema;
