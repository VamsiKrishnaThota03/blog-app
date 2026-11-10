import express from 'express';
import {
  createPost,
  getPosts,
  getPost,
  updatePost,
  deletePost,
  getMyPosts,
} from '../controllers/postController';
import { authenticateToken } from '../middleware/auth';
import { writeLimiter } from '../middleware/security';

const router = express.Router();

// The caller's own posts. Declared before '/:id' so the intent is obvious on
// reading, even though a two-segment path could not match the single-segment
// '/:id' pattern anyway.
router.get('/user/me', authenticateToken, getMyPosts);

// Public reads: this is a public blog feed, so these are deliberately anonymous.
router.get('/', getPosts);
router.get('/:id', getPost);

// Writes require a bearer token; the controllers additionally scope every
// UPDATE/DELETE to `user_id = <caller>` so one author cannot edit another's post.
router.post('/', authenticateToken, writeLimiter, createPost);
router.put('/:id', authenticateToken, writeLimiter, updatePost);
router.delete('/:id', authenticateToken, writeLimiter, deletePost);

export default router;
