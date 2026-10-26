import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthenticatedRequest } from '../middleware/tenant';

const router = Router();

// GET /api/v1/audit-logs - List audit trail logs for tenant
router.get('/', async (req: AuthenticatedRequest, res: Response, next) => {
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

// POST /api/v1/audit-logs - Create new audit log
router.post('/', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const tenantId = req.tenantId!;
    const {
      action,
      entityType,
      entityId,
      details,
      userName,
      userRole,
      oldValue,
      newValue,
    } = req.body;

    if (!action || !entityType) {
      return res.status(400).json({ error: 'Missing required audit fields' });
    }

    const log = await prisma.auditLog.create({
      data: {
        tenantId,
        action,
        entity: entityType,
        entityId: entityId || 'system',
        before: oldValue ? { oldValue } : undefined,
        after: {
          details: details || '',
          userName: userName || 'ম্যানেজার',
          userRole: userRole || 'owner',
          oldValue: oldValue || null,
          newValue: newValue || null,
        },
      },
    });

    res.status(201).json({
      success: true,
      data: {
        id: log.id,
        timestamp: log.createdAt.toISOString(),
        userName: userName || 'ম্যানেজার',
        userRole: userRole || 'owner',
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
