import jwt from "jsonwebtoken";
import { ErrorResponse } from "../utils/errorResponse.js";
import Student from "../models/Student.js";
import SAG from "../models/SAG.js";
import Finance from "../models/Finance.js";

// Protect routes
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(" ")[1];
  }

  // Make sure token exists
  if (!token) {
    return next(new ErrorResponse("Not authorized to access this route", 401));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user in appropriate model based on role
    let user;
    switch (decoded.role) {
      case "student":
        user = await Student.findById(decoded.id);
        break;
      case "sag_bureau":
        user = await SAG.findById(decoded.id);
        break;
      case "finance_bureau":
        user = await Finance.findById(decoded.id);
        break;
      default:
        return next(new ErrorResponse("Invalid user role", 401));
    }

    if (!user) {
      return next(new ErrorResponse("User not found", 404));
    }

    // Set the role on the user object
    user.role = decoded.role;
    req.user = user;
    next();
  } catch (err) {
    return next(new ErrorResponse("Not authorized to access this route", 401));
  }
};

// Grant access to specific roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `User role ${req.user.role} is not authorized to access this route`,
          403
        )
      );
    }
    next();
  };
};
