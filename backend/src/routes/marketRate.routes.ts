import { Router, Response } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { AuthenticatedRequest } from '../middleware/tenant';

const router = Router();

// GET /api/v1/market-rates
router.get('/', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const tenantId = req.tenantId!;
    const products = await prisma.product.findMany({
      where: { tenantId, status: 'active' },
      include: {
        units: true,
        prices: {
          orderBy: { effectiveFrom: 'desc' },
        },
      },
    });

    const rateBoard = products.map((prod: any) => {
      const bag50Unit = prod.units.find((u: any) => Number(u.kgPerUnit) === 50);
      const bagPrices = prod.prices.filter(
        (p: any) => p.unitId === bag50Unit?.id && p.priceType === 'wholesale'
      );

      const currentPricePaisa = bagPrices[0] ? Number(bagPrices[0].pricePaisa) : 0;
      const prevPricePaisa = bagPrices[1] ? Number(bagPrices[1].pricePaisa) : currentPricePaisa;
      const diffPaisa = currentPricePaisa - prevPricePaisa;

      return {
        productId: prod.id,
        productNameBn: prod.nameBn,
        productNameEn: prod.nameEn,
        variety: prod.variety,
        grade: prod.grade,
        unitNameBn: '৫০ কেজি বস্তা',
        currentRatePaisa: currentPricePaisa,
        prevRatePaisa: prevPricePaisa,
        diffPaisa,
        trend: diffPaisa > 0 ? 'up' : diffPaisa < 0 ? 'down' : 'flat',
        kgRatePaisa: Math.round(currentPricePaisa / 50),
        effectiveFrom: bagPrices[0]?.effectiveFrom || new Date(),
      };
    });

    res.json({ rates: rateBoard });
  } catch (err) {
    next(err);
  }
});

const bulkRateSchema = z.object({
  rates: z.array(
    z.object({
      productId: z.string(),
      newRateBag50Paisa: z.number(),
    })
  ),
});

// POST /api/v1/market-rates/bulk
router.post('/bulk', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const tenantId = req.tenantId!;
    const { rates } = bulkRateSchema.parse(req.body);

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      for (const item of rates) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          include: { units: true },
        });
        if (!product) continue;

        const bag50Unit = product.units.find((u: any) => Number(u.kgPerUnit) === 50);
        const kgUnit = product.units.find((u: any) => u.isBase);

        if (bag50Unit) {
          await tx.productPrice.create({
            data: {
              tenantId,
              productId: product.id,
              unitId: bag50Unit.id,
              priceType: 'wholesale',
              pricePaisa: BigInt(item.newRateBag50Paisa),
            },
          });
        }

        if (kgUnit) {
          const newKgPaisa = Math.round(item.newRateBag50Paisa / 50) + 200; // 2 tk margin for retail
          await tx.productPrice.create({
            data: {
              tenantId,
              productId: product.id,
              unitId: kgUnit.id,
              priceType: 'retail',
              pricePaisa: BigInt(newKgPaisa),
            },
          });
        }
      }
    });

    res.json({ message: 'দৈনিক বাজার দর সফলভাবে আপডেট করা হয়েছে' });
  } catch (err) {
    next(err);
  }
});

export default router;
