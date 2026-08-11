import { Router } from "express";
import {
  signup,
  login,
  verifyOtp,
  forgotPassword,
  resetPassword,
} from "./auth.controller";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/verify-otp", verifyOtp);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;