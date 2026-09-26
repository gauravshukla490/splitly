import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware.js";
import { getAllContacts } from "./contacts.controller.js";

const router = Router();

router.use(authMiddleware);

router.get("/", getAllContacts);

export default router;
