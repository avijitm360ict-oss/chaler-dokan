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
        stockKg: totalStockKg,
        totalStockKg,
        minStockKg: Number(prod.minStockKg),
        totalBags50: Math.floor(totalStockKg / 50),
        looseKg: totalStockKg % 50,
        wacPerKgPaisa: overallAvgCostPerKgPaisa,
        avgCostPerKgPaisa: overallAvgCostPerKgPaisa,
        retailPricePaisa: retailPriceObj ? Number(retailPriceObj.pricePaisa) : 0,
        retailKgPaisa: retailPriceObj ? Number(retailPriceObj.pricePaisa) : 0,
        wholesalePricePaisa: wholesalePriceObj ? Math.round(Number(wholesalePriceObj.pricePaisa) / 50) : 0,
        sack50WholesalePricePaisa: wholesalePriceObj ? Number(wholesalePriceObj.pricePaisa) : 0,
        sack50RetailPricePaisa: wholesalePriceObj ? Math.round(Number(wholesalePriceObj.pricePaisa) * 1.05) : 0,
        wholesaleBag50Paisa: wholesalePriceObj ? Number(wholesalePriceObj.pricePaisa) : 0,
        availableUnits: prod.units.map((u: any) => ({
          id: u.id,
          nameBn: u.nameBn,
          nameEn: u.nameEn,
          kgPerUnit: Number(u.kgPerUnit),
          isBase: u.isBase,
          isDefaultSale: u.isDefaultSale,
        })),
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

    res.json({
      success: true,
      data: formatted,
      products: formatted,
    });
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
  wholesaleBag50Paisa: z.number().optional(),
  wholesalePricePaisa: z.number().optional(),
  retailKgPaisa: z.number().optional(),
  retailPricePaisa: z.number().optional(),
  wacPerKgPaisa: z.number().optional(),
  initialStockKg: z.number().default(0),
  warehouseId: z.string().optional(),
});

// POST /api/v1/products
router.post('/', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const tenantId = req.tenantId!;
    const data = createProductSchema.parse(req.body);

    const wholesaleBag50 =
      data.wholesaleBag50Paisa ||
      (data.wholesalePricePaisa
        ? data.wholesalePricePaisa > 5000
          ? data.wholesalePricePaisa
          : data.wholesalePricePaisa * 50
        : 360000);

    const retailKg =
      data.retailKgPaisa ||
      (data.retailPricePaisa
        ? data.retailPricePaisa < 5000
          ? data.retailPricePaisa
          : Math.round(data.retailPricePaisa / 50)
        : 7500);

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
          pricePaisa: BigInt(wholesaleBag50),
        },
      });

      await tx.productPrice.create({
        data: {
          tenantId,
          productId: prod.id,
          unitId: kgUnit.id,
          priceType: 'retail',
          pricePaisa: BigInt(retailKg),
        },
      });

      // Initial Stock Balance
      if (defaultWh) {
        const costPerKg = data.wacPerKgPaisa || Math.round(wholesaleBag50 / 50);
        await tx.stockBalance.create({
          data: {
            tenantId,
            productId: prod.id,
            warehouseId: defaultWh.id,
            qtyKg: data.initialStockKg,
            avgCostPaisa: BigInt(costPerKg),
          },
        });

        if (data.initialStockKg > 0) {
          await tx.stockMovement.create({
            data: {
              tenantId,
              productId: prod.id,
              warehouseId: defaultWh.id,
              qtyKg: data.initialStockKg,
              unitCostPaisa: BigInt(costPerKg),
              movementType: 'opening',
              reason: 'নতুন চাল যুক্ত ও প্রাথমিক স্টক',
            },
          });
        }
      }

      return prod;
    });

    res.status(201).json({
      success: true,
      message: 'চাল সফলভাবে যুক্ত হয়েছে',
      product,
      data: product,
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/products/:id - Update rice product details
router.put('/:id', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const tenantId = req.tenantId!;
    const productId = req.params.id as string;
    const { nameBn, nameEn, variety, grade, minStockKg, status } = req.body;

    // Verify product belongs to current tenant (Prevent BOLA/IDOR)
    const existing = await prisma.product.findFirst({
      where: { id: productId, tenantId },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Product not found', message: 'চাল পাওয়া যায়নি' });
    }

    const updated = await prisma.product.update({
      where: { id: existing.id },
      data: {
        ...(nameBn && { nameBn }),
        ...(nameEn && { nameEn }),
        ...(variety && { variety }),
        ...(grade && { grade }),
        ...(typeof minStockKg === 'number' && { minStockKg }),
        ...(status && { status }),
      },
    });

    res.json({
      success: true,
      message: 'চালের বিবরণ সফলভাবে আপডেট হয়েছে',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/products/:id - Archive product safely
router.delete('/:id', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const tenantId = req.tenantId!;
    const productId = req.params.id as string;

    // Verify product belongs to current tenant
    const existing = await prisma.product.findFirst({
      where: { id: productId, tenantId },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Product not found', message: 'চাল পাওয়া যায়নি' });
    }

    await prisma.product.update({
      where: { id: existing.id },
      data: { status: 'inactive' },
    });

    res.json({
      success: true,
      message: 'চাল সফলভাবে আর্কাইভ করা হয়েছে',
    });
  } catch (err) {
    next(err);
  }
});

export default router;
