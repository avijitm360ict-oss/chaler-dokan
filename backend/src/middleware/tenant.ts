import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  tenantId?: string;
  userId?: string;
  userRole?: string;
}

export const tenantMiddleware = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) => {
  // Prefer tenant id from header or default to seeded demo tenant
  const tenantId = (req.headers['x-tenant-id'] as string) || 'tenant-demo-001';
  req.tenantId = tenantId;
  next();
};
