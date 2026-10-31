import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthenticatedRequest } from '../middleware/tenant';
import { requireRole } from '../middleware/auth';

const router = Router();

// GET /api/v1/audit-logs - List audit trail logs for tenant (Privileged only)
router.get('/', requireRole(['Owner', 'Manager', 'Super Admin']), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const tenantId = req.tenantId!;

    const logs = await prisma.auditLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    const formatted = logs.map((log) => {
      const detailsObj = (log.after as any) || (log.before as any) || {};
      return {
        id: log.id,
        timestamp: log.createdAt.toISOString(),
        userName: detailsObj.userName || 'ম্যানেজার',
        userRole: detailsObj.userRole || 'owner',
        action: log.action,
        entityType: log.entity,
        entityId: log.entityId,
        details: detailsObj.details || `${log.action} সম্পন্ন হয়েছে`,
        oldValue: detailsObj.oldValue,
        newValue: detailsObj.newValue,
      };
    });

    res.json({
      success: true,
      data: formatted,
      logs: formatted,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/audit-logs - Create audit log bound to authenticated user
router.post('/', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const tenantId = req.tenantId!;
    const { action, entityType, entityId, details, oldValue, newValue } = req.body;

    if (!action || !entityType) {
      return res.status(400).json({ error: 'Missing required audit fields' });
    }

    // Authenticated provenance
    const userRole = req.userRole || 'employee';
    let userName = 'সিস্টেম ইউজার';
    if (req.userId) {
      const userRecord = await prisma.user.findUnique({
        where: { id: req.userId },
        select: { name: true },
      });
      if (userRecord?.name) {
        userName = userRecord.name;
      }
    }

    const log = await prisma.auditLog.create({
      data: {
        tenantId,
        userId: req.userId,
        action: String(action).slice(0, 50),
        entity: String(entityType).slice(0, 50),
        entityId: entityId ? String(entityId).slice(0, 100) : 'system',
        before: oldValue ? { oldValue } : undefined,
        after: {
          details: details ? String(details).slice(0, 500) : '',
          userName,
          userRole,
          oldValue: oldValue || null,
          newValue: newValue || null,
        },
        ip: req.ip,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        id: log.id,
        timestamp: log.createdAt.toISOString(),
        userName,
        userRole,
        action: log.action,
        entityType: log.entity,
        entityId: log.entityId,
        details: details || '',
        oldValue,
        newValue,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
