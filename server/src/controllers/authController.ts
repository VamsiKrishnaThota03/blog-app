import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDbPool } from '../utils/db';
import { getJwtSecret } from '../config/env';
import { isNonEmptyString, isValidEmail } from '../utils/validation';

const MIN_PASSWORD_LENGTH = 6;

function signToken(userId: number): string {
  return jwt.sign({ id: userId }, getJwtSecret(), { expiresIn: '1d', algorithm: 'HS256' });
}

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body ?? {};

    if (!isNonEmptyString(name, 255)) {
      res.status(400).json({ message: 'Name is required' });
      return;
    }
    if (!isValidEmail(email)) {
      res.status(400).json({ message: 'A valid email is required' });
      return;
    }
    if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH || password.length > 72) {
      res.status(400).json({ message: `Password must be ${MIN_PASSWORD_LENGTH}-72 characters` });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const pool = await getDbPool();

    const userExists = await pool.query('SELECT 1 FROM users WHERE LOWER(email) = $1', [normalizedEmail]);
    if (userExists.rows.length > 0) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name.trim(), normalizedEmail, hashedPassword]
    );
    const user = result.rows[0];

    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      token: signToken(user.id),
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body ?? {};
    if (!isValidEmail(email) || typeof password !== 'string' || password.length === 0) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    const pool = await getDbPool();
    const result = await pool.query(
      'SELECT id, name, email, password FROM users WHERE LOWER(email) = $1',
      [email.trim().toLowerCase()]
    );

    const user = result.rows[0];
    const isMatch = user ? await bcrypt.compare(password, user.password) : false;
    if (!user || !isMatch) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      token: signToken(user.id),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMe = async (req: Request, res: Response) => {
  // authenticateToken has already loaded the user from the database
  res.json(req.user);
};
