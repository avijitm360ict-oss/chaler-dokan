import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';

export interface AuthenticatedRequest extends Request {
  tenantId?: string;
  userId?: string;
  userRole?: string;
  isImpersonating?: boolean;
}

export const tenantMiddleware = async (
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

  // Do not treat platform-level tenant management operations as store-level impersonation
  const isTenantManagement = req.baseUrl?.includes('/tenant') || req.originalUrl?.includes('/api/v1/tenant');

  if (headerTenant && isSuperAdmin && headerTenant !== req.tenantId && !isTenantManagement) {
    // 1. Verify target tenant existence in database
    const targetTenant = await prisma.tenant.findUnique({
      where: { id: headerTenant },
      select: { id: true, name: true, status: true },
    });

    if (!targetTenant) {
      return res.status(404).json({
        error: 'Tenant Not Found',
        message: 'ইমপার্সনেশনের জন্য নির্দিষ্ট দোকানটি পাওয়া যায়নি',
      });
    }

    // 2. Strict Defense: Enforce READ-ONLY restriction for impersonation sessions (Prevent malicious/accidental mutation)
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
      return res.status(403).json({
        error: 'Impersonation Read-Only Violation',
        message: 'নিরাপত্তা বিধি: ইমপার্সনেশন মোডে কোনো ডাটা পরিবর্তন বা নতুন রেকর্ড তৈরি করা সম্পূর্ণ নিষিদ্ধ (Read-Only Mode Enforced)',
      });
    }

    req.tenantId = headerTenant;
    req.isImpersonating = true;
  }

  next();
};
