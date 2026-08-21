import { Router } from "express";
import {
  signup,
  login,
  verifyOtp,
  forgotPassword,
  resetPassword,
  refreshToken,
  logout,
} from "./auth.controller.js";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/verify-otp", verifyOtp);
router.post("/refresh", refreshToken);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;