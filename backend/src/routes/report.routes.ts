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

// GET /api/v1/reports/daily - Daily Sales & Cash Summary
router.get('/daily', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const tenantId = req.tenantId!;
    const dateParam = (req.query.date as string) || new Date().toISOString().split('T')[0];

    const startOfDay = new Date(`${dateParam}T00:00:00.000Z`);
    const endOfDay = new Date(`${dateParam}T23:59:59.999Z`);

    const sales = await prisma.sale.findMany({
      where: {
        tenantId,
        saleDate: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        items: true,
        client: true,
      },
    });

    const activeSales = sales.filter((s) => s.status === 'confirmed');
    const voidSales = sales.filter((s) => s.status === 'voided');

    const totalSalesAmountPaisa = activeSales.reduce((sum, s) => sum + Number(s.grandTotalPaisa), 0);
    const totalCashCollectedPaisa = activeSales.reduce((sum, s) => sum + Number(s.paidTotalPaisa), 0);
    const totalDueGeneratedPaisa = activeSales.reduce((sum, s) => sum + Number(s.dueAmountPaisa), 0);

    let totalCogsPaisa = 0;
    for (const s of activeSales) {
      for (const it of s.items) {
        totalCogsPaisa += Number(it.qtyKg) * Number(it.costPerKgSnapshot);
      }
    }
    const grossProfitPaisa = totalSalesAmountPaisa - totalCogsPaisa;

    // Expenses for the day
    const expenses = await prisma.expense.findMany({
      where: {
        tenantId,
        spentAt: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        category: true,
      },
    });
    const totalExpensesPaisa = expenses.reduce((sum, e) => sum + Number(e.amountPaisa), 0);

    // Day close record
    const dayClosing = await prisma.dayClosing.findFirst({
      where: {
        tenantId,
        date: { gte: startOfDay, lte: endOfDay },
      },
    });

    res.json({
      success: true,
      data: {
        date: dateParam,
        isClosed: !!dayClosing,
        closedAt: dayClosing?.createdAt || null,
        notes: dayClosing?.note || null,
        salesCount: activeSales.length,
        voidSalesCount: voidSales.length,
        totalSalesAmountPaisa,
        totalCashCollectedPaisa,
        totalDueGeneratedPaisa,
        totalCogsPaisa,
        grossProfitPaisa,
        totalExpensesPaisa,
        netCashFlowPaisa: totalCashCollectedPaisa - totalExpensesPaisa,
        expenses: expenses.map((e) => ({
          id: e.id,
          category: e.category?.nameBn || 'অন্যান্য',
          amountPaisa: Number(e.amountPaisa),
          note: e.note,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/reports/inventory-valuation - Godown-wise stock & valuation
router.get('/inventory-valuation', async (req: AuthenticatedRequest, res: Response, next) => {
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

    let grandTotalStockKg = 0;
    let grandTotalValuationPaisa = 0;

    const godowns = warehouses.map((wh) => {
      let whTotalKg = 0;
      let whTotalValuationPaisa = 0;

      const items = wh.balances.map((sb: any) => {
        const stockKg = Number(sb.qtyKg);
        const wacPerKgPaisa = Number(sb.avgCostPaisa);
        const valuationPaisa = Math.round(stockKg * wacPerKgPaisa);

        whTotalKg += stockKg;
        whTotalValuationPaisa += valuationPaisa;

        return {
          productId: sb.productId,
          productNameBn: sb.product.nameBn,
          variety: sb.product.variety,
          grade: sb.product.grade,
          stockKg,
          bags50: Math.floor(stockKg / 50),
          looseKg: stockKg % 50,
          wacPerKgPaisa,
          valuationPaisa,
        };
      });

      grandTotalStockKg += whTotalKg;
      grandTotalValuationPaisa += whTotalValuationPaisa;

      return {
        warehouseId: wh.id,
        warehouseNameBn: wh.name,
        warehouseCode: wh.id.slice(0, 8),
        totalStockKg: whTotalKg,
        totalBags50: Math.floor(whTotalKg / 50),
        totalValuationPaisa: whTotalValuationPaisa,
        items,
      };
    });

    res.json({
      success: true,
      data: {
        grandTotalStockKg,
        grandTotalBags50: Math.floor(grandTotalStockKg / 50),
        grandTotalValuationPaisa,
        godowns,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
