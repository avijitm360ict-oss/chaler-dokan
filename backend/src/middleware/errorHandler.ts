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

  const isProduction = process.env.NODE_ENV === 'production';
  const statusCode =
    typeof err.statusCode === 'number'
      ? err.statusCode
      : typeof err.status === 'number'
      ? err.status
      : 500;

  const safeMessage =
    isProduction && statusCode === 500
      ? 'সার্ভারে অভ্যন্তরীণ ত্রুটি দেখা দিয়েছে। অনুগ্রহ করে পরে আবার চেষ্টা করুন।'
      : err.message || 'সার্ভারে অভ্যন্তরীণ ত্রুটি দেখা দিয়েছে';

  res.status(statusCode).json({
    error: isProduction && statusCode === 500 ? 'Internal Server Error' : err.name || 'Internal Server Error',
    message: safeMessage,
  });
};
