import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { getCorsOrigins } from './config/env';
import { getPool } from './config/database';
import authRoutes from './routes/auth';
import postRoutes from './routes/posts';
import { requestLogger } from './middleware/logging';
import { globalLimiter, securityHeaders } from './middleware/security';
import { openApiDocument } from './openapi';

/**
 * Build the Express application.
 *
 * Separated from `index.ts` so tests can drive the app with supertest on an
 * ephemeral port instead of binding the real one. Nothing here calls `listen`:
 * the bind address is decided in `index.ts` and defaults to loopback.
 *
 * Audience note: the post feed (`GET /api/posts`, `GET /api/posts/:id`) is
 * deliberately anonymous — it is a public blog, and gating it would lock out
 * the readers it exists for. Everything that writes, or that reads a specific
 * user's data, sits behind `authenticateToken` in the route modules.
 */
export function createApp() {
  const app = express();

  // Render and Vercel terminate TLS one hop upstream. Trusting exactly one
  // proxy makes `req.ip` the real client address for the rate limiters;
  // trusting all (`true`) would let a client spoof X-Forwarded-For and dodge them.
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(securityHeaders);
  app.use(requestLogger);
  app.use(
    cors({
      origin: getCorsOrigins(),
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
      exposedHeaders: ['X-Request-Id'],
      maxAge: 86_400,
    })
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(globalLimiter);

  // Liveness: the process is up. Intentionally does not touch the database, so
  // a platform health check does not fail over a transient DB blip.
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  // Readiness: the process can actually serve traffic.
  app.get('/health/ready', async (req: Request, res: Response) => {
    try {
      const pool = await getPool();
      await pool.query('SELECT 1');
      res.json({ status: 'ready' });
    } catch (error) {
      req.log?.error({ err: error }, 'Readiness check failed');
      res.status(503).json({ status: 'unavailable', message: 'Database unreachable' });
    }
  });

  app.get('/openapi.json', (_req: Request, res: Response) => {
    res.json(openApiDocument);
  });
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(openApiDocument, {
      customSiteTitle: 'Blog App API',
      swaggerOptions: { persistAuthorization: true },
    })
  );

  app.use('/api/auth', authRoutes);
  app.use('/api/posts', postRoutes);

  app.use((_req: Request, res: Response) => {
    res.status(404).json({ message: 'Not found' });
  });

  app.use((err: Error & { type?: string }, req: Request, res: Response, _next: NextFunction) => {
    if (err.type === 'entity.parse.failed') {
      res.status(400).json({ message: 'Invalid JSON body' });
      return;
    }
    req.log?.error({ err }, 'Unhandled error');
    // Never leak an internal message or stack to the client; the request id in
    // the response header is the handle for correlating with the log line.
    res.status(500).json({ message: 'Server error' });
  });

  return app;
}

export default createApp;
