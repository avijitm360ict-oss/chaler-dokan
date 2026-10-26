import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { AuthenticatedRequest } from '../middleware/tenant';
import { getNextDocNo } from '../utils/docSequence';

const router = Router();

const saleReturnSchema = z.object({
  saleId: z.string().optional(),
  clientId: z.string().optional(),
  warehouseId: z.string().min(1, 'গোডাউন সিলেক্ট করুন'),
  productId: z.string().min(1, 'চাল নির্বাচন করুন'),
  unitId: z.string().min(1, 'প্যাকেজিং ইউনিট নির্বাচন করুন'),
  qtyUnit: z.number().positive('পরিমাণ ০ এর বেশি হতে হবে'),
  refundAmountPaisa: z.number().min(0),
  reason: z.string().min(1, 'ফেরতের কারণ উল্লেখ করুন'),
  refundAccountId: z.string().optional(), // if cash was refunded immediately
});

// POST /api/v1/returns/sale - Process Sale Return (Credit Note)
router.post('/sale', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const tenantId = req.tenantId!;
    const data = saleReturnSchema.parse(req.body);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch product & unit
      const product = await tx.product.findFirst({
        where: { id: data.productId, tenantId },
      });
      if (!product) throw new Error('পণ্য পাওয়া যায়নি');

      const unit = await tx.productUnit.findFirst({
        where: { id: data.unitId, tenantId },
      });
      if (!unit) throw new Error('প্যাকেজিং ইউনিট পাওয়া যায়নি');

      const returnQtyKg = data.qtyUnit * Number(unit.kgPerUnit);
      const docNo = await getNextDocNo(tx, tenantId, 'sale_return', 'SRT');

      // 2. Restore warehouse stock balance
      const balance = await tx.stockBalance.upsert({
        where: {
          tenantId_productId_warehouseId: {
            tenantId,
            productId: product.id,
            warehouseId: data.warehouseId,
          },
        },
        update: {
          qtyKg: { increment: returnQtyKg },
        },
        create: {
          tenantId,
          productId: product.id,
          warehouseId: data.warehouseId,
          qtyKg: returnQtyKg,
        },
      });

      // 3. Record stock movement
      await tx.stockMovement.create({
        data: {
          tenantId,
          productId: product.id,
          warehouseId: data.warehouseId,
          qtyKg: returnQtyKg,
          movementType: 'sale_return',
          refType: 'sale_return',
          refId: docNo,
          reason: data.reason,
        },
      });

      // 4. If customer ledger adjustment needed
      if (data.clientId) {
        const lastLedger = await tx.partyLedger.findFirst({
          where: { tenantId, partyId: data.clientId },
          orderBy: { entryDate: 'desc' },
        });
        const currentBal = lastLedger ? Number(lastLedger.runningBalance) : 0;
        const newBal = currentBal - data.refundAmountPaisa;

        await tx.partyLedger.create({
          data: {
            tenantId,
            partyId: data.clientId,
            entryType: 'sale_return',
            refType: 'sale_return',
            refId: docNo,
            creditPaisa: BigInt(data.refundAmountPaisa),
            runningBalance: BigInt(newBal),
          },
        });
      }

      // 5. If immediate cash refund was paid out
      if (data.refundAccountId && data.refundAmountPaisa > 0) {
        await tx.account.update({
          where: { id: data.refundAccountId },
          data: {
            currentBalance: {
              decrement: BigInt(data.refundAmountPaisa),
            },
          },
        });
      }

      return {
        docNo,
        returnedKg: returnQtyKg,
        newStockKg: Number(balance.qtyKg),
      };
    });

    res.status(201).json({
      success: true,
      message: 'বিক্রয় ফেরত সফলভাবে সম্পন্ন হয়েছে এবং স্টক পুনরুদ্ধার করা হয়েছে',
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

const purchaseReturnSchema = z.object({
  purchaseId: z.string().optional(),
  vendorId: z.string().optional(),
  warehouseId: z.string().min(1, 'গোডাউন সিলেক্ট করুন'),
  productId: z.string().min(1, 'চাল নির্বাচন করুন'),
  unitId: z.string().min(1, 'প্যাকেজিং ইউনিট নির্বাচন করুন'),
  qtyUnit: z.number().positive('পরিমাণ ০ এর বেশি হতে হবে'),
  returnAmountPaisa: z.number().min(0),
  reason: z.string().min(1, 'ফেরতের কারণ উল্লেখ করুন'),
  refundAccountId: z.string().optional(),
});

// POST /api/v1/returns/purchase - Process Purchase Return (Debit Note)
router.post('/purchase', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const tenantId = req.tenantId!;
    const data = purchaseReturnSchema.parse(req.body);

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findFirst({
        where: { id: data.productId, tenantId },
      });
      if (!product) throw new Error('পণ্য পাওয়া যায়নি');

      const unit = await tx.productUnit.findFirst({
        where: { id: data.unitId, tenantId },
      });
      if (!unit) throw new Error('প্যাকেজিং ইউনিট পাওয়া যায়নি');

      const returnQtyKg = data.qtyUnit * Number(unit.kgPerUnit);
      const docNo = await getNextDocNo(tx, tenantId, 'purchase_return', 'PRT');

      const balance = await tx.stockBalance.update({
        where: {
          tenantId_productId_warehouseId: {
            tenantId,
            productId: product.id,
            warehouseId: data.warehouseId,
          },
        },
        data: {
          qtyKg: { decrement: returnQtyKg },
        },
      });

      await tx.stockMovement.create({
        data: {
          tenantId,
          productId: product.id,
          warehouseId: data.warehouseId,
          qtyKg: -returnQtyKg,
          movementType: 'purchase_return',
          refType: 'purchase_return',
          refId: docNo,
          reason: data.reason,
        },
      });

      if (data.vendorId) {
        const lastLedger = await tx.partyLedger.findFirst({
          where: { tenantId, partyId: data.vendorId },
          orderBy: { entryDate: 'desc' },
        });
        const currentBal = lastLedger ? Number(lastLedger.runningBalance) : 0;
        const newBal = currentBal - data.returnAmountPaisa;

        await tx.partyLedger.create({
          data: {
            tenantId,
            partyId: data.vendorId,
            entryType: 'purchase_return',
            refType: 'purchase_return',
            refId: docNo,
            debitPaisa: BigInt(data.returnAmountPaisa),
            runningBalance: BigInt(newBal),
          },
        });
      }

      if (data.refundAccountId && data.returnAmountPaisa > 0) {
        await tx.account.update({
          where: { id: data.refundAccountId },
          data: {
            currentBalance: {
              increment: BigInt(data.returnAmountPaisa),
            },
          },
        });
      }

      return {
        docNo,
        returnedKg: returnQtyKg,
        newStockKg: Number(balance.qtyKg),
      };
    });

    res.status(201).json({
      success: true,
      message: 'ক্রয় ফেরত সফলভাবে সম্পন্ন হয়েছে এবং ডেবিট নোট তৈরি হয়েছে',
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
