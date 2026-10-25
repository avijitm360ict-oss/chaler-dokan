import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error('API Error:', err);

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'প্রদত্ত তথ্যে ভুল রয়েছে',
      issues: err.errors,
    });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'সার্ভারে অভ্যন্তরীণ ত্রুটি দেখা দিয়েছে',
  });
};
