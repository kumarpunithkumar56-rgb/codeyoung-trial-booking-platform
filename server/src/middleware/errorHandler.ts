import { Request, Response, NextFunction } from 'express';

export class ValidationError extends Error {
  constructor(public details: any, message = 'Invalid input data') {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  constructor(message = 'Authentication failed') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends Error {
  constructor(message = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class BusinessLogicError extends Error {
  constructor(public type: string, message: string, public details?: any) {
    super(message);
    this.name = 'BusinessLogicError';
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error('[Error]', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  let statusCode = 500;
  let errorType = 'InternalServerError';
  let message = 'An unexpected error occurred';
  let details = undefined;

  if (err instanceof ValidationError) {
    statusCode = 400;
    errorType = 'ValidationError';
    message = err.message;
    details = err.details;
  } else if (err instanceof AuthenticationError) {
    statusCode = 401;
    errorType = 'AuthenticationError';
    message = err.message;
  } else if (err instanceof AuthorizationError) {
    statusCode = 403;
    errorType = 'AuthorizationError';
    message = err.message;
  } else if (err instanceof NotFoundError) {
    statusCode = 404;
    errorType = 'NotFoundError';
    message = err.message;
  } else if (err instanceof BusinessLogicError) {
    statusCode = 409;
    errorType = err.type;
    message = err.message;
    details = err.details;
  } else if (err.message.includes('SLOT_UNAVAILABLE')) {
    statusCode = 409;
    errorType = 'BookingConflictError';
    message = err.message.split(':')[1] || 'Slot unavailable';
  } else if (err.message.includes('DAILY_LIMIT_REACHED')) {
    statusCode = 409;
    errorType = 'BookingConflictError';
    message = err.message.split(':')[1] || 'Daily limit reached';
  }

  res.status(statusCode).json({
    success: false,
    error: errorType,
    message,
    statusCode,
    ...(details && { details }),
  });
};
