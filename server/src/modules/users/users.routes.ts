import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware.js";
import { getCurrentUser, searchUsers } from "./users.controller.js";

const router = Router();

router.use(authMiddleware);

router.get("/me", getCurrentUser);
router.get("/search", searchUsers);

export default router;
