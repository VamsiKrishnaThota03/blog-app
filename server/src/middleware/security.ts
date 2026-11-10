import type { RequestHandler } from 'express';
import rateLimit, { type Options } from 'express-rate-limit';
import helmet from 'helmet';

/**
 * Baseline HTTP hardening.
 *
 * The API serves JSON to a separate browser origin, so the CSP that ships with
 * helmet by default (which assumes the same origin renders HTML) is replaced by
 * a deny-everything policy: nothing is ever loaded as a subresource from here.
 * `crossOriginResourcePolicy` is relaxed to `cross-origin` because the SPA is
 * hosted on another domain and must be able to read these responses.
 */
export const securityHeaders: RequestHandler = helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      'default-src': ["'none'"],
      'frame-ancestors': ["'none'"],
      'base-uri': ["'none'"],
      'form-action': ["'none'"],
    },
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  referrerPolicy: { policy: 'no-referrer' },
  // Only meaningful over TLS; harmless locally because browsers ignore it on
  // plain-HTTP localhost responses.
  hsts: { maxAge: 31_536_000, includeSubDomains: true, preload: false },
});

const RATE_LIMIT_DEFAULTS: Partial<Options> = {
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  // Render/Vercel terminate TLS upstream, so the client IP arrives in
  // X-Forwarded-For. `app.set('trust proxy', 1)` in app.ts makes
  // `req.ip` resolve to it; without that this would rate-limit the proxy.
  message: { message: 'Too many requests, please try again later.' },
};

/** Coarse ceiling applied to every route, to blunt scraping and floods. */
export const globalLimiter = rateLimit({
  ...RATE_LIMIT_DEFAULTS,
  windowMs: 15 * 60 * 1000,
  limit: 600,
});

/**
 * Tight limiter for credential endpoints. Counts failures *and* successes so an
 * attacker cannot use valid logins to refill their budget, and keys on
 * IP + submitted email so one attacker cannot lock out an entire NAT range.
 */
export const authLimiter = rateLimit({
  ...RATE_LIMIT_DEFAULTS,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  keyGenerator: (req) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    return `${req.ip ?? 'unknown'}:${email}`;
  },
  message: { message: 'Too many authentication attempts, please try again in 15 minutes.' },
});

/** Limiter for authenticated writes, keyed on the user when one is present. */
export const writeLimiter = rateLimit({
  ...RATE_LIMIT_DEFAULTS,
  windowMs: 60 * 1000,
  limit: 30,
  keyGenerator: (req) => (req.user ? `user:${req.user.id}` : `ip:${req.ip ?? 'unknown'}`),
});
