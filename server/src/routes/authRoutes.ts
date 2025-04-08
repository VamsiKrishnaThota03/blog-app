import { Router } from "express";
import { register, login, getMe } from "../controllers/authController";
import { auth } from "../middleware/auth";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", auth, getMe);

export default router; 