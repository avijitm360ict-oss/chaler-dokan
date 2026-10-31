import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { AuthenticatedRequest } from '../middleware/tenant';
import { requireRole } from '../middleware/auth';

const router = Router();

const createAccountSchema = z.object({
  name: z.string().min(1, 'একাউন্টের নাম আবশ্যক'),
  type: z.enum(['cash', 'bank', 'mobile_wallet']),
  openingBalancePaisa: z.number().default(0),
});

const createExpenseSchema = z.object({
  categoryId: z.string().min(1, 'খরচের খাত সিলেক্ট করুন'),
  accountId: z.string().min(1, 'পেমেন্ট একাউন্ট সিলেক্ট করুন'),
  amountPaisa: z.number().positive('খরচের পরিমাণ ০ এর বেশি হতে হবে'),
  note: z.string().optional(),
  spentAt: z.string().optional(),
});

const dayCloseSchema = z.object({
  countedCashPaisa: z.number().min(0, 'হাতে গোনা ক্যাশ ঋণাত্মক হতে পারে না'),
  closedBy: z.string().default('মালিক'),
  note: z.string().optional(),
});

// GET /api/v1/accounts - List all cash, bank & mobile accounts
router.get('/', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const tenantId = req.tenantId!;
    const accounts = await prisma.account.findMany({
      where: { tenantId, status: 'active' },
      orderBy: { createdAt: 'asc' },
    });

    const formatted = accounts.map((acc: any) => ({
      id: acc.id,
      name: acc.name,
      type: acc.type,
      openingBalancePaisa: Number(acc.openingBalance),
      currentBalancePaisa: Number(acc.currentBalance),
      status: acc.status,
    }));

    res.json({
      success: true,
      data: formatted,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/accounts - Create new account (Owner Only)
router.post('/', requireRole(['Owner', 'Super Admin']), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const tenantId = req.tenantId!;
    const data = createAccountSchema.parse(req.body);

    const account = await prisma.account.create({
      data: {
        tenantId,
        name: data.name,
        type: data.type,
        openingBalance: BigInt(data.openingBalancePaisa),
        currentBalance: BigInt(data.openingBalancePaisa),
      },
    });

    res.status(201).json({
      success: true,
      message: 'একাউন্ট সফলভাবে তৈরি হয়েছে',
      data: {
        ...account,
        openingBalancePaisa: Number(account.openingBalance),
        currentBalancePaisa: Number(account.currentBalance),
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/accounts/expense-categories - List categories
router.get('/expense-categories', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const tenantId = req.tenantId!;
    const categories = await prisma.expenseCategory.findMany({
      where: { tenantId },
      orderBy: { nameBn: 'asc' },
    });

    res.json({
      success: true,
      data: categories,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/accounts/expense-categories - Add category
router.post('/expense-categories', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const tenantId = req.tenantId!;
    const { nameBn, nameEn } = req.body;
    if (!nameBn) {
      return res.status(400).json({ success: false, message: 'খরচের খাতের নাম আবশ্যক' });
    }

    const cat = await prisma.expenseCategory.create({
      data: {
        tenantId,
        nameBn,
        nameEn: nameEn || nameBn,
      },
    });

    res.status(201).json({
      success: true,
      data: cat,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/accounts/expenses - List expenses
router.get('/expenses', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const tenantId = req.tenantId!;
    const expenses = await prisma.expense.findMany({
      where: { tenantId },
      include: {
        category: true,
        account: true,
      },
      orderBy: { spentAt: 'desc' },
      take: 50,
    });

    const formatted = expenses.map((exp: any) => ({
      id: exp.id,
      categoryName: exp.category.nameBn,
      accountName: exp.account.name,
      amountPaisa: Number(exp.amountPaisa),
      spentAt: exp.spentAt,
      note: exp.note,
    }));

    res.json({
      success: true,
      data: formatted,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/accounts/expenses - Record expense
router.post('/expenses', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const tenantId = req.tenantId!;
    const data = createExpenseSchema.parse(req.body);

    const result = await prisma.$transaction(async (tx) => {
      const account = await tx.account.findFirst({
        where: { id: data.accountId, tenantId },
      });
      if (!account) throw new Error('সিলেক্টেড পেমেন্ট একাউন্ট পাওয়া যায়নি');

      const category = await tx.expenseCategory.findFirst({
        where: { id: data.categoryId, tenantId },
      });
      if (!category) throw new Error('সিলেক্টেড খরচের খাত পাওয়া যায়নি');

      const expense = await tx.expense.create({
        data: {
          tenantId,
          categoryId: data.categoryId,
          accountId: data.accountId,
          amountPaisa: BigInt(data.amountPaisa),
          note: data.note,
          spentAt: data.spentAt ? new Date(data.spentAt) : new Date(),
        },
        include: { category: true, account: true },
      });

      // Deduct from account
      await tx.account.update({
        where: { id: account.id },
        data: {
          currentBalance: {
            decrement: BigInt(data.amountPaisa),
          },
        },
      });

      return expense;
    });

    res.status(201).json({
      success: true,
      message: 'খরচ সফলভাবে এন্ট্রি হয়েছে',
      data: {
        id: result.id,
        categoryName: result.category.nameBn,
        accountName: result.account.name,
        amountPaisa: Number(result.amountPaisa),
        spentAt: result.spentAt,
        note: result.note,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/accounts/day-close/summary - Calculate system cash for day-closing
router.get('/day-close/summary', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const tenantId = req.tenantId!;

    // Find cash account
    const cashAccount = await prisma.account.findFirst({
      where: { tenantId, type: 'cash' },
    });

    const expectedCashPaisa = cashAccount ? Number(cashAccount.currentBalance) : 0;

    // Check today's closing status
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayClose = await prisma.dayClosing.findFirst({
      where: {
        tenantId,
        date: { gte: startOfDay },
      },
    });

    res.json({
      success: true,
      data: {
        isClosedToday: !!todayClose,
        todayCloseRecord: todayClose,
        expectedSystemCashPaisa: expectedCashPaisa,
        cashAccountName: cashAccount?.name || 'ক্যাশ ড্রয়ার',
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/accounts/day-close - Perform Day Close (Privileged only)
router.post('/day-close', requireRole(['Owner', 'Manager', 'Super Admin']), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const tenantId = req.tenantId!;
    const data = dayCloseSchema.parse(req.body);

    const cashAccount = await prisma.account.findFirst({
      where: { tenantId, type: 'cash' },
    });
    const systemCashPaisa = cashAccount ? Number(cashAccount.currentBalance) : 0;
    const differencePaisa = data.countedCashPaisa - systemCashPaisa;

    const closingDate = new Date();
    closingDate.setHours(0, 0, 0, 0);

    const dayClosing = await prisma.dayClosing.upsert({
      where: {
        tenantId_date: {
          tenantId,
          date: closingDate,
        },
      },
      update: {
        systemCashPaisa: BigInt(systemCashPaisa),
        countedCashPaisa: BigInt(data.countedCashPaisa),
        differencePaisa: BigInt(differencePaisa),
        closedBy: data.closedBy,
        note: data.note,
      },
      create: {
        tenantId,
        date: closingDate,
        systemCashPaisa: BigInt(systemCashPaisa),
        countedCashPaisa: BigInt(data.countedCashPaisa),
        differencePaisa: BigInt(differencePaisa),
        closedBy: data.closedBy,
        note: data.note,
      },
    });

    res.status(201).json({
      success: true,
      message: 'আজকের দিনের হিসাব সফলভাবে সম্পন্ন (Day Close) হয়েছে',
      data: {
        id: dayClosing.id,
        date: dayClosing.date,
        systemCashPaisa: Number(dayClosing.systemCashPaisa),
        countedCashPaisa: Number(dayClosing.countedCashPaisa),
        differencePaisa: Number(dayClosing.differencePaisa),
        status: differencePaisa === 0 ? 'balanced' : differencePaisa > 0 ? 'excess' : 'shortage',
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
