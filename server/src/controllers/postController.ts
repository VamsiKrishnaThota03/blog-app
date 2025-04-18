import { Request, Response } from 'express';
import { RequestHandler } from 'express';
import { getDbPool } from '../utils/db';

export const createPost: RequestHandler = async (req, res) => {
  try {
    const { title, content } = req.body;
    const userId = req.user!.id;
    const pool = await getDbPool();

    const result = await pool.query(
      'INSERT INTO posts (title, content, user_id) VALUES ($1, $2, $3) RETURNING *',
      [title, content, userId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getPosts: RequestHandler = async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    const pool = await getDbPool();

    const postsResult = await pool.query(
      `SELECT p.*, u.name as author_name 
       FROM posts p 
       JOIN users u ON p.user_id = u.id 
       ORDER BY p.created_at DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await pool.query('SELECT COUNT(*) FROM posts');
    const totalPosts = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalPosts / limit);

    res.json({
      posts: postsResult.rows,
      currentPage: page,
      totalPages,
      totalPosts,
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getPost: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getDbPool();

    const result = await pool.query(
      `SELECT p.*, u.name as author_name 
       FROM posts p 
       JOIN users u ON p.user_id = u.id 
       WHERE p.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updatePost: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const userId = req.user!.id;
    const pool = await getDbPool();

    // Check if post exists and belongs to user
    const checkResult = await pool.query(
      'SELECT * FROM posts WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (checkResult.rows.length === 0) {
      res.status(404).json({ message: 'Post not found or not authorized' });
      return;
    }

    // Update post
    const result = await pool.query(
      'UPDATE posts SET title = $1, content = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [title, content, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deletePost: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const pool = await getDbPool();

    // Check if post exists and belongs to user
    const checkResult = await pool.query(
      'SELECT * FROM posts WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (checkResult.rows.length === 0) {
      res.status(404).json({ message: 'Post not found or not authorized' });
      return;
    }

    // Delete post
    await pool.query('DELETE FROM posts WHERE id = $1', [id]);

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMyPosts: RequestHandler = async (req, res) => {
  try {
    const userId = req.user!.id;
    const pool = await getDbPool();

    const result = await pool.query(
      'SELECT * FROM posts WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get my posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}; 