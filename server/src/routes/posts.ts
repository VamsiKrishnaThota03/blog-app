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
import { Request, Response } from 'express';
import pool from '../config/database';

const router = express.Router();

// Public routes
router.get('/', getPosts);
router.get('/:id', getPost);

// Protected routes
router.post('/', authenticateToken, createPost);
router.put('/:id', authenticateToken, updatePost);
router.delete('/:id', authenticateToken, deletePost);

// User posts route
router.get('/user/me', authenticateToken, getMyPosts);

export default router; 