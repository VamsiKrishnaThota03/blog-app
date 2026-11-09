import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import { getCorsOrigins, getJwtSecret } from './config/env';
import authRoutes from './routes/auth';
import postRoutes from './routes/posts';
import { initializeDatabase } from './config/database';

const app = express();
const port = process.env.PORT || 4000;

app.use(
  cors({
    origin: getCorsOrigins(),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json({ limit: '1mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: 'Not found' });
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error & { type?: string }, _req: Request, res: Response, _next: NextFunction) => {
  if (err.type === 'entity.parse.failed') {
    res.status(400).json({ message: 'Invalid JSON body' });
    return;
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Server error' });
});

async function startServer() {
  try {
    getJwtSecret(); // fail fast if the signing secret is missing
    await initializeDatabase();
    console.log('Database connection established');

    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

startServer();
