import rateLimit from 'express-rate-limit';

/** Phase 14: Brute-force / abuse protection for sensitive routes. */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.AUTH_RATE_LIMIT_MAX) || 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many attempts from this IP. Please try again in a few minutes.' },
  skip: (req) => process.env.NODE_ENV === 'test',
});

export const chatbotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.CHATBOT_RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many tutor messages. Please slow down and try again shortly.' },
  skip: (req) => process.env.NODE_ENV === 'test',
});

export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: Number(process.env.UPLOAD_RATE_LIMIT_MAX) || 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Upload limit reached for this hour. Try again later.' },
  skip: (req) => process.env.NODE_ENV === 'test',
});
