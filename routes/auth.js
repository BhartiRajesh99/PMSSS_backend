import express from "express";
import {
  registerStudent,
  registerSAG,
  registerFinance,
  loginStudent,
  loginSAG,
  loginFinance,
  logout,
  getMe,
  updateDetails,
  updatePassword,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Public routes
router.post("/register/student", registerStudent);
router.post("/register/sag", registerSAG);
router.post("/register/finance", registerFinance);

router.post("/login/student", loginStudent);
router.post("/login/sag", loginSAG);
router.post("/login/finance", loginFinance);

router.get("/logout", logout);
router.post("/forgotpassword", forgotPassword);
router.put("/resetpassword/:resettoken", resetPassword);

// Protected routes
router.get("/me", protect, getMe);
router.put("/updatedetails", protect, updateDetails);
router.put("/updatepassword", protect, updatePassword);

export default router;
