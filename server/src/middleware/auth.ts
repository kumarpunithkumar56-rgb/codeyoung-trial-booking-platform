import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import AuthenticationService from '../services/AuthenticationService';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: UserRole;
    timezone: string;
  };
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'AuthenticationError',
        message: 'No authentication token provided',
        statusCode: 401,
      });
    }

    const payload = await AuthenticationService.validateToken(token);
    req.user = payload;
    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'AuthenticationError',
      message: 'Invalid or expired token',
      statusCode: 401,
    });
  }
};

export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'AuthenticationError',
        message: 'Authentication required',
        statusCode: 401,
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'AuthorizationError',
        message: 'Insufficient permissions',
        statusCode: 403,
      });
    }

    return next();
  };
};
