import { Router, Response } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { AuthenticatedRequest } from '../middleware/tenant';
import { getNextDocNo } from '../utils/docSequence';

const router = Router();

const purchaseExpenseSchema = z.object({
  expenseType: z.enum(['transport', 'labour', 'unloading', 'other']),
  amountPaisa: z.number().min(0),
  allocationMethod: z.enum(['weight', 'value']).default('weight'),
});

const purchaseItemSchema = z.object({
  productId: z.string(),
  unitId: z.string(),
  qtyUnit: z.number().positive('পরিমাণ অবশ্যই ০ এর বেশি হতে হবে'),
  unitPricePaisa: z.number().positive('দর অবশ্যই ০ এর বেশি হতে হবে'),
});

const createPurchaseSchema = z.object({
  vendorId: z.string(),
  warehouseId: z.string(),
  vendorBillNo: z.string().optional(),
  note: z.string().optional(),
  items: z.array(purchaseItemSchema).min(1, 'কমপক্ষে একটি চালের আইটেম যোগ করুন'),
  expenses: z.array(purchaseExpenseSchema).default([]),
  paidTotalPaisa: z.number().default(0),
});

// POST /api/v1/purchases - Create purchase with Landed Cost & WAC recalculation
router.post('/', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const tenantId = req.tenantId!;
    const data = createPurchaseSchema.parse(req.body);

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Generate Doc No: PUR-YYYY-xxxxx
      const docNo = await getNextDocNo(tx, tenantId, 'purchase', 'PUR');

      // 2. Resolve items with units and calculate total KG
      let subtotalPaisa = 0;
      let totalPurchaseKg = 0;

      const preparedItems = [];
      for (const item of data.items) {
        const unit = await tx.productUnit.findUnique({
          where: { id: item.unitId },
        });
        if (!unit) {
          throw new Error(`Unit ID ${item.unitId} পাওয়া যায়নি`);
        }

        const kgPerUnit = Number(unit.kgPerUnit);
        const qtyKg = item.qtyUnit * kgPerUnit;
        const lineTotalPaisa = Math.round(item.qtyUnit * item.unitPricePaisa);

        subtotalPaisa += lineTotalPaisa;
        totalPurchaseKg += qtyKg;

        preparedItems.push({
          productId: item.productId,
          unitId: item.unitId,
          qtyUnit: item.qtyUnit,
          qtyKg,
          unitPricePaisa: item.unitPricePaisa,
          lineTotalPaisa,
        });
      }

      // 3. Calculate Extra Expenses (Landed Cost components)
      const totalExtraCostPaisa = data.expenses.reduce(
        (sum: number, e: any) => sum + e.amountPaisa,
        0
      );
      const grandTotalPaisa = subtotalPaisa + totalExtraCostPaisa;

      // 4. Allocate Extra Expenses proportionally to calculate Landed Cost Per KG
      const finalItems = preparedItems.map((item: any) => {
        let allocatedExtraPaisa = 0;
        if (totalPurchaseKg > 0 && totalExtraCostPaisa > 0) {
          // Weight-based allocation (standard for rice wholesale)
          allocatedExtraPaisa = Math.round(
            (item.qtyKg / totalPurchaseKg) * totalExtraCostPaisa
          );
        }

        const itemTotalLandedPaisa = item.lineTotalPaisa + allocatedExtraPaisa;
        const landedUnitCostPerKg =
          item.qtyKg > 0 ? Math.round(itemTotalLandedPaisa / item.qtyKg) : 0;

        return {
          ...item,
          allocatedExtraPaisa,
          landedUnitCostPerKg,
        };
      });

      // 5. Create Purchase record
      const purchase = await tx.purchase.create({
        data: {
          tenantId,
          docNo,
          vendorId: data.vendorId,
          warehouseId: data.warehouseId,
          status: 'confirmed',
          subtotalPaisa: BigInt(subtotalPaisa),
          extraCostPaisa: BigInt(totalExtraCostPaisa),
          grandTotalPaisa: BigInt(grandTotalPaisa),
          paidTotalPaisa: BigInt(data.paidTotalPaisa),
          vendorBillNo: data.vendorBillNo,
          note: data.note,
          items: {
            create: finalItems.map((it: any) => ({
              tenantId,
              productId: it.productId,
              unitId: it.unitId,
              qtyUnit: it.qtyUnit,
              qtyKg: it.qtyKg,
              unitPricePaisa: BigInt(it.unitPricePaisa),
              lineTotalPaisa: BigInt(it.lineTotalPaisa),
              allocatedExtraPaisa: BigInt(it.allocatedExtraPaisa),
              landedUnitCostPerKg: BigInt(it.landedUnitCostPerKg),
            })),
          },
          expenses: {
            create: data.expenses.map((e: any) => ({
              tenantId,
              expenseType: e.expenseType,
              amountPaisa: BigInt(e.amountPaisa),
              allocationMethod: e.allocationMethod,
            })),
          },
        },
        include: {
          items: true,
          expenses: true,
          vendor: true,
        },
      });

      // 6. Update Stock Balances and recalculate WAC for each product in that warehouse
      for (const item of finalItems) {
        const existingBalance = await tx.stockBalance.findUnique({
          where: {
            tenantId_productId_warehouseId: {
              tenantId,
              productId: item.productId,
              warehouseId: data.warehouseId,
            },
          },
        });

        const currentQtyKg = existingBalance ? Number(existingBalance.qtyKg) : 0;
        const currentAvgCostPaisa = existingBalance
          ? Number(existingBalance.avgCostPaisa)
          : 0;

        const newQtyKg = currentQtyKg + item.qtyKg;
        let newWacPaisa = item.landedUnitCostPerKg;

        if (currentQtyKg > 0 && newQtyKg > 0) {
          // Weighted Average Cost formula:
          // WAC = ((currentQty * currentWac) + (newQty * landedCost)) / totalQty
          const totalValuation =
            currentQtyKg * currentAvgCostPaisa + item.qtyKg * item.landedUnitCostPerKg;
          newWacPaisa = Math.round(totalValuation / newQtyKg);
        }

        await tx.stockBalance.upsert({
          where: {
            tenantId_productId_warehouseId: {
              tenantId,
              productId: item.productId,
              warehouseId: data.warehouseId,
            },
          },
          update: {
            qtyKg: newQtyKg,
            avgCostPaisa: BigInt(newWacPaisa),
          },
          create: {
            tenantId,
            productId: item.productId,
            warehouseId: data.warehouseId,
            qtyKg: newQtyKg,
            avgCostPaisa: BigInt(newWacPaisa),
          },
        });

        // Log Stock Movement
        await tx.stockMovement.create({
          data: {
            tenantId,
            productId: item.productId,
            warehouseId: data.warehouseId,
            qtyKg: item.qtyKg,
            unitCostPaisa: BigInt(item.landedUnitCostPerKg),
            movementType: 'purchase',
            refType: 'purchase',
            refId: purchase.id,
            reason: `চালান ক্রয়: ${docNo} (সাপ্লায়ার: ${purchase.vendor.name})`,
          },
        });
      }

      // 7. Update Vendor Balance & Ledger Entry
      const dueToVendorPaisa = grandTotalPaisa - data.paidTotalPaisa;
      if (dueToVendorPaisa > 0) {
        const vendor = await tx.party.findUnique({
          where: { id: data.vendorId },
        });
        const currentBal = vendor ? Number(vendor.openingBalance) : 0;
        // In party balance: negative = payable (we owe vendor)
        const updatedBal = currentBal - dueToVendorPaisa;

        await tx.party.update({
          where: { id: data.vendorId },
          data: { openingBalance: BigInt(updatedBal) },
        });

        await tx.partyLedger.create({
          data: {
            tenantId,
            partyId: data.vendorId,
            entryType: 'purchase',
            refType: 'purchase',
            refId: purchase.id,
            debitPaisa: BigInt(0),
            creditPaisa: BigInt(dueToVendorPaisa), // We owe credit
            runningBalance: BigInt(updatedBal),
          },
        });
      }

      return purchase;
    });

    res.status(201).json({
      message: 'চালান সফলভাবে এন্ট্রি হয়েছে ও WAC পুনর্গণনা সম্পন্ন হয়েছে',
      purchase: result,
    });
  } catch (err) {
    next(err);
  }
});


// GET /api/v1/purchases - List all purchases
router.get('/', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const tenantId = req.tenantId!;
    const purchases = await prisma.purchase.findMany({
      where: { tenantId },
      include: {
        vendor: true,
        items: true,
        expenses: true,
      },
      orderBy: { purchaseDate: 'desc' },
      take: 50,
    });

    const productIds = Array.from(new Set(purchases.flatMap((p) => p.items.map((it) => it.productId))));
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { units: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    const formatted = purchases.map((pur: any) => {
      const truckExpense = pur.expenses.find((e: any) => e.expenseType === 'transport');
      const labourExpense = pur.expenses.find((e: any) => e.expenseType === 'labour');
      const otherExpenses = pur.expenses
        .filter((e: any) => e.expenseType !== 'transport' && e.expenseType !== 'labour')
        .reduce((sum: number, e: any) => sum + Number(e.amountPaisa), 0);

      const items = pur.items.map((it: any) => {
        const prod = productMap.get(it.productId);
        const unit = prod?.units.find((u: any) => u.id === it.unitId) || {
          id: it.unitId,
          nameBn: '৫০ কেজি বস্তা',
          nameEn: '50kg bag',
          kgPerUnit: 50,
          isBase: false,
        };

        return {
          product: {
            id: prod?.id || it.productId,
            nameBn: prod?.nameBn || 'চাল',
            nameEn: prod?.nameEn || '',
            variety: prod?.variety || '',
            grade: prod?.grade || '',
            category: '',
            sku: prod?.sku || '',
            stockKg: 0,
            minStockKg: 0,
            wacPerKgPaisa: Number(it.landedUnitCostPerKg),
            retailPricePaisa: 0,
            wholesalePricePaisa: 0,
            sack50RetailPricePaisa: 0,
            sack50WholesalePricePaisa: 0,
            availableUnits: prod?.units || [],
          },
          unit: {
            id: unit.id,
            nameBn: unit.nameBn,
            nameEn: unit.nameEn,
            kgPerUnit: Number(unit.kgPerUnit),
            isBase: unit.isBase,
          },
          unitQuantity: Number(it.qtyUnit),
          totalKg: Number(it.qtyKg),
          rawPricePerKgPaisa: Number(it.unitPricePaisa),
          truckFareAllocatedPaisa: Math.round(Number(it.allocatedExtraPaisa) * 0.7),
          labourFareAllocatedPaisa: Math.round(Number(it.allocatedExtraPaisa) * 0.3),
          landedCostPerKgPaisa: Number(it.landedUnitCostPerKg),
          lineTotalPaisa: Number(it.lineTotalPaisa),
        };
      });

      const grandTotal = Number(pur.grandTotalPaisa);
      const paidAmount = Number(pur.paidTotalPaisa);
      const dueAmount = Math.max(0, grandTotal - paidAmount);

      return {
        id: pur.id,
        docNo: pur.docNo,
        date: pur.purchaseDate.toISOString(),
        vendorName: pur.vendor?.name || 'মিলার / মোকাম',
        vendorPhone: pur.vendor?.phone || '',
        warehouseId: pur.warehouseId,
        vendorBillNo: pur.vendorBillNo || '',
        items,
        subtotalPaisa: Number(pur.subtotalPaisa),
        truckFarePaisa: truckExpense ? Number(truckExpense.amountPaisa) : 0,
        labourFarePaisa: labourExpense ? Number(labourExpense.amountPaisa) : 0,
        otherExpensesPaisa: otherExpenses,
        grandTotalPaisa: grandTotal,
        paidAmountPaisa: paidAmount,
        dueAmountPaisa: dueAmount,
        status: pur.status,
      };
    });

    res.json({
      success: true,
      data: formatted,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/purchases/:id - Single purchase details
router.get('/:id', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const tenantId = req.tenantId!;
    const purchaseId = req.params.id as string;
    const purchase = await prisma.purchase.findFirst({
      where: { id: purchaseId, tenantId },
      include: {
        vendor: true,
        items: true,
        expenses: true,
      },
    });

    if (!purchase) {
      return res.status(404).json({ error: 'Purchase not found', message: 'চালানের তথ্য পাওয়া যায়নি' });
    }

    res.json({ purchase });
  } catch (err) {
    next(err);
  }
});

export default router;
