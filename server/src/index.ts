import { createApp } from './app';
import { closePool, initializeDatabase } from './config/database';
import { getBindHost, getJwtSecret, getPort } from './config/env';

/**
 * Process entry point: validate configuration, prove the database is reachable,
 * then start listening. Any failure here exits non-zero rather than serving
 * traffic in a half-configured state.
 */
async function startServer() {
  const host = getBindHost();
  const port = getPort();

  try {
    getJwtSecret(); // fail fast if the signing secret is missing
    await initializeDatabase();
    console.log('Database connection established');
  } catch (error) {
    console.error('Failed to start server:', error instanceof Error ? error.message : error);
    process.exit(1);
  }

  const server = createApp().listen(port, host, () => {
    console.log(`Server listening on http://${host}:${port} (docs at /api-docs)`);
  });

  // Hosting platforms send SIGTERM before replacing a container. Draining
  // in-flight requests and closing the pool avoids 502s and leaked Postgres
  // connections during a deploy.
  const shutdown = (signal: string) => {
    console.log(`${signal} received, shutting down`);
    server.close(async () => {
      await closePool();
      process.exit(0);
    });
    // Do not let a stuck connection hold the deploy open forever.
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer();
