import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export const validateRequest = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      return next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'ValidationError',
          message: 'Invalid input data',
          statusCode: 400,
          details: error.errors.reduce((acc, err) => {
            acc[err.path.join('.')] = err.message;
            return acc;
          }, {} as Record<string, string>),
        });
      }
      return next(error);
    }
  };
};
