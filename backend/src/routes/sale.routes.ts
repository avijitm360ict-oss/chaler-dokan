import { Router, Response } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { AuthenticatedRequest } from '../middleware/tenant';
import { getNextDocNo } from '../utils/docSequence';

const router = Router();

const saleItemInputSchema = z.object({
  productId: z.string(),
  unitId: z.string(),
  qtyUnit: z.number().positive('পরিমাণ অবশ্যই ০ এর বেশি হতে হবে'),
  unitPricePaisa: z.number().positive('দর অবশ্যই ০ এর বেশি হতে হবে'),
  discountPaisa: z.number().default(0),
});

const paymentInputSchema = z.object({
  method: z.enum(['cash', 'bkash', 'nagad', 'bank_transfer', 'cheque']),
  amountPaisa: z.number().positive('পেমেন্ট অ্যামাউন্ট অবশ্যই ০ এর বেশি হতে হবে'),
  accountId: z.string().optional(),
});

const createSaleSchema = z.object({
  warehouseId: z.string(),
  clientId: z.string().optional(),
  clientName: z.string().optional(),
  discountPaisa: z.number().default(0),
  deliveryChargePaisa: z.number().default(0),
  items: z.array(saleItemInputSchema).min(1, 'কমপক্ষে একটি পণ্য কার্টে যোগ করুন'),
  payments: z.array(paymentInputSchema).default([]),
  note: z.string().optional(),
});

// POST /api/v1/sales - Quick POS Checkout
router.post('/', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const tenantId = req.tenantId!;
    const data = createSaleSchema.parse(req.body);

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Generate Invoice No: INV-YYYY-xxxxx
      const docNo = await getNextDocNo(tx, tenantId, 'invoice', 'INV');

      // 2. Prepare items, calculate weights and check stock
      let subtotalPaisa = 0;
      let totalItemDiscountPaisa = 0;
      const preparedItems = [];

      for (const item of data.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });
        if (!product) throw new Error(`চাল ID ${item.productId} পাওয়া যায়নি`);

        const unit = await tx.productUnit.findUnique({
          where: { id: item.unitId },
        });
        if (!unit) throw new Error(`প্যাকেজিং ইউনিট ID ${item.unitId} পাওয়া যায়নি`);

        const kgPerUnit = Number(unit.kgPerUnit);
        const qtyKg = item.qtyUnit * kgPerUnit;
        const lineTotalPaisa = Math.round(item.qtyUnit * item.unitPricePaisa) - item.discountPaisa;

        subtotalPaisa += lineTotalPaisa;
        totalItemDiscountPaisa += item.discountPaisa;

        // Check and fetch current stock & WAC cost snapshot
        const stock = await tx.stockBalance.findUnique({
          where: {
            tenantId_productId_warehouseId: {
              tenantId,
              productId: item.productId,
              warehouseId: data.warehouseId,
            },
          },
        });

        const currentStockKg = stock ? Number(stock.qtyKg) : 0;
        if (currentStockKg < qtyKg) {
          throw new Error(
            `স্টক অপর্যাপ্ত: ${product.nameBn}-এর বর্তমান স্টক ${currentStockKg} কেজি, বিক্রয় করতে চেয়েছেন ${qtyKg} কেজি`
          );
        }

        const costPerKgSnapshot = stock ? Number(stock.avgCostPaisa) : 0;

        preparedItems.push({
          productId: item.productId,
          unitId: item.unitId,
          productNameBn: product.nameBn,
          unitNameBn: unit.nameBn,
          qtyUnit: item.qtyUnit,
          qtyKg,
          unitPricePaisa: item.unitPricePaisa,
          discountPaisa: item.discountPaisa,
          lineTotalPaisa,
          costPerKgSnapshot,
        });
      }

      // 3. Compute Invoice Totals
      const totalDiscountPaisa = data.discountPaisa + totalItemDiscountPaisa;
      const grandTotalPaisa = subtotalPaisa - data.discountPaisa + data.deliveryChargePaisa;

      const paidTotalPaisa = data.payments.reduce((sum: number, p: any) => sum + p.amountPaisa, 0);
      const dueAmountPaisa = Math.max(0, grandTotalPaisa - paidTotalPaisa);

      // 4. Create Sale Record
      const sale = await tx.sale.create({
        data: {
          tenantId,
          docNo,
          clientId: data.clientId,
          warehouseId: data.warehouseId,
          channel: 'pos',
          status: 'confirmed',
          subtotalPaisa: BigInt(subtotalPaisa),
          discountPaisa: BigInt(totalDiscountPaisa),
          deliveryChargePaisa: BigInt(data.deliveryChargePaisa),
          grandTotalPaisa: BigInt(grandTotalPaisa),
          paidTotalPaisa: BigInt(paidTotalPaisa),
          dueAmountPaisa: BigInt(dueAmountPaisa),
          items: {
            create: preparedItems.map((it: any) => ({
              tenantId,
              productId: it.productId,
              unitId: it.unitId,
              qtyUnit: it.qtyUnit,
              qtyKg: it.qtyKg,
              unitPricePaisa: BigInt(it.unitPricePaisa),
              discountPaisa: BigInt(it.discountPaisa),
              lineTotalPaisa: BigInt(it.lineTotalPaisa),
              costPerKgSnapshot: BigInt(it.costPerKgSnapshot),
            })),
          },
        },
        include: {
          items: true,
          client: true,
        },
      });

      // 5. Deduct Stock & Record Movement for each item
      for (const item of preparedItems) {
        await tx.stockBalance.update({
          where: {
            tenantId_productId_warehouseId: {
              tenantId,
              productId: item.productId,
              warehouseId: data.warehouseId,
            },
          },
          data: {
            qtyKg: { decrement: item.qtyKg },
          },
        });

        await tx.stockMovement.create({
          data: {
            tenantId,
            productId: item.productId,
            warehouseId: data.warehouseId,
            qtyKg: -item.qtyKg, // Negative for sale out
            unitCostPaisa: BigInt(item.costPerKgSnapshot),
            movementType: 'sale',
            refType: 'sale',
            refId: sale.id,
            reason: `বিক্রয় চালান: ${docNo} (${item.qtyUnit} ${item.unitNameBn})`,
          },
        });
      }

      // 6. Handle Payments and Cash Account Update
      const defaultCashAcc = await tx.account.findFirst({
        where: { tenantId, type: 'cash', status: 'active' },
      });

      for (const pay of data.payments) {
        const payAccId = pay.accountId || defaultCashAcc?.id;
        if (payAccId) {
          const payDocNo = await getNextDocNo(tx, tenantId, 'payment', 'PAY');
          await tx.payment.create({
            data: {
              tenantId,
              docNo: payDocNo,
              direction: 'in',
              partyId: data.clientId,
              accountId: payAccId,
              amountPaisa: BigInt(pay.amountPaisa),
              method: pay.method,
              referenceNo: docNo,
              note: `চালান #${docNo} বিক্রয় বাবদ জমা`,
            },
          });

          await tx.account.update({
            where: { id: payAccId },
            data: { currentBalance: { increment: BigInt(pay.amountPaisa) } },
          });
        }
      }

      // 7. Update Client Party Ledger if there is due
      if (dueAmountPaisa > 0 && data.clientId) {
        const client = await tx.party.findUnique({
          where: { id: data.clientId },
        });
        const currentBal = client ? Number(client.openingBalance) : 0;
        // In party balance: positive = receivable (client owes us)
        const updatedBal = currentBal + dueAmountPaisa;

        await tx.party.update({
          where: { id: data.clientId },
          data: { openingBalance: BigInt(updatedBal) },
        });

        await tx.partyLedger.create({
          data: {
            tenantId,
            partyId: data.clientId,
            entryType: 'sale',
            refType: 'sale',
            refId: sale.id,
            debitPaisa: BigInt(dueAmountPaisa), // Client debited with due
            creditPaisa: BigInt(0),
            runningBalance: BigInt(updatedBal),
          },
        });
      }

      return sale;
    });

    res.status(201).json({
      message: 'বিক্রয় চালান সফলভাবে সম্পন্ন হয়েছে',
      sale: result,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/sales - List sales invoices
router.get('/', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const tenantId = req.tenantId!;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 50);

    const sales = await prisma.sale.findMany({
      where: { tenantId },
      include: {
        client: true,
        items: true,
      },
      orderBy: { saleDate: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const productIds = Array.from(new Set(sales.flatMap((s) => s.items.map((it) => it.productId))));
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { units: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    const formatted = sales.map((sale: any) => {
      let totalKg = 0;
      let totalCostSnapshotPaisa = 0;

      const items = sale.items.map((it: any) => {
        const prod = productMap.get(it.productId);
        const unit = prod?.units.find((u: any) => u.id === it.unitId) || {
          id: it.unitId,
          nameBn: 'কেজি',
          nameEn: 'kg',
          kgPerUnit: 1,
          isBase: true,
        };
        const kg = Number(it.qtyKg);
        totalKg += kg;
        totalCostSnapshotPaisa += kg * Number(it.costPerKgSnapshot);

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
            wacPerKgPaisa: Number(it.costPerKgSnapshot),
            retailPricePaisa: Number(it.unitPricePaisa),
            wholesalePricePaisa: Number(it.unitPricePaisa),
            sack50RetailPricePaisa: 0,
            sack50WholesalePricePaisa: 0,
            availableUnits: prod?.units || [],
          },
          selectedUnit: {
            id: unit.id,
            nameBn: unit.nameBn,
            nameEn: unit.nameEn,
            kgPerUnit: Number(unit.kgPerUnit),
            isBase: unit.isBase,
          },
          unitQuantity: Number(it.qtyUnit),
          totalKg: kg,
          unitPricePaisa: Number(it.unitPricePaisa),
          discountPaisa: Number(it.discountPaisa),
          lineTotalPaisa: Number(it.lineTotalPaisa),
          costSnapshotPerKgPaisa: Number(it.costPerKgSnapshot),
        };
      });

      const grandTotal = Number(sale.grandTotalPaisa);
      const paidTotal = Number(sale.paidTotalPaisa);
      const dueAmount = Number(sale.dueAmountPaisa);

      return {
        id: sale.id,
        docNo: sale.docNo,
        date: sale.saleDate.toISOString(),
        clientName: sale.client?.name || 'খুচরা ক্রেতা (নগদ)',
        clientPhone: sale.client?.phone || '',
        clientType: sale.client?.clientType || 'walkin',
        warehouseId: sale.warehouseId,
        items,
        subtotalPaisa: Number(sale.subtotalPaisa),
        discountPaisa: Number(sale.discountPaisa),
        deliveryChargePaisa: Number(sale.deliveryChargePaisa),
        grandTotalPaisa: grandTotal,
        paidTotalPaisa: paidTotal,
        dueAmountPaisa: dueAmount,
        payments: [
          ...(paidTotal > 0 ? [{ method: 'cash' as const, amountPaisa: paidTotal }] : []),
          ...(dueAmount > 0 ? [{ method: 'due' as const, amountPaisa: dueAmount }] : []),
        ],
        status: sale.status,
        totalKg,
        totalCostSnapshotPaisa,
        estimatedProfitPaisa: Math.max(0, grandTotal - totalCostSnapshotPaisa),
        createdBy: 'ক্যাশিয়ার',
      };
    });

    res.json({
      success: true,
      data: formatted,
      sales: formatted,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/sales/:id - Invoice details
router.get('/:id', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const tenantId = req.tenantId!;
    const saleId = req.params.id as string;
    const sale = await prisma.sale.findFirst({
      where: { id: saleId, tenantId },
      include: {
        client: true,
        items: true,
      },
    });

    if (!sale) {
      return res.status(404).json({ error: 'Sale not found', message: 'চালানের তথ্য পাওয়া যায়নি' });
    }

    res.json({ sale });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/sales/:id/void - Void invoice and restore stock
router.post('/:id/void', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const tenantId = req.tenantId!;
    const saleId = req.params.id as string;
    const { reason } = req.body;

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const sale = await tx.sale.findFirst({
        where: { id: saleId, tenantId },
        include: { items: true, client: true },
      });

      if (!sale) throw new Error('চালান পাওয়া যায়নি');
      if (sale.status === 'voided') throw new Error('এই চালানটি আগেই বাতিল করা হয়েছে');

      // 1. Mark sale as voided
      const updatedSale = await tx.sale.update({
        where: { id: sale.id },
        data: { status: 'voided' },
      });

      // 2. Restore Stock to Warehouse and log StockMovement
      for (const item of (sale as any).items) {
        await tx.stockBalance.update({
          where: {
            tenantId_productId_warehouseId: {
              tenantId,
              productId: item.productId,
              warehouseId: sale.warehouseId,
            },
          },
          data: {
            qtyKg: { increment: Number(item.qtyKg) },
          },
        });

        await tx.stockMovement.create({
          data: {
            tenantId,
            productId: item.productId,
            warehouseId: sale.warehouseId,
            qtyKg: Number(item.qtyKg), // Positive restore
            unitCostPaisa: item.costPerKgSnapshot,
            movementType: 'adjustment',
            refType: 'sale',
            refId: sale.id,
            reason: `চালান বাতিলকরণ #${sale.docNo}: ${reason || 'ভুল এন্ট্রি'}`,
          },
        });
      }

      // 3. Reverse Client Ledger Due if any
      const duePaisa = Number(sale.dueAmountPaisa);
      if (duePaisa > 0 && sale.clientId) {
        const client = await tx.party.findUnique({
          where: { id: sale.clientId },
        });
        const currentBal = client ? Number(client.openingBalance) : 0;
        const updatedBal = currentBal - duePaisa;

        await tx.party.update({
          where: { id: sale.clientId },
          data: { openingBalance: BigInt(updatedBal) },
        });

        await tx.partyLedger.create({
          data: {
            tenantId,
            partyId: sale.clientId,
            entryType: 'adjustment',
            refType: 'sale',
            refId: sale.id,
            debitPaisa: BigInt(0),
            creditPaisa: BigInt(duePaisa), // Reversed due
            runningBalance: BigInt(updatedBal),
          },
        });
      }

      return updatedSale;
    });

    res.json({
      message: 'চালান সফলভাবে বাতিল করা হয়েছে এবং গোডাউনে চাল ফেরত নেওয়া হয়েছে',
      sale: result,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
