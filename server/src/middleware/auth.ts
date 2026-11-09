import { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { getDbPool } from '../utils/db';
import { getJwtSecret } from '../config/env';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: {
        id: number;
        name?: string;
        email?: string;
      };
    }
  }
}

export const authenticateToken: RequestHandler = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

  if (!token) {
    res.status(401).json({ message: 'Access denied. No token provided.' });
    return;
  }

  let decoded: { id: number };
  try {
    decoded = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] }) as { id: number };
  } catch {
    res.status(401).json({ message: 'Invalid token.' });
    return;
  }

  try {
    const pool = await getDbPool();
    const result = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [decoded.id]);

    if (result.rows.length === 0) {
      res.status(401).json({ message: 'Invalid token.' });
      return;
    }

    req.user = {
      id: result.rows[0].id,
      name: result.rows[0].name,
      email: result.rows[0].email,
    };
    next();
  } catch (error) {
    console.error('Auth lookup error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
