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
