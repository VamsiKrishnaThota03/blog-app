import { Request, Response, NextFunction } from "express";
import { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import pool from "../config/database";

declare global {
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
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ message: 'Access denied. No token provided.' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key') as { id: number };

    // Verify user exists in database
    const result = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [decoded.id]);
    
    if (result.rows.length === 0) {
      res.status(401).json({ message: 'Invalid token.' });
      return;
    }

    req.user = {
      id: result.rows[0].id,
      name: result.rows[0].name,
      email: result.rows[0].email
    };
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token.' });
    return;
  }
}; 