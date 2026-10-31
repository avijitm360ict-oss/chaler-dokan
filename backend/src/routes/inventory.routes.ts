import { Router, Response } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { AuthenticatedRequest } from '../middleware/tenant';
import { requireRole } from '../middleware/auth';
import { getNextDocNo } from '../utils/docSequence';

const router = Router();

const transferSchema = z.object({
  fromWarehouseId: z.string(),
  toWarehouseId: z.string(),
  productId: z.string(),
  qtyKg: z.number().positive('স্থানান্তরের পরিমাণ ০ এর বেশি হতে হবে'),
  note: z.string().optional(),
});

// POST /api/v1/inventory/transfer - Transfer rice between warehouses
router.post('/transfer', requireRole(['Owner', 'Manager', 'Super Admin']), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const tenantId = req.tenantId!;
    const data = transferSchema.parse(req.body);

    if (data.fromWarehouseId === data.toWarehouseId) {
      return res.status(400).json({
        error: 'Invalid Warehouse',
        message: 'একই গোডাউনের মধ্যে স্থানান্তর সম্ভব নয়',
      });
    }

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Validate both warehouses belong to tenant
      const [fromWh, toWh] = await Promise.all([
        tx.warehouse.findFirst({ where: { id: data.fromWarehouseId, tenantId } }),
        tx.warehouse.findFirst({ where: { id: data.toWarehouseId, tenantId } }),
      ]);

      if (!fromWh || !toWh) {
        throw new Error('স্থানান্তরের জন্য নির্বাচিত গোডাউন পাওয়া যায়নি');
      }

      const sourceBalance = await tx.stockBalance.findUnique({
        where: {
          tenantId_productId_warehouseId: {
            tenantId,
            productId: data.productId,
            warehouseId: data.fromWarehouseId,
          },
        },
      });

      const currentStockKg = sourceBalance ? Number(sourceBalance.qtyKg) : 0;
      if (currentStockKg < data.qtyKg) {
        throw new Error(
          `উৎস গোডাউনে পর্যাপ্ত চাল নেই (মজুদ: ${currentStockKg} কেজি, স্থানান্তর: ${data.qtyKg} কেজি)`
        );
      }

      const transferDocNo = await getNextDocNo(tx, tenantId, 'transfer', 'TRF');
      const unitCostPaisa = sourceBalance ? Number(sourceBalance.avgCostPaisa) : 0;

      // 1. Deduct from Source Warehouse
      await tx.stockBalance.update({
        where: {
          tenantId_productId_warehouseId: {
            tenantId,
            productId: data.productId,
            warehouseId: data.fromWarehouseId,
          },
        },
        data: { qtyKg: { decrement: data.qtyKg } },
      });

      await tx.stockMovement.create({
        data: {
          tenantId,
          productId: data.productId,
          warehouseId: data.fromWarehouseId,
          qtyKg: -data.qtyKg,
          unitCostPaisa: BigInt(unitCostPaisa),
          movementType: 'transfer_out',
          refType: 'transfer',
          refId: transferDocNo,
          reason: `গোডাউন স্থানান্তর #${transferDocNo} (প্রেরক)`,
        },
      });

      // 2. Add to Destination Warehouse with WAC
      const destBalance = await tx.stockBalance.findUnique({
        where: {
          tenantId_productId_warehouseId: {
            tenantId,
            productId: data.productId,
            warehouseId: data.toWarehouseId,
          },
        },
      });

      const destCurrentKg = destBalance ? Number(destBalance.qtyKg) : 0;
      const destCurrentAvgCost = destBalance ? Number(destBalance.avgCostPaisa) : 0;
      const destNewKg = destCurrentKg + data.qtyKg;

      let destNewWac = unitCostPaisa;
      if (destCurrentKg > 0 && destNewKg > 0) {
        destNewWac = Math.round(
          (destCurrentKg * destCurrentAvgCost + data.qtyKg * unitCostPaisa) / destNewKg
        );
      }

      await tx.stockBalance.upsert({
        where: {
          tenantId_productId_warehouseId: {
            tenantId,
            productId: data.productId,
            warehouseId: data.toWarehouseId,
          },
        },
        update: {
          qtyKg: destNewKg,
          avgCostPaisa: BigInt(destNewWac),
        },
        create: {
          tenantId,
          productId: data.productId,
          warehouseId: data.toWarehouseId,
          qtyKg: destNewKg,
          avgCostPaisa: BigInt(destNewWac),
        },
      });

      await tx.stockMovement.create({
        data: {
          tenantId,
          productId: data.productId,
          warehouseId: data.toWarehouseId,
          qtyKg: data.qtyKg,
          unitCostPaisa: BigInt(unitCostPaisa),
          movementType: 'transfer_in',
          refType: 'transfer',
          refId: transferDocNo,
          reason: `গোডাউন স্থানান্তর #${transferDocNo} (প্রাপক)`,
        },
      });

      return { transferDocNo, qtyKg: data.qtyKg };
    });

    res.status(201).json({
      success: true,
      data: result,
      message: 'চাল এক গোডাউন থেকে অন্য গোডাউনে সফলভাবে স্থানান্তর হয়েছে',
      result,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/inventory/timeline/:productId - Chronological Stock Card Timeline
router.get('/timeline/:productId', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const tenantId = req.tenantId!;
    const productId = req.params.productId as string;

    const product = await prisma.product.findFirst({
      where: { id: productId, tenantId },
      include: { units: true },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found', message: 'চাল পাওয়া যায়নি' });
    }

    const movements = await prisma.stockMovement.findMany({
      where: { tenantId, productId },
      include: { warehouse: true },
      orderBy: { occurredAt: 'asc' },
    });

    // Compute running balance
    let runningBalanceKg = 0;
    const timeline = movements.map((m: any) => {
      const changeKg = Number(m.qtyKg);
      runningBalanceKg += changeKg;

      return {
        id: m.id,
        date: m.occurredAt,
        warehouseName: m.warehouse?.name || 'প্রধান গোডাউন',
        movementType: m.movementType,
        changeKg,
        changeBags50: Math.round((changeKg / 50) * 100) / 100,
        runningBalanceKg,
        runningBalanceBags50: Math.floor(runningBalanceKg / 50),
        runningBalanceLooseKg: runningBalanceKg % 50,
        unitCostPaisa: Number(m.unitCostPaisa),
        reason: m.reason,
      };
    });

    const responsePayload = {
      product: {
        id: product.id,
        nameBn: product.nameBn,
        variety: product.variety,
        grade: product.grade,
      },
      currentStockKg: runningBalanceKg,
      currentStockBags50: Math.floor(runningBalanceKg / 50),
      timeline: timeline.reverse(), // Newest on top
    };

    res.json({
      success: true,
      data: responsePayload,
      ...responsePayload,
    });
  } catch (err) {
    next(err);
  }
});

const adjustSchema = z.object({
  productId: z.string().min(1, 'চাল নির্বাচন করুন'),
  warehouseId: z.string().min(1, 'গোডাউন নির্বাচন করুন'),
  adjustmentKg: z.number().refine((val) => val !== 0, 'সমন্বয়ের পরিমাণ ০ হতে পারে না'),
  reason: z.string().optional(),
});

// POST /api/v1/inventory/adjust - Stock Adjustment (Drying loss / Shortage / Surplus)
router.post('/adjust', requireRole(['Owner', 'Manager', 'Super Admin']), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const tenantId = req.tenantId!;
    const { productId, warehouseId, adjustmentKg, reason } = adjustSchema.parse(req.body);

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Verify product and warehouse belong to tenant
      const [product, warehouse] = await Promise.all([
        tx.product.findFirst({ where: { id: productId, tenantId } }),
        tx.warehouse.findFirst({ where: { id: warehouseId, tenantId } }),
      ]);

      if (!product || !warehouse) {
        throw new Error('সমন্বয়ের জন্য নির্বাচিত চাল বা গোডাউন পাওয়া যায়নি');
      }

      const stock = await tx.stockBalance.findUnique({
        where: {
          tenantId_productId_warehouseId: {
            tenantId,
            productId,
            warehouseId,
          },
        },
      });

      const currentKg = stock ? Number(stock.qtyKg) : 0;
      const newKg = currentKg + Number(adjustmentKg);
      if (newKg < 0) throw new Error('সমন্বয়ের ফলে স্টক ঋণাত্মক হতে পারে না');

      await tx.stockBalance.update({
        where: {
          tenantId_productId_warehouseId: {
            tenantId,
            productId,
            warehouseId,
          },
        },
        data: { qtyKg: newKg },
      });

      await tx.stockMovement.create({
        data: {
          tenantId,
          productId,
          warehouseId,
          qtyKg: Number(adjustmentKg),
          unitCostPaisa: stock?.avgCostPaisa || BigInt(0),
          movementType: 'adjustment',
          reason: reason || 'শারীরিক স্টক নিরীক্ষা ও সমন্বয়',
        },
      });

      return { newStockKg: newKg };
    });

    res.json({
      success: true,
      data: result,
      message: 'স্টক সফলভাবে সমন্বয় করা হয়েছে',
      result,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
