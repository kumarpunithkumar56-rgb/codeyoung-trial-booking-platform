import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

// Helmet configuration for HTTP security headers
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // For Tailwind CSS
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", process.env.CLIENT_URL || 'http://localhost:5173'],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
});

// CORS configuration
export const corsConfig = cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

// Rate limiter for authentication endpoints (5 requests per 15 minutes)
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '5'),
  message: {
    success: false,
    error: 'RateLimitError',
    message: 'Too many authentication attempts. Please try again in 15 minutes',
    statusCode: 429,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for general API endpoints (100 requests per 15 minutes)
export const apiRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  keyGenerator: (req: Request) => {
    // Rate limit by user ID if authenticated, otherwise by IP
    return (req as any).user?.userId || req.ip || 'unknown';
  },
  message: {
    success: false,
    error: 'RateLimitError',
    message: 'Too many requests. Please try again later',
    statusCode: 429,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiter only to API routes
export const conditionalRateLimiter = (req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith('/api/')) {
    return apiRateLimiter(req, res, next);
  }
  next();
};
