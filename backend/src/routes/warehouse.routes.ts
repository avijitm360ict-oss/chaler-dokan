import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { AuthenticatedRequest } from '../middleware/tenant';

const router = Router();

// GET /api/v1/warehouses
router.get('/', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const tenantId = req.tenantId!;
    const warehouses = await prisma.warehouse.findMany({
      where: { tenantId, status: 'active' },
      include: {
        balances: {
          include: {
            product: true,
          },
        },
      },
    });

    const formatted = warehouses.map((wh: any) => {
      const totalKg = wh.balances.reduce((sum: number, b: any) => sum + Number(b.qtyKg), 0);
      return {
        id: wh.id,
        name: wh.name,
        nameBn: wh.name,
        nameEn: wh.name,
        location: wh.address || '',
        address: wh.address,
        isDefault: wh.isDefault,
        totalStockKg: totalKg,
        totalBags50: Math.floor(totalKg / 50),
        stocks: wh.balances.map((b: any) => ({
          productId: b.productId,
          productNameBn: b.product.nameBn,
          variety: b.product.variety,
          stockKg: Number(b.qtyKg),
          bags50: Math.floor(Number(b.qtyKg) / 50),
          avgCostPaisa: Number(b.avgCostPaisa),
        })),
      };
    });

    res.json({
      success: true,
      data: formatted,
      warehouses: formatted,
    });
  } catch (err) {
    next(err);
  }
});

const warehouseSchema = z.object({
  name: z.string().min(2, 'গোডাউনের নাম দিন'),
  address: z.string().optional(),
  isDefault: z.boolean().default(false),
});

// POST /api/v1/warehouses
router.post('/', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const tenantId = req.tenantId!;
    const data = warehouseSchema.parse(req.body);

    const warehouse = await prisma.warehouse.create({
      data: {
        tenantId,
        name: data.name,
        address: data.address,
        isDefault: data.isDefault,
      },
    });

    res.status(201).json({ message: 'গোডাউন সফলভাবে তৈরি হয়েছে', warehouse });
  } catch (err) {
    next(err);
  }
});

export default router;
