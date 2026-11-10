import express from 'express';
import { register, login, getMe } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { authLimiter } from '../middleware/security';

const router = express.Router();

// Public routes. Credential endpoints are rate limited per IP + submitted email
// so that online password guessing is not practical.
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);

// Protected routes
router.get('/me', authenticateToken, getMe);

export default router;
