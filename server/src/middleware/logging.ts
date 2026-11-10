import { randomUUID } from 'node:crypto';
import pinoHttp from 'pino-http';

/**
 * Structured request logging.
 *
 * Every request gets a correlation id (reusing an inbound `x-request-id` when a
 * proxy supplies one) which is echoed back on the response, so a user-reported
 * error can be traced to a single log line. Authorization headers, cookies and
 * password fields are redacted before anything is serialised.
 */
export const requestLogger = pinoHttp({
  genReqId: (req, res) => {
    const inbound = req.headers['x-request-id'];
    const id = (Array.isArray(inbound) ? inbound[0] : inbound) || randomUUID();
    res.setHeader('x-request-id', id);
    return id;
  },
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.body.password',
      'res.headers["set-cookie"]',
    ],
    censor: '[redacted]',
  },
  // Health checks would otherwise dominate the log on a platform that polls them.
  autoLogging: {
    ignore: (req) => req.url === '/health' || req.url === '/health/ready',
  },
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  serializers: {
    req: (req) => ({ id: req.id, method: req.method, url: req.url }),
    res: (res) => ({ statusCode: res.statusCode }),
  },
});
