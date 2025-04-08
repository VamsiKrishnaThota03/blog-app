import { Router } from "express";
import {
  createPost,
  getPosts,
  getPost,
  updatePost,
  deletePost,
} from "../controllers/postController";
import { auth } from "../middleware/auth";

const router = Router();

router.post("/", auth, createPost);
router.get("/", getPosts);
router.get("/:id", getPost);
router.put("/:id", auth, updatePost);
router.delete("/:id", auth, deletePost);

export default router; 