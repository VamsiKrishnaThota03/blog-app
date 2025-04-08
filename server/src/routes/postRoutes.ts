import { Router } from "express";
import {
  createPost,
  getPosts,
  getPost,
  updatePost,
  deletePost,
} from "../controllers/postController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

router.post("/", authenticateToken, createPost);
router.get("/", getPosts);
router.get("/:id", getPost);
router.put("/:id", authenticateToken, updatePost);
router.delete("/:id", authenticateToken, deletePost);

export default router; 