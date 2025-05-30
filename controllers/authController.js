import crypto from "crypto";
import Student from "../models/Student.js";
import SAG from "../models/SAG.js";
import Finance from "../models/Finance.js";
import { ErrorResponse } from "../utils/errorResponse.js";
import { sendEmail } from "../utils/sendEmail.js";

// @desc    Register student
// @route   POST /api/auth/register/student
// @access  Public
export const registerStudent = async (req, res, next) => {
  try {
    console.log("Student registration request received:", {
      body: { ...req.body, password: "[REDACTED]" },
    });

    const { name, email, password, ...studentDetails } = req.body;

    // Check if student already exists
    const existingStudent = await Student.findOne({ email });
    if (existingStudent) {
      return next(new ErrorResponse("Email already registered", 400));
    }

    try {
      // Create student
      const student = await Student.create({
        name,
        email,
        password,
        ...studentDetails,
      });

      console.log("Student created successfully:", {
        id: student._id,
        email: student.email,
      });

      sendTokenResponse(student, 201, res);
    } catch (dbError) {
      console.error("Database error during student registration:", {
        error: dbError,
        code: dbError.code,
        message: dbError.message,
        stack: dbError.stack,
      });

      if (dbError.code === 11000) {
        return next(new ErrorResponse("Email already registered", 400));
      }

      if (dbError.name === "ValidationError") {
        const validationErrors = Object.values(dbError.errors).map(
          (err) => err.message
        );
        return next(new ErrorResponse(validationErrors.join(", "), 400));
      }

      return next(new ErrorResponse("Error creating student account", 500));
    }
  } catch (error) {
    console.error("Student registration error:", {
      error: error,
      message: error.message,
      stack: error.stack,
    });
    return next(new ErrorResponse("Server error during registration", 500));
  }
};

// @desc    Register SAG
// @route   POST /api/auth/register/sag
// @access  Public
export const registerSAG = async (req, res, next) => {
  try {
    console.log("SAG registration request received:", {
      body: { ...req.body, password: "[REDACTED]" },
    });

    const { name, email, password, ...sagDetails } = req.body;

    // Check if SAG already exists
    const existingSAG = await SAG.findOne({ email });
    if (existingSAG) {
      return next(new ErrorResponse("Email already registered", 400));
    }

    try {
      // Create SAG
      const sag = await SAG.create({
        name,
        email,
        password,
        ...sagDetails,
      });

      console.log("SAG created successfully:", {
        id: sag._id,
        email: sag.email,
        state: sag.state,
      });

      sendTokenResponse(sag, 201, res);
    } catch (dbError) {
      console.error("Database error during SAG registration:", {
        error: dbError,
        code: dbError.code,
        message: dbError.message,
        stack: dbError.stack,
      });

      if (dbError.code === 11000) {
        if (dbError.keyPattern.email) {
          return next(new ErrorResponse("Email already registered", 400));
        }
        if (dbError.keyPattern.state) {
          return next(
            new ErrorResponse("SAG bureau already exists for this state", 400)
          );
        }
        if (dbError.keyPattern["organizationDetails.registrationNumber"]) {
          return next(
            new ErrorResponse("Registration number already exists", 400)
          );
        }
      }

      if (dbError.name === "ValidationError") {
        const validationErrors = Object.values(dbError.errors).map(
          (err) => err.message
        );
        return next(new ErrorResponse(validationErrors.join(", "), 400));
      }

      return next(new ErrorResponse("Error creating SAG account", 500));
    }
  } catch (error) {
    console.error("SAG registration error:", {
      error: error,
      message: error.message,
      stack: error.stack,
    });
    return next(new ErrorResponse("Server error during registration", 500));
  }
};

// @desc    Register Finance
// @route   POST /api/auth/register/finance
// @access  Public
export const registerFinance = async (req, res, next) => {
  try {
    console.log("Finance registration request received:", {
      body: { ...req.body, password: "[REDACTED]" },
    });

    const { name, email, password, ...financeDetails } = req.body;

    // Check if Finance already exists
    const existingFinance = await Finance.findOne({ email });
    if (existingFinance) {
      return next(new ErrorResponse("Email already registered", 400));
    }

    try {
      // Create Finance
      const finance = await Finance.create({
        name,
        email,
        password,
        ...financeDetails,
      });

      console.log("Finance created successfully:", {
        id: finance._id,
        email: finance.email,
        department: finance.departmentName,
      });

      sendTokenResponse(finance, 201, res);
    } catch (dbError) {
      console.error("Database error during Finance registration:", {
        error: dbError,
        code: dbError.code,
        message: dbError.message,
        stack: dbError.stack,
      });

      if (dbError.code === 11000) {
        if (dbError.keyPattern.email) {
          return next(new ErrorResponse("Email already registered", 400));
        }
        if (dbError.keyPattern.departmentCode) {
          return next(new ErrorResponse("Department code already exists", 400));
        }
      }

      if (dbError.name === "ValidationError") {
        const validationErrors = Object.values(dbError.errors).map(
          (err) => err.message
        );
        return next(new ErrorResponse(validationErrors.join(", "), 400));
      }

      return next(new ErrorResponse("Error creating Finance account", 500));
    }
  } catch (error) {
    console.error("Finance registration error:", {
      error: error,
      message: error.message,
      stack: error.stack,
    });
    return next(new ErrorResponse("Server error during registration", 500));
  }
};

// @desc    Login student
// @route   POST /api/auth/login/student
// @access  Public
export const loginStudent = async (req, res, next) => {
  try {
    console.log("Student login request received:", {
      body: { ...req.body, password: "[REDACTED]" },
    });

    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      console.log("Missing email or password");
      return next(
        new ErrorResponse("Please provide both email and password", 400)
      );
    }

    // Check for student
    const student = await Student.findOne({ email }).select("+password");
    console.log("Student lookup result:", student ? "Found" : "Not found");

    if (!student) {
      return res.json(
        new ErrorResponse(
          "No student account found with this email. Please register first.",
          404
        )
      );
    }

    // Check if password matches
    const isMatch = await student.matchPassword(password);
    console.log("Password match result:", isMatch ? "Match" : "No match");

    if (!isMatch) {
      return next(new ErrorResponse("Invalid email or password", 401));
    }

    // Update last login
    student.lastLogin = Date.now();
    await student.save({ validateBeforeSave: false });

    sendTokenResponse(student, 200, res);
  } catch (error) {
    console.error("Student login error:", {
      error: error,
      message: error.message
    });
    return next(new ErrorResponse("Server error during login", 500));
  }
};

// @desc    Login SAG
// @route   POST /api/auth/login/sag
// @access  Public
export const loginSAG = async (req, res, next) => {
  try {
    console.log("SAG login request received:", {
      body: { ...req.body, password: "[REDACTED]" },
    });

    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      console.log("Missing email or password");
      return next(
        new ErrorResponse("Please provide both email and password", 400)
      );
    }

    // Check for SAG
    const sag = await SAG.findOne({ email }).select("+password");
    console.log("SAG lookup result:", sag ? "Found" : "Not found");

    if (!sag) {
      return next(
        new ErrorResponse(
          "No SAG bureau account found with this email. Please register first.",
          404
        )
      );
    }

    // Check if password matches
    const isMatch = await sag.matchPassword(password);
    console.log("Password match result:", isMatch ? "Match" : "No match");

    if (!isMatch) {
      return next(new ErrorResponse("Invalid email or password", 401));
    }

    // Update last login
    sag.lastLogin = Date.now();
    await sag.save({ validateBeforeSave: false });

    sendTokenResponse(sag, 200, res);
  } catch (error) {
    console.error("SAG login error:", {
      error: error,
      message: error.message,
      stack: error.stack,
    });
    return next(new ErrorResponse("Server error during login", 500));
  }
};

// @desc    Login Finance
// @route   POST /api/auth/login/finance
// @access  Public
export const loginFinance = async (req, res, next) => {
  try {
    console.log("Finance login request received:", {
      body: { ...req.body, password: "[REDACTED]" },
    });

    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      console.log("Missing email or password");
      return next(
        new ErrorResponse("Please provide both email and password", 400)
      );
    }

    // Check for Finance
    const finance = await Finance.findOne({ email }).select("+password");
    console.log("Finance lookup result:", finance ? "Found" : "Not found");

    if (!finance) {
      return next(
        new ErrorResponse(
          "No Finance bureau account found with this email. Please register first.",
          404
        )
      );
    }

    // Check if password matches
    const isMatch = await finance.matchPassword(password);
    console.log("Password match result:", isMatch ? "Match" : "No match");

    if (!isMatch) {
      return next(new ErrorResponse("Invalid email or password", 401));
    }

    // Update last login
    finance.lastLogin = Date.now();
    await finance.save({ validateBeforeSave: false });

    sendTokenResponse(finance, 200, res);
  } catch (error) {
    console.error("Finance login error:", {
      error: error,
      message: error.message,
      stack: error.stack,
    });
    return next(new ErrorResponse("Server error during login", 500));
  }
};

// @desc    Log user out / clear cookie
// @route   GET /api/auth/logout
// @access  Private
export const logout = async (req, res, next) => {
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    data: {},
  });
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    let user;
    switch (req.user.role) {
      case "student":
        user = await Student.findById(req.user.id);
        break;
      case "sag":
        user = await SAG.findById(req.user.id);
        break;
      case "finance":
        user = await Finance.findById(req.user.id);
        break;
      default:
        return next(new ErrorResponse("Invalid user role", 400));
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
// @access  Private
export const updateDetails = async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email,
    };

    let user;
    switch (req.user.role) {
      case "student":
        user = await Student.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
          new: true,
          runValidators: true,
        });
        break;
      case "sag":
        user = await SAG.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
          new: true,
          runValidators: true,
        });
        break;
      case "finance":
        user = await Finance.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
          new: true,
          runValidators: true,
        });
        break;
      default:
        return next(new ErrorResponse("Invalid user role", 400));
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
export const updatePassword = async (req, res, next) => {
  try {
    let user;
    switch (req.user.role) {
      case "student":
        user = await Student.findById(req.user.id).select("+password");
        break;
      case "sag":
        user = await SAG.findById(req.user.id).select("+password");
        break;
      case "finance":
        user = await Finance.findById(req.user.id).select("+password");
        break;
      default:
        return next(new ErrorResponse("Invalid user role", 400));
    }

    // Check current password
    if (!(await user.matchPassword(req.body.currentPassword))) {
      return next(new ErrorResponse("Password is incorrect", 401));
    }

    user.password = req.body.newPassword;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
export const forgotPassword = async (req, res, next) => {
  try {
    const { email, role } = req.body;

    let user;
    switch (role) {
      case "student":
        user = await Student.findOne({ email });
        break;
      case "sag":
        user = await SAG.findOne({ email });
        break;
      case "finance":
        user = await Finance.findOne({ email });
        break;
      default:
        return next(new ErrorResponse("Invalid user role", 400));
    }

    if (!user) {
      return next(new ErrorResponse("There is no user with that email", 404));
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    // Create reset url
    const resetUrl = `${req.protocol}://${req.get(
      "host"
    )}/api/auth/resetpassword/${resetToken}`;

    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

    try {
      await sendEmail({
        email: user.email,
        subject: "Password reset token",
        message,
      });

      res.status(200).json({ success: true, data: "Email sent" });
    } catch (err) {
      console.log(err);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      await user.save({ validateBeforeSave: false });

      return next(new ErrorResponse("Email could not be sent", 500));
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
export const resetPassword = async (req, res, next) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.resettoken)
      .digest("hex");

    let user;
    // Try to find user in each model
    user = await Student.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      user = await SAG.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() },
      });
    }

    if (!user) {
      user = await Finance.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() },
      });
    }

    if (!user) {
      return next(new ErrorResponse("Invalid token", 400));
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }

    // Create token
    const token = user.getSignedJwtToken();

    const options = {
      expires: new Date(
        Date.now() + (process.env.JWT_COOKIE_EXPIRE || 30) * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
    };

    if (process.env.NODE_ENV === "production") {
      options.secure = true;
    }

    // Map model name to role
    let role;
    switch (user.constructor.modelName.toLowerCase()) {
      case "sag":
        role = "sag_bureau";
        break;
      case "finance":
        role = "finance_bureau";
        break;
      default:
        role = user.constructor.modelName.toLowerCase();
    }

    res
      .status(statusCode)
      .cookie("token", token, options)
      .json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: role,
        },
      });
  } catch (error) {
    console.error("Token response error:", error);
    res.status(500).json({
      success: false,
      message: "Error generating authentication token. Please try again.",
    });
  }
};
