import dotenv from 'dotenv';

dotenv.config();

/**
 * Read a required environment variable or exit with a clear message.
 * There are deliberately no fallback values for secrets.
 */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(`Missing required environment variable ${name}. See server/.env.example.`);
  }
  return value;
}

export function getJwtSecret(): string {
  return requireEnv('JWT_SECRET');
}

/**
 * Address to bind the HTTP listener to.
 *
 * Loopback by default, so a development server is never reachable from the
 * local network. Managed platforms (Render, Fly, Railway, Heroku) route traffic
 * into the container and require an all-interfaces bind, so they are detected
 * by their own env markers; `HOST` overrides both. Inside a container the
 * published port — not this bind — is the security boundary.
 */
export function getBindHost(): string {
  if (process.env.HOST) return process.env.HOST;
  const managedPlatform =
    process.env.RENDER ||
    process.env.FLY_APP_NAME ||
    process.env.RAILWAY_ENVIRONMENT ||
    process.env.DYNO;
  return managedPlatform ? '0.0.0.0' : '127.0.0.1';
}

/** Port for the HTTP listener. Platforms inject PORT; 4000 locally. */
export function getPort(): number {
  const raw = process.env.PORT;
  if (!raw) return 4000;
  const port = Number(raw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT value ${JSON.stringify(raw)}; expected an integer 1-65535.`);
  }
  return port;
}

/** Comma-separated list of allowed browser origins for CORS. */
export function getCorsOrigins(): string[] {
  const raw =
    process.env.CORS_ORIGINS ||
    'https://blog-app-seven-ruddy.vercel.app,http://localhost:3000,http://localhost:5173';
  return raw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}
