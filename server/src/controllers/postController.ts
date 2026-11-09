import { RequestHandler } from 'express';
import { getDbPool } from '../utils/db';
import { isNonEmptyString, parsePositiveInt } from '../utils/validation';

const MAX_TITLE_LENGTH = 255;
const MAX_CONTENT_LENGTH = 50000;
const MAX_PAGE_SIZE = 50;

function validatePostBody(body: unknown): { title: string; content: string } | string {
  const { title, content } = (body ?? {}) as Record<string, unknown>;
  if (!isNonEmptyString(title, MAX_TITLE_LENGTH)) {
    return `Title is required (max ${MAX_TITLE_LENGTH} characters)`;
  }
  if (!isNonEmptyString(content, MAX_CONTENT_LENGTH)) {
    return `Content is required (max ${MAX_CONTENT_LENGTH} characters)`;
  }
  return { title: title.trim(), content };
}

export const createPost: RequestHandler = async (req, res) => {
  try {
    const parsed = validatePostBody(req.body);
    if (typeof parsed === 'string') {
      res.status(400).json({ message: parsed });
      return;
    }
    const pool = await getDbPool();
    const result = await pool.query(
      'INSERT INTO posts (title, content, user_id) VALUES ($1, $2, $3) RETURNING *',
      [parsed.title, parsed.content, req.user!.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getPosts: RequestHandler = async (req, res) => {
  try {
    const page = parsePositiveInt(req.query.page) ?? 1;
    const limit = Math.min(parsePositiveInt(req.query.limit) ?? 10, MAX_PAGE_SIZE);
    const offset = (page - 1) * limit;
    const pool = await getDbPool();

    const postsResult = await pool.query(
      `SELECT p.*, u.name AS author_name
       FROM posts p
       JOIN users u ON p.user_id = u.id
       ORDER BY p.created_at DESC, p.id DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await pool.query('SELECT COUNT(*) FROM posts');
    const totalPosts = parseInt(countResult.rows[0].count, 10);

    res.json({
      posts: postsResult.rows,
      currentPage: page,
      totalPages: Math.ceil(totalPosts / limit),
      totalPosts,
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getPost: RequestHandler = async (req, res) => {
  try {
    const id = parsePositiveInt(req.params.id);
    if (id === null) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }
    const pool = await getDbPool();
    const result = await pool.query(
      `SELECT p.*, u.name AS author_name
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
    const id = parsePositiveInt(req.params.id);
    if (id === null) {
      res.status(404).json({ message: 'Post not found or not authorized' });
      return;
    }
    const parsed = validatePostBody(req.body);
    if (typeof parsed === 'string') {
      res.status(400).json({ message: parsed });
      return;
    }
    const pool = await getDbPool();
    // Ownership check and update in a single statement
    const result = await pool.query(
      `UPDATE posts SET title = $1, content = $2, updated_at = NOW()
       WHERE id = $3 AND user_id = $4
       RETURNING *`,
      [parsed.title, parsed.content, id, req.user!.id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Post not found or not authorized' });
      return;
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deletePost: RequestHandler = async (req, res) => {
  try {
    const id = parsePositiveInt(req.params.id);
    if (id === null) {
      res.status(404).json({ message: 'Post not found or not authorized' });
      return;
    }
    const pool = await getDbPool();
    const result = await pool.query('DELETE FROM posts WHERE id = $1 AND user_id = $2 RETURNING id', [
      id,
      req.user!.id,
    ]);

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Post not found or not authorized' });
      return;
    }
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMyPosts: RequestHandler = async (req, res) => {
  try {
    const pool = await getDbPool();
    const result = await pool.query(
      'SELECT * FROM posts WHERE user_id = $1 ORDER BY created_at DESC, id DESC',
      [req.user!.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get my posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
