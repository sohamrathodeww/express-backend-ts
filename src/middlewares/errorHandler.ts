import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { StatusCodes } from 'http-status-codes';
import { ApiResponse, ValidationError } from '../types';

// ─── Validation Result Handler ───────────────────────────────────────────────

export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const validationErrors: ValidationError[] = errors.array().map((err) => ({
      field: err.type === 'field' ? err.path : 'general',
      message: err.msg as string,
    }));

    const response: ApiResponse = {
      success: false,
      message: 'Validation failed',
      errors: validationErrors,
    };

    res.status(StatusCodes.UNPROCESSABLE_ENTITY).json(response);
    return;
  }

  next();
};

// ─── 404 Not Found Handler ───────────────────────────────────────────────────

export const notFoundHandler = (req: Request, res: Response): void => {
  const response: ApiResponse = {
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  };
  res.status(StatusCodes.NOT_FOUND).json(response);
};

// ─── Global Error Handler ─────────────────────────────────────────────────────

export const globalErrorHandler = (
  err: Error & { status?: number; code?: string },
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('❌ Unhandled Error:', err);

  // Sequelize unique constraint error
  if (err.name === 'SequelizeUniqueConstraintError') {
    const response: ApiResponse = {
      success: false,
      message: 'A record with this data already exists',
      errors: [{ field: 'email', message: 'Email address is already registered' }],
    };
    res.status(StatusCodes.CONFLICT).json(response);
    return;
  }

  // Sequelize validation error
  if (err.name === 'SequelizeValidationError') {
    const response: ApiResponse = {
      success: false,
      message: 'Database validation failed',
    };
    res.status(StatusCodes.UNPROCESSABLE_ENTITY).json(response);
    return;
  }

  // Generic error
  const status = err.status ?? StatusCodes.INTERNAL_SERVER_ERROR;
  const response: ApiResponse = {
    success: false,
    message:
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message || 'Internal server error',
  };
  res.status(status).json(response);
};
