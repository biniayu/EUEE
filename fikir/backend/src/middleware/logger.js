/**
 * Phase 14: Lightweight request logging (replace with pino/winston in production if needed).
 */
const NODE_ENV = process.env.NODE_ENV || 'development';

export function requestLogger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    if (NODE_ENV !== 'development') return;
    const ms = Date.now() - start;
    if (req.path.startsWith('/api')) {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`);
    }
  });
  next();
}
