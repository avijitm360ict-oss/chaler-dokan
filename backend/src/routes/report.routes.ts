import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthenticatedRequest } from '../middleware/tenant';

const router = Router();

// GET /api/v1/reports/summary - Owner Dashboard & KPI summary
router.get('/summary', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const tenantId = req.tenantId!;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // 1. Sales today
    const todaySales = await prisma.sale.findMany({
      where: {
        tenantId,
        status: 'confirmed',
        saleDate: { gte: todayStart },
      },
      include: {
        items: true,
      },
    });

    const totalSalesAmountPaisa = todaySales.reduce(
      (sum, s) => sum + Number(s.grandTotalPaisa),
      0
    );
    const totalSalesPaidPaisa = todaySales.reduce(
      (sum, s) => sum + Number(s.paidTotalPaisa),
      0
    );
    const totalSalesDuePaisa = todaySales.reduce(
      (sum, s) => sum + Number(s.dueAmountPaisa),
      0
    );

    // Calculate gross profit today
    let totalCogsPaisa = 0;
    for (const s of todaySales) {
      for (const it of s.items) {
        totalCogsPaisa += Number(it.qtyKg) * Number(it.costPerKgSnapshot);
      }
    }
    const todayGrossProfitPaisa = totalSalesAmountPaisa - totalCogsPaisa;

    // 2. Total Receivables from clients (পাবেন)
    const clientParties = await prisma.party.findMany({
      where: { tenantId, isClient: true, status: 'active' },
      include: {
        ledgerEntries: {
          orderBy: { entryDate: 'desc' },
          take: 1,
        },
      },
    });

    let totalReceivablePaisa = 0;
    for (const p of clientParties) {
      const bal =
        p.ledgerEntries.length > 0
          ? Number(p.ledgerEntries[0].runningBalance)
          : Number(p.openingBalance);
      if (bal > 0) totalReceivablePaisa += bal;
    }

    // 3. Total Payables to suppliers (দেবেন)
    const vendorParties = await prisma.party.findMany({
      where: { tenantId, isVendor: true, status: 'active' },
      include: {
        ledgerEntries: {
          orderBy: { entryDate: 'desc' },
          take: 1,
        },
      },
    });

    let totalPayablePaisa = 0;
    for (const p of vendorParties) {
      const bal =
        p.ledgerEntries.length > 0
          ? Number(p.ledgerEntries[0].runningBalance)
          : Number(p.openingBalance);
      if (bal < 0) totalPayablePaisa += Math.abs(bal);
    }

    // 4. Cash in Hand & Accounts
    const accounts = await prisma.account.findMany({
      where: { tenantId, status: 'active' },
    });
    const cashInHandPaisa = accounts
      .filter((a) => a.type === 'cash')
      .reduce((sum, a) => sum + Number(a.currentBalance), 0);
    const totalBankBalancePaisa = accounts
      .filter((a) => a.type !== 'cash')
      .reduce((sum, a) => sum + Number(a.currentBalance), 0);

    // 5. Stock Valuation
    const balances = await prisma.stockBalance.findMany({
      where: { tenantId },
    });
    let totalStockKg = 0;
    let totalStockValuationPaisa = 0;
    for (const b of balances) {
      const kg = Number(b.qtyKg);
      totalStockKg += kg;
      totalStockValuationPaisa += kg * Number(b.avgCostPaisa);
    }

    res.json({
      success: true,
      data: {
        today: {
          salesCount: todaySales.length,
          salesAmountPaisa: totalSalesAmountPaisa,
          salesPaidPaisa: totalSalesPaidPaisa,
          salesDuePaisa: totalSalesDuePaisa,
          grossProfitPaisa: todayGrossProfitPaisa,
        },
        financials: {
          totalReceivablePaisa, // পাবেন
          totalPayablePaisa,    // দেবেন
          cashInHandPaisa,      // নগদ ক্যাশ
          totalBankBalancePaisa,
        },
        inventory: {
          totalStockKg,
          totalStockValuationPaisa,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/reports/dues - Aging and Due list
router.get('/dues', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const tenantId = req.tenantId!;

    const parties = await prisma.party.findMany({
      where: { tenantId, status: 'active' },
      include: {
        ledgerEntries: {
          orderBy: { entryDate: 'desc' },
          take: 1,
        },
      },
    });

    const dues = parties
      .map((p) => {
        const bal =
          p.ledgerEntries.length > 0
            ? Number(p.ledgerEntries[0].runningBalance)
            : Number(p.openingBalance);
        return {
          id: p.id,
          name: p.name,
          phone: p.phone,
          shopName: p.shopName || '',
          isClient: p.isClient,
          isVendor: p.isVendor,
          balancePaisa: bal,
          creditLimitPaisa: Number(p.creditLimit),
          isExceeded: Number(p.creditLimit) > 0 && bal > Number(p.creditLimit),
        };
      })
      .filter((p) => p.balancePaisa !== 0)
      .sort((a, b) => Math.abs(b.balancePaisa) - Math.abs(a.balancePaisa));

    res.json({
      success: true,
      data: dues,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
