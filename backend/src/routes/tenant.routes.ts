import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthenticatedRequest } from '../middleware/tenant';

const router = Router();

// GET /api/v1/tenant/profile
router.get('/profile', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const tenantId = req.tenantId!;
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        plan: true,
        _count: {
          select: {
            users: true,
            products: true,
            warehouses: true,
            sales: true,
            parties: true,
          },
        },
      },
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found', message: 'দোকানের তথ্য পাওয়া যায়নি' });
    }

    res.json({ tenant });
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/tenant/profile
router.put('/profile', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const tenantId = req.tenantId!;
    const { name, ownerName, settings } = req.body;

    const updated = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ...(name && { name }),
        ...(ownerName && { ownerName }),
        ...(settings && { settings }),
      },
    });

    res.json({ message: 'দোকানের তথ্য সফলভাবে আপডেট হয়েছে', tenant: updated });
  } catch (err) {
    next(err);
  }
});

export default router;
