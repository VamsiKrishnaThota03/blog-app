import { Request, Response } from 'express';
import { getPool } from '../config/database';

export const getMyPosts = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const result = await getPool().query(
      `SELECT p.*, u.name as author_name 
       FROM posts p 
       JOIN users u ON p.author_id = u.id 
       WHERE p.author_id = $1 
       ORDER BY p.created_at DESC`,
      [userId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({ message: 'Error fetching user posts' });
  }
}; 