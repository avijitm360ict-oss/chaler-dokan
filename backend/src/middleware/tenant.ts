import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  tenantId?: string;
  userId?: string;
  userRole?: string;
}

export const tenantMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  // If authenticated via JWT, tenantId is set by requireAuth
  if (!req.tenantId) {
    return res.status(401).json({
      error: 'Tenant Context Required',
      message: 'দোকানের প্রমাণীকরণ সম্পন্ন হয়নি। অনুগ্রহ করে লগইন করুন।',
    });
  }

  // Allow tenant override only for verified Super Admin users
  const headerTenant = req.headers['x-tenant-id'] as string;
  const isSuperAdmin =
    req.userRole?.toLowerCase() === 'super admin' || req.userRole?.toLowerCase() === 'superadmin';

  if (headerTenant && isSuperAdmin) {
    req.tenantId = headerTenant;
  }

  next();
};
