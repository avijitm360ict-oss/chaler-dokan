import { Router, Response } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { AuthenticatedRequest } from '../middleware/tenant';

const router = Router();

// GET /api/v1/products
router.get('/', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const tenantId = req.tenantId!;
    const products = await prisma.product.findMany({
      where: { tenantId, status: 'active' },
      include: {
        category: true,
        units: true,
        prices: {
          orderBy: { effectiveFrom: 'desc' },
        },
        balances: {
          include: { warehouse: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Format products for POS & Inventory consumption
    const formatted = products.map((prod: any) => {
      // Calculate total stock in KG
      const totalStockKg = prod.balances.reduce(
        (sum: number, b: any) => sum + Number(b.qtyKg),
        0
      );

      // Average cost across balances
      const totalCostValue = prod.balances.reduce(
        (sum: number, b: any) => sum + Number(b.qtyKg) * Number(b.avgCostPaisa),
        0
      );
      const overallAvgCostPerKgPaisa =
        totalStockKg > 0 ? Math.round(totalCostValue / totalStockKg) : 0;

      // Extract 50kg wholesale price & kg retail price
      const bag50Unit = prod.units.find((u: any) => Number(u.kgPerUnit) === 50);
      const kgUnit = prod.units.find((u: any) => u.isBase);

      const wholesalePriceObj = prod.prices.find(
        (p: any) => p.unitId === bag50Unit?.id && p.priceType === 'wholesale'
      );
      const retailPriceObj = prod.prices.find(
        (p: any) => p.unitId === kgUnit?.id && p.priceType === 'retail'
      );

      return {
        id: prod.id,
        nameBn: prod.nameBn,
        nameEn: prod.nameEn,
        variety: prod.variety,
        grade: prod.grade,
        sku: prod.sku,
        category: prod.category?.nameBn,
        minStockKg: Number(prod.minStockKg),
        totalStockKg,
        totalBags50: Math.floor(totalStockKg / 50),
        looseKg: totalStockKg % 50,
        avgCostPerKgPaisa: overallAvgCostPerKgPaisa,
        wholesaleBag50Paisa: wholesalePriceObj
          ? Number(wholesalePriceObj.pricePaisa)
          : 0,
        retailKgPaisa: retailPriceObj
          ? Number(retailPriceObj.pricePaisa)
          : 0,
        units: prod.units.map((u: any) => ({
          id: u.id,
          nameBn: u.nameBn,
          nameEn: u.nameEn,
          kgPerUnit: Number(u.kgPerUnit),
          isBase: u.isBase,
          isDefaultSale: u.isDefaultSale,
        })),
        warehouseBalances: prod.balances.map((b: any) => ({
          warehouseId: b.warehouseId,
          warehouseName: b.warehouse.name,
          stockKg: Number(b.qtyKg),
          bags50: Math.floor(Number(b.qtyKg) / 50),
          avgCostPaisa: Number(b.avgCostPaisa),
        })),
      };
    });

    res.json({ products: formatted });
  } catch (err) {
    next(err);
  }
});

const createProductSchema = z.object({
  nameBn: z.string().min(2, 'চালের নাম বাংলায় লিখুন'),
  nameEn: z.string().optional(),
  variety: z.string().optional(),
  grade: z.string().optional(),
  minStockKg: z.number().default(100),
  wholesaleBag50Paisa: z.number(),
  retailKgPaisa: z.number(),
  initialStockKg: z.number().default(0),
  warehouseId: z.string().optional(),
});

// POST /api/v1/products
router.post('/', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const tenantId = req.tenantId!;
    const data = createProductSchema.parse(req.body);

    const defaultWh = data.warehouseId
      ? { id: data.warehouseId }
      : await prisma.warehouse.findFirst({
          where: { tenantId, isDefault: true },
        });

    const product = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const prod = await tx.product.create({
        data: {
          tenantId,
          nameBn: data.nameBn,
          nameEn: data.nameEn || data.nameBn,
          variety: data.variety,
          grade: data.grade,
          minStockKg: data.minStockKg,
          status: 'active',
        },
      });

      // Units: KG (Base) and 50kg bag
      const kgUnit = await tx.productUnit.create({
        data: {
          tenantId,
          productId: prod.id,
          nameBn: 'কেজি (KG)',
          nameEn: 'kg',
          kgPerUnit: 1.0,
          isBase: true,
          isDefaultSale: false,
        },
      });

      const bag50Unit = await tx.productUnit.create({
        data: {
          tenantId,
          productId: prod.id,
          nameBn: '৫০ কেজি বস্তা',
          nameEn: '50kg Bag',
          kgPerUnit: 50.0,
          isBase: false,
          isDefaultSale: true,
        },
      });

      // Prices
      await tx.productPrice.create({
        data: {
          tenantId,
          productId: prod.id,
          unitId: bag50Unit.id,
          priceType: 'wholesale',
          pricePaisa: BigInt(data.wholesaleBag50Paisa),
        },
      });

      await tx.productPrice.create({
        data: {
          tenantId,
          productId: prod.id,
          unitId: kgUnit.id,
          priceType: 'retail',
          pricePaisa: BigInt(data.retailKgPaisa),
        },
      });

      // Initial Stock Balance
      if (defaultWh) {
        await tx.stockBalance.create({
          data: {
            tenantId,
            productId: prod.id,
            warehouseId: defaultWh.id,
            qtyKg: data.initialStockKg,
            avgCostPaisa: BigInt(Math.round(data.wholesaleBag50Paisa / 50)),
          },
        });

        if (data.initialStockKg > 0) {
          await tx.stockMovement.create({
            data: {
              tenantId,
              productId: prod.id,
              warehouseId: defaultWh.id,
              qtyKg: data.initialStockKg,
              unitCostPaisa: BigInt(Math.round(data.wholesaleBag50Paisa / 50)),
              movementType: 'opening',
              reason: 'নতুন চাল যুক্ত ও প্রাথমিক স্টক',
            },
          });
        }
      }

      return prod;
    });

    res.status(201).json({ message: 'চাল সফলভাবে যুক্ত হয়েছে', product });
  } catch (err) {
    next(err);
  }
});

export default router;
